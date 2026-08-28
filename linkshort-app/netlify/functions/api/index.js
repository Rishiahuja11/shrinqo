// Netlify Function adapter for Shrinqo.
//
// Uses Turso embedded replicas for persistence: syncs a local SQLite file to/from
// Turso, then the main server.js queries the LOCAL file (sync, zero changes to
// existing DB call sites).
'use strict';
const path = require('path');
const fs = require('fs');

// Turso sync must happen BEFORE server.js opens the DB.
const tursoPath = fs.existsSync(path.join(__dirname, '_server', 'turso-sync.js'))
  ? './_server/turso-sync' : './turso-sync';
const turso = require(tursoPath);

exports.handler = async (event, context) => {
  // On first invocation (cold start): sync DB from Turso → /tmp/shrinqo.db
  if (!turso.tursoSynced) {
    await turso.syncDown();
  }

  // Only load server.js + handleRequest AFTER the first sync completes.
  // This ensures the local SQLite file is populated from Turso before opening.
  if (!global.__shrinqo_loaded) {
    // DB_PATH must be set so server.js opens the synced Turso file.
    if (!process.env.DB_PATH) {
      process.env.DB_PATH = '/tmp';
    }
    try { fs.mkdirSync(process.env.DB_PATH, { recursive: true }); } catch (e) {}

    // Require server.js (which opens the local SQLite at /tmp/shrinqo.db)
    const serverPath = fs.existsSync(path.join(__dirname, '_server', 'server.js'))
      ? './_server/server.js' : './server.js';
    require(serverPath);
    global.__shrinqo_loaded = true;
  }

  const serverPath = fs.existsSync(path.join(__dirname, '_server', 'server.js'))
    ? './_server/server.js' : './server.js';
  const { handleRequest } = require(serverPath);

  const { httpMethod, path: p, pathname, queryStringParameters, headers, body, isBase64Encoded } = event;

  // Build query string
  const params = new URLSearchParams();
  if (queryStringParameters) {
    for (const k of Object.keys(queryStringParameters)) {
      const v = queryStringParameters[k];
      if (Array.isArray(v)) v.forEach(x => params.append(k, x));
      else params.append(k, v == null ? '' : v);
    }
  }
  const qs = params.toString();
  const url = (p || pathname || '/') + (qs ? '?' + qs : '');

  // Lowercase headers
  const reqHeaders = {};
  for (const k of Object.keys(headers || {})) reqHeaders[k.toLowerCase()] = headers[k];

  // Body
  let rawBody = Buffer.alloc(0);
  if (body) {
    try {
      rawBody = isBase64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body, 'utf8');
      reqHeaders['content-length'] = String(rawBody.length);
    } catch (e) {}
  }

  // Shim req
  const req = {
    url, method: httpMethod, headers: reqHeaders,
    socket: { remoteAddress: (reqHeaders['x-nf-client-connection-ip'] || (reqHeaders['x-forwarded-for'] || '').split(',')[0].trim() || '0.0.0.0') },
    _emitters: new Map(),
    on(evt, cb) { this._emitters.set(evt, cb); return this; },
    once(evt, cb) { this._emitters.set(evt, cb); return this; },
    destroy() { this._destroyed = true; },
    __emit(evt, arg) { const cb = this._emitters.get(evt); if (cb) cb(arg); },
    removeListener(evt) { this._emitters.delete(evt); return this; },
  };
  process.nextTick(() => {
    if (rawBody.length) req.__emit('data', rawBody);
    req.__emit('end');
  });

  // Shim res
  const captured = { statusCode: 200, headers: {}, body: Buffer.alloc(0) };
  const res = {
    _secure: true, // Netlify always serves over HTTPS
    writeHead(code, hdrs) { captured.statusCode = code; if (hdrs) Object.assign(captured.headers, hdrs); return this; },
    setHeader(n, v) { captured.headers[n.toLowerCase()] = v; return this; },
    write(chunk) { captured.body = Buffer.concat([captured.body, Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))]); return true; },
    end(chunk) { if (chunk !== undefined) this.write(chunk); return this; },
    destroy() {},
  };

  await handleRequest(req, res);

  // Push local changes back to Turso (fire-and-forget)
  turso.syncUp().catch(() => {});

  const { statusCode, headers: resHeaders } = captured;
  let responseBody = captured.body;
  let isBase64 = false;
  const ct = String(resHeaders['content-type'] || '');
  const isBinary = /^image\//i.test(ct) || /^video\//i.test(ct) || /^audio\//i.test(ct) || /octet-stream/i.test(ct) || /application\/zip/i.test(ct) || /application\/pdf/i.test(ct) || /application\/vnd/i.test(ct);
  if (isBinary) { isBase64 = true; responseBody = responseBody.toString('base64'); }
  else { responseBody = responseBody.toString('utf8'); }

  return { statusCode, headers: resHeaders, body: responseBody, isBase64Encoded: isBase64 };
};
