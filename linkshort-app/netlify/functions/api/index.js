// Netlify Function adapter for Shrinqo.
//
// Reuses the exact same request handler as the standalone server (server.js),
// but shims the Netlify event/context into Node-style http req/res objects so
// the ~450-line router needs no rewriting.
//
// NOTE: Netlify Functions are serverless/ephemeral. The SQLite DB lives under
// /tmp (configurable via DB_PATH) and is NOT durable across cold starts. This
// is fine for testing; see linkshort-app/README or netlify.toml comments.
'use strict';

const path = require('path');
const fs = require('fs');

// Force a temp/durable writable location for the SQLite DB inside the function
// sandbox. Netlify gives a writable /tmp. DB_PATH in server.js defaults to
// __dirname which is read-only inside the bundle, so we must redirect it.
// IMPORTANT: this MUST happen BEFORE requiring server.js, which reads DB_PATH
// at module load time.
if (!process.env.DB_PATH) {
  process.env.DB_PATH = path.join('/tmp', 'shrinqo');
}
try { fs.mkdirSync(process.env.DB_PATH, { recursive: true }); } catch (e) { /* ignore */ }

// The build script (netlify/build-functions.sh) copies server.js + public/ into
// this bundle dir so Netlify ships a self-contained function. server.js reads
// its static files relative to __dirname, so public must sit beside it.
const { handleRequest } = require('./_server/server.js');

// Capture the response written by the handler into a Netlify-compatible shape.
function makeRes() {
  const captured = {
    statusCode: 200,
    headers: {},
    body: Buffer.alloc(0),
  };
  return {
    _captured: captured,
    writeHead(statusCode, headers) {
      captured.statusCode = statusCode;
      if (headers) Object.assign(captured.headers, headers);
      return this;
    },
    setHeader(name, value) { captured.headers[name.toLowerCase()] = value; return this; },
    write(chunk) {
      captured.body = Buffer.concat([captured.body, Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))]);
      return true;
    },
    end(chunk) {
      if (chunk !== undefined) this.write(chunk);
      return this;
    },
    destroy() {},
  };
}

// Build a Node-style IncomingMessage the handler (and helpers) expect.
function makeReq(event) {
  const {
    httpMethod: method,
    path: p,
    pathname,
    queryStringParameters,
    multiValueQueryStringParameters,
    headers,
    body,
    isBase64Encoded,
  } = event;

  // Rebuild the raw request URL (path + query) the way Node's req.url looks.
  const params = new URLSearchParams();
  if (queryStringParameters) {
    for (const k of Object.keys(queryStringParameters)) {
      const v = queryStringParameters[k];
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
      else params.append(k, v == null ? '' : v);
    }
  }
  if (multiValueQueryStringParameters) {
    for (const k of Object.keys(multiValueQueryStringParameters)) {
      multiValueQueryStringParameters[k].forEach((x) => params.append(k, x));
    }
  }
  const qs = params.toString();
  const url = (p || pathname || '/') + (qs ? '?' + qs : '');

  const reqHeaders = {};
  for (const k of Object.keys(headers || {})) {
    reqHeaders[k.toLowerCase()] = headers[k];
  }
  // Netlify passes the host separately; make it available like Node does.
  if (reqHeaders['host'] === undefined && event.headers && event.headers.host) {
    reqHeaders['host'] = event.headers.host;
  }

  let rawBody = Buffer.alloc(0);
  if (body) {
    try {
      rawBody = isBase64Encoded
        ? Buffer.from(body, 'base64')
        : Buffer.from(body, 'utf8');
      reqHeaders['content-length'] = String(rawBody.length);
    } catch (e) { /* ignore malformed body */ }
  }

  const req = {
    url,
    method,
    headers: reqHeaders,
    socket: { remoteAddress: (reqHeaders['x-nf-client-connection-ip'] || (reqHeaders['x-forwarded-for'] || '').split(',')[0].trim() || '0.0.0.0') },
    _emitters: new Map(),
    on(evt, cb) { this._emitters.set(evt, cb); return this; },
    once(evt, cb) { this._emitters.set(evt, cb); return this; },
    destroy() { this._destroyed = true; },
    __emit(evt, arg) { const cb = this._emitters.get(evt); if (cb) cb(arg); },
    removeListener(evt) { this._emitters.delete(evt); return this; },
  };

  // Deliver the body synchronously to the handler's Promise-based reader.
  process.nextTick(() => {
    if (rawBody.length) req.__emit('data', rawBody);
    req.__emit('end');
  });

  return req;
}

exports.handler = async (event, context) => {
  // Netlify may suffix the function path; the handler parses pathname from url.
  const req = makeReq(event);
  const res = makeRes();

  // The handler is async; it may or may not return before res.end writes.
  await handleRequest(req, res);

  const { statusCode, headers } = res._captured;
  let responseBody = res._captured.body;
  let isBase64 = false;

  const ct = String(headers['content-type'] || '');
  const isBinary =
    /^image\//i.test(ct) ||
    /^video\//i.test(ct) ||
    /^audio\//i.test(ct) ||
    /octet-stream/i.test(ct) ||
    /application\/zip/i.test(ct) ||
    /application\/pdf/i.test(ct) ||
    /application\/vnd/i.test(ct);

  if (isBinary) {
    isBase64 = true;
    responseBody = responseBody.toString('base64');
  } else {
    responseBody = responseBody.toString('utf8');
  }

  return {
    statusCode,
    headers,
    body: responseBody,
    isBase64Encoded: isBase64,
  };
};
