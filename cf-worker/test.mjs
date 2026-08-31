import worker from './src/worker.js';

const FILE_CHUNK = 8388608;

function makeKV() {
  const m = new Map();
  return {
    async get(key, type) {
      const v = m.get(key);
      if (v === undefined) return null;
      if (type === 'json') return JSON.parse(v);
      return v;
    },
    async put(key, value) { m.set(key, String(value)); },
    async delete(key) { m.delete(key); },
    async list() { return { keys: [...m.keys()] }; },
    dump() { return Object.fromEntries(m); }
  };
}

function makeCtx() {
  const pending = [];
  return { waitUntil(p) { pending.push(p); }, async flush() { await Promise.all(pending); } };
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

async function req(worker, env, ctx, method, path, { ua, body, ip, cookie } = {}) {
  const headers = { 'CF-Connecting-IP': ip || '1.2.3.4' };
  if (ua) headers['User-Agent'] = ua;
  if (cookie) headers['Cookie'] = cookie;
  const r = new Request('https://test.local' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return worker.fetch(r, env, ctx);
}

async function rawReq(worker, env, ctx, method, path, { ip, extraHeaders, body } = {}) {
  const headers = { 'CF-Connecting-IP': ip || '1.2.3.4' };
  Object.assign(headers, extraHeaders || {});
  const r = new Request('https://test.local' + path, { method, headers, body });
  return worker.fetch(r, env, ctx);
}

const env = { KV: makeKV(), GITHUB_TOKEN: 'test-token', GITHUB_OWNER: 'Rishiahuja11', GITHUB_REPO: 'file2link-storage', GITHUB_BRANCH: 'main' };
const envNoGh = { KV: makeKV(), GITHUB_OWNER: 'Rishiahuja11', GITHUB_REPO: 'file2link-storage' };
const ctx = makeCtx();
const kvDump = () => env.KV.dump();

function makeGitHubMock() {
  const refs = new Map([['refs/heads/main', 'c1']]);
  const commits = new Map([['c1', { tree: 't0' }]]);
  const trees = new Map([['t0', new Map()]]);
  const blobs = new Map();
  let seq = 10;
  const sh = () => 's' + (seq++);
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    if (u.hostname === 'api.github.com') {
      const path = u.pathname;
      const method = (init.method || 'GET').toUpperCase();
      const body = init.body ? JSON.parse(init.body) : null;
      const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
      if (method === 'GET' && path.endsWith('/git/refs/heads/main')) return json({ object: { sha: refs.get('refs/heads/main') } });
      const mCommit = path.match(/\/repos\/[^/]+\/[^/]+\/git\/commits\/(.+)$/);
      if (method === 'GET' && mCommit) {
        const c = commits.get(decodeURIComponent(mCommit[1]));
        return c ? json({ tree: { sha: c.tree } }) : json({ message: 'not found' }, 404);
      }
      const mTree = path.match(/\/repos\/[^/]+\/[^/]+\/git\/trees\/([^?]+)(?:\?.*)?$/);
      if (method === 'GET' && mTree) {
        const t = trees.get(decodeURIComponent(mTree[1]));
        if (!t) return json({ message: 'not found' }, 404);
        return json({ tree: [...t].map(([p, sha]) => ({ path: p, mode: '100644', type: 'blob', sha })) });
      }
      if (method === 'POST' && path.endsWith('/git/blobs')) {
        const sha = sh();
        blobs.set(sha, body.content);
        return json({ sha });
      }
      if (method === 'POST' && path.endsWith('/git/trees')) {
        const sha = sh();
        const nt = new Map();
        if (body.base_tree) for (const [p, s] of trees.get(body.base_tree)) nt.set(p, s);
        for (const e of body.tree) nt.set(e.path, e.sha);
        trees.set(sha, nt);
        return json({ sha });
      }
      if (method === 'POST' && path.endsWith('/git/commits')) {
        const sha = sh();
        commits.set(sha, { tree: body.tree, message: body.message });
        return json({ sha });
      }
      if (method === 'PATCH' && path.endsWith('/git/refs/heads/main')) {
        refs.set('refs/heads/main', body.sha);
        return json({ ok: true });
      }
      return json({ message: 'mock route not found: ' + method + ' ' + path }, 404);
    }
    if (u.hostname === 'raw.githubusercontent.com') {
      const parts = u.pathname.split('/');
      const p = parts.slice(4).join('/');
      const tree = trees.get(commits.get(refs.get('refs/heads/main')).tree);
      const sha = tree.get(p);
      if (!sha) return new Response('404: ' + p, { status: 404 });
      return new Response(blobs.get(sha), { status: 200 });
    }
    return origFetch(url, init);
  };
  return {
    has(p) { return trees.get(commits.get(refs.get('refs/heads/main')).tree).has(p); },
    list() { return [...trees.get(commits.get(refs.get('refs/heads/main')).tree).keys()]; }
  };
}
const gh = makeGitHubMock();

console.log('== static assets ==');
let res = await req(worker, env, ctx, 'GET', '/');
const homepage = await res.text();
check('GET / serves index.html', res.status === 200 && /LinkShort/.test(homepage));
check('homepage body starts signed-out', /<body class="[^"]*signed-out/.test(homepage));
check('homepage has auth card', homepage.includes('id="auth-form"'));
check('homepage has signed-in wrapper', homepage.includes('id="signed-in"'));
check('homepage has sticky + modal ad slots', homepage.includes('id="sticky-bar"') && homepage.includes('id="ad-modal"'));
check('homepage loads safeads v15', homepage.includes('/safeads.js?v=15'));
check('homepage loads custom.css', homepage.includes('/custom.css'));
check('homepage uses auth-card + glows', homepage.includes('class="auth-card"') && homepage.includes('class="glow g1"'));
check('homepage uses glass-card', homepage.includes('glass-card'));
check('homepage loads Plus Jakarta Sans', homepage.includes('fonts.googleapis.com') && homepage.includes('Plus+Jakarta+Sans'));
check('homepage has shimmer + trust strip + kickers', homepage.includes('shimmer-text') && homepage.includes('trust-strip') && homepage.includes('class="kicker"'));
check('homepage monetag gated (no zone script in head)', !homepage.includes('src="https://quge5.com/88/tag.min.js"'));
check('homepage has no hamburger/anchor menu', !homepage.includes('id="nav-toggle"') && !homepage.includes('id="mobile-menu"'));
check('homepage has tools in header nav (URL | Text | File)', homepage.includes('id="nav-tools"') && homepage.includes('id="tool-panel-text"') && homepage.includes('id="tool-panel-file"') && homepage.includes('id="tool-file"') && homepage.includes('onclick="selectTool(\'file\')"'));
check('homepage has no floating drawer (no rail/backdrop/drawer)', !homepage.includes('tool-drawer') && !homepage.includes('tool-backdrop') && !homepage.includes('tool-rail-btn'));
check('homepage has file upload JS', homepage.includes('id="file-input"') && homepage.includes('function createFileLink()') && homepage.includes('function onFilePick('));
check('homepage advertises 100 MB uploads', homepage.includes('Up to 100 MB') && homepage.includes('104857600'));
check('homepage loads custom.css v5', homepage.includes('/custom.css?v=5'));
res = await req(worker, env, ctx, 'GET', '/tailwind.min.css');
check('GET /tailwind.min.css', res.status === 200 && /bg-teal/.test(await res.text()));
res = await req(worker, env, ctx, 'GET', '/safeads.js?v=11');
const safeads = await res.text();
check('GET /safeads.js?v=11', res.status === 200 && /omg10/.test(safeads));
check('safeads modal is compact toast (no overlay inset:0)', safeads.includes('bottom:calc(82px') && !safeads.includes('.ad-modal{position:fixed;inset:0'));
check('safeads auto-hides toast', safeads.includes('setTimeout(() => this.hideModal(), 9000)'));
res = await req(worker, env, ctx, 'GET', '/robots.txt');
check('GET /robots.txt', res.status === 200);
res = await req(worker, env, ctx, 'GET', '/custom.css?v=3');
const customCss = await res.text();
check('custom.css has mobile table cards', customCss.includes('@media (max-width:640px)') && customCss.includes('.data-table thead{display:none}'));
check('custom.css bumps touch targets on mobile', customCss.includes('min-height:48px'));
check('custom.css has tool tab styles', customCss.includes('.tool-tab'));
check('custom.css styles tools in header nav', customCss.includes('#nav-tools .tool-tab'));
check('custom.css has no drawer styles', !customCss.includes('.tool-drawer'));

console.log('== shorten ==');
res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: 'https://example.com/a' } });
let d = await res.json();
check('shorten returns id', res.status === 200 && /^[0-9a-zA-Z]{6}$/.test(d.id || ''));
const id1 = d.id;
res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: 'https://example.com/a' } });
d = await res.json();
check('dedupe same URL', res.status === 200 && d.id === id1);
res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: '' } });
check('empty url rejected', res.status === 400);
res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: 'not a url' } });
check('invalid url rejected', res.status === 400);

console.log('== api reads ==');
res = await req(worker, env, ctx, 'GET', '/api/links');
d = await res.json();
check('/api/links has 1 link', res.status === 200 && Array.isArray(d) && d.length === 1 && d[0].id === id1);
res = await req(worker, env, ctx, 'GET', '/api/stats');
d = await res.json();
check('/api/stats total=1', d.total === 1 && d.clicks === 0);

console.log('== redirect ==');
res = await req(worker, env, ctx, 'GET', '/' + id1, { ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/127 Mobile' });
check('human gets 301', res.status === 301 && res.headers.get('Location') === 'https://example.com/a');
check('301 has HSTS', (res.headers.get('Strict-Transport-Security') || '').includes('31536000'));
await ctx.flush();
res = await req(worker, env, ctx, 'GET', '/api/stats');
d = await res.json();
check('click counted (clicks=1)', d.clicks === 1);
res = await req(worker, env, ctx, 'GET', '/' + id1, { ua: 'facebookexternalhit/1.1' });
const body = await res.text();
check('crawler gets 200 preview', res.status === 200 && body.includes('og:image') && body.includes('http-equiv="refresh"'));
res = await req(worker, env, ctx, 'GET', '/ZZZZZZ', { ua: 'Mozilla/5.0' });
check('unknown code 404', res.status === 404);
res = await req(worker, env, ctx, 'GET', '/api/nope');
check('unknown api 404', res.status === 404 && (await res.json()).error);

console.log('== rate limits ==');
let codes = [];
for (let i = 0; i < 12; i++) {
  res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: 'https://example.com/rate-' + i }, ip: '9.9.9.9' });
  codes.push(res.status);
  await ctx.flush();
}
check('shorten 10x200 then 429s (fresh IP)', codes.slice(0, 10).every(c => c === 200) && codes.slice(10).every(c => c === 429));
res = await req(worker, env, ctx, 'GET', '/api/links');
check('/api/links still 200 (30/min scope)', res.status === 200);

console.log('== text to link ==');
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: '' } });
check('empty text rejected', res.status === 400);
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'x'.repeat(100001) } });
check('oversized text rejected', res.status === 400);
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'Hello world this is shared text.' } });
d = await res.json();
check('text returns id', res.status === 200 && /^[0-9a-zA-Z]{6}$/.test(d.id || ''));
const textId = d.id;
check('text link stored with kind=text', (kvDump()['link:' + textId] || '').includes('"kind":"text"'));
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'Hello world this is shared text.' } });
d = await res.json();
check('text dedupe same content', res.status === 200 && d.id === textId);
let tbody;
res = await req(worker, env, ctx, 'GET', '/' + textId, { ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/127 Mobile' });
tbody = await res.text();
check('text link serves styled page (200 not 301)', res.status === 200 && tbody.includes('<pre id="tx">') && tbody.includes('Copy text'));
check('text page shows chars/words chips', tbody.includes('chars</span>') && tbody.includes('words</span>'));
check('text page shares LinkShort theme', tbody.includes('/custom.css?v=5') && tbody.includes('Plus+Jakarta+Sans'));
check('text page is monetized (safeads slots)', tbody.includes('id="sticky-bar"') && tbody.includes('id="ad-modal"') && tbody.includes('class="ad-banner"') && tbody.includes('class="ad-count"') && tbody.includes('/safeads.js?v=15'));
check('text page has full homepage slot set (safead+direct+2x duo)', tbody.includes('class="safead"') && tbody.includes('class="direct-ad"') && (tbody.match(/class="ad-duo"/g) || []).length === 2 && (tbody.match(/class="ad-banner"/g) || []).length >= 1);
check('text page has 3-step How it works', tbody.includes('How it works') && tbody.includes('Open the link') && tbody.includes('Read &amp; copy') && tbody.includes('Share it on') && tbody.includes('class="kicker"'));
check('text page loads monetag zones', tbody.includes('quge5.com/88/tag.min.js') && tbody.includes('nap5k.com/tag.min.js') && tbody.includes('al5sm.com/tag.min.js'));
res = await req(worker, env, ctx, 'GET', '/' + textId, { ua: 'facebookexternalhit/1.1' });
tbody = await res.text();
check('crawler also gets text page', res.status === 200 && tbody.includes('<pre id="tx">'));
await ctx.flush();
res = await req(worker, env, ctx, 'GET', '/api/stats');
d = await res.json();
check('text clicks counted (human + crawler)', d.clicks === 3);

console.log('== file to link ==');
async function uploadFile(ip, name, bytes, cookie, contentType) {
  const headers = { 'X-File-Name': name, 'Content-Type': contentType || 'text/plain' };
  if (cookie) headers['Cookie'] = cookie;
  return rawReq(worker, env, ctx, 'POST', '/api/file', { ip, extraHeaders: headers, body: bytes });
}
let fres;
fres = await uploadFile('5.5.5.5', 'hello%20world.txt', new TextEncoder().encode('hello world file bytes'));
d = await fres.json();
check('file upload returns id', fres.status === 200 && /^[0-9a-zA-Z]{6}$/.test(d.id || ''));
const fileId = d.id;
await ctx.flush();
check('file blobs committed to GitHub (part + manifest)', gh.has('files/' + fileId + '/part-0001.b64') && gh.has('files/' + fileId + '/manifest.json'));
check('no KV chunk keys for github files', !(kvDump()['f:' + fileId + ':0'] || '').length);
check('file link record has kind=file + chunks=1 + github', (kvDump()['link:' + fileId] || '').includes('"kind":"file"') && (kvDump()['link:' + fileId] || '').includes('"chunks":1') && (kvDump()['link:' + fileId] || '').includes('"github":'));
fres = await uploadFile('5.5.5.5', 'hello%20world.txt', new TextEncoder().encode('hello world file bytes'));
d = await fres.json();
await ctx.flush();
check('file dedupe same bytes', fres.status === 200 && d.id === fileId);
fres = await uploadFile('5.5.5.5', 'empty.txt', new Uint8Array(0));
check('empty file rejected', fres.status === 400);
fres = await uploadFile('5.5.5.5', 'big.bin', new Uint8Array(104857601));
check('oversize file rejected (100 MB)', fres.status === 400);
res = await rawReq(worker, envNoGh, makeCtx(), 'POST', '/api/file', { ip: '8.8.8.8', extraHeaders: { 'X-File-Name': 'nog.bin', 'Content-Type': 'text/plain' }, body: new TextEncoder().encode('no github token') });
check('upload without GITHUB_TOKEN -> 503', res.status === 503);
const chunkedBytes = new Uint8Array(FILE_CHUNK * 2 + 17);
for (let i = 0; i < chunkedBytes.length; i++) chunkedBytes[i] = i & 255;
fres = await uploadFile('6.6.6.6', 'chunky.bin', chunkedBytes);
d = await fres.json();
await ctx.flush();
check('multi-chunk upload works (>8 MB)', fres.status === 200 && /^[0-9a-zA-Z]{6}$/.test(d.id || ''));
const chunkedId = d.id;
check('chunked link record has chunks=3', (kvDump()['link:' + chunkedId] || '').includes('"chunks":3'));
check('github has 3 part blobs for chunked id', gh.has('files/' + chunkedId + '/part-0001.b64') && gh.has('files/' + chunkedId + '/part-0002.b64') && gh.has('files/' + chunkedId + '/part-0003.b64'));
res = await req(worker, env, ctx, 'GET', '/' + chunkedId + '/dl', { ua: 'Mozilla/5.0' });
check('chunked download 200 + correct content-length', res.status === 200 && (res.headers.get('Content-Length') || '') === String(chunkedBytes.length) && (res.headers.get('Content-Disposition') || '').includes('attachment'));
const dlChunked = new Uint8Array(await res.arrayBuffer());
check('chunked download bytes identical to upload', dlChunked.length === chunkedBytes.length && chunkedBytes.every((b, i) => b === dlChunked[i]));
res = await req(worker, env, ctx, 'GET', '/' + fileId, { ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/127 Mobile' });
let fbody = await res.text();
check('file link serves download page (200)', res.status === 200 && fbody.includes('⬇ Download') && fbody.includes('/dl'));
check('file page has name + size + type', fbody.includes('hello world.txt') && fbody.includes('22 B'));
check('file page has LinkShort timer step gate (chip + ring + cta + dots)', fbody.includes('id="step-chip"') && fbody.includes('id="timer-ring"') && fbody.includes('id="timer-num"') && fbody.includes('id="cta-btn"') && fbody.includes('Step 1 of 3') && fbody.includes('Please wait <strong>15</strong> seconds') && fbody.includes('class="progress"'));
check('file page hides download until steps complete', fbody.includes('id="dl-box" style="display:none"') && fbody.includes('id="step-box"'));
check('file page step JS drives flow', fbody.includes('Step.run') && fbody.includes('Get Your Download') && fbody.includes('Click Here to Continue'));
check('file page has How it works steps (like homepage)', fbody.includes('How it works') && fbody.includes('Open the link') && fbody.includes('Download the file') && fbody.includes('Share it on'));
check('file page is monetized', fbody.includes('id="sticky-bar"') && fbody.includes('id="ad-modal"') && fbody.includes('class="ad-banner"') && fbody.includes('/safeads.js?v=15'));
check('file page has full homepage slot set (safead+direct+2x duo)', fbody.includes('class="safead"') && fbody.includes('class="direct-ad"') && (fbody.match(/class="ad-duo"/g) || []).length === 2);
check('file page loads monetag zones', fbody.includes('quge5.com/88/tag.min.js'));
res = await req(worker, env, ctx, 'GET', '/' + fileId + '/dl', { ua: 'Mozilla/5.0' });
check('file download 200 + attachment', res.status === 200 && (res.headers.get('Content-Disposition') || '').includes('attachment'));
check('file download content-type + noindex', (res.headers.get('Content-Type') || '').startsWith('text/plain') && (res.headers.get('X-Robots-Tag') || '').includes('noindex'));
const dlCd = res.headers.get('Content-Disposition') || '';
check('Content-Disposition strips \\r\\n', !dlCd.includes('\r') && !dlCd.includes('\n'));
const dlSingle = new Uint8Array(await res.arrayBuffer());
check('single-chunk download bytes identical to upload', new TextDecoder().decode(dlSingle) === 'hello world file bytes');
res = await req(worker, env, ctx, 'GET', '/ZZZZZZ/dl');
check('unknown file dl 404', res.status === 404);
let fcodes = [];
for (let i = 0; i < 7; i++) {
  fres = await uploadFile('7.7.7.7', 'r' + i + '.bin', new TextEncoder().encode('rate-' + i));
  fcodes.push(fres.status);
  await ctx.flush();
}
check('file upload rate limit 6x200 then 429', fcodes.slice(0, 6).every(c => c === 200) && fcodes[6] === 429);

console.log('== auth ==');
res = await req(worker, env, ctx, 'POST', '/api/register', { body: { name: 'TestUser', password: 'secret123' } });
d = await res.json();
check('register creates session', res.status === 200 && d.ok && d.name === 'testuser');
let cookie = (res.headers.get('Set-Cookie') || '').split(';')[0];
check('register sets session cookie', cookie.startsWith('ls_sess='));
res = await req(worker, env, ctx, 'POST', '/api/register', { body: { name: 'testuser', password: 'secret123' } });
check('duplicate username rejected', res.status === 409);
res = await req(worker, env, ctx, 'POST', '/api/login', { body: { name: 'TestUser', password: 'wrongpass' } });
check('wrong password rejected', res.status === 401);
res = await req(worker, env, ctx, 'POST', '/api/login', { body: { name: 'testuser', password: 'secret123' } });
d = await res.json();
check('login succeeds', res.status === 200 && d.name === 'testuser');
cookie = (res.headers.get('Set-Cookie') || '').split(';')[0];
res = await req(worker, env, ctx, 'GET', '/api/me');
check('me requires session', res.status === 401);
res = await req(worker, env, ctx, 'GET', '/api/me', { cookie });
d = await res.json();
check('me returns user', res.status === 200 && d.name === 'testuser');
res = await req(worker, env, ctx, 'POST', '/api/shorten', { body: { url: 'https://example.com/owned' }, cookie });
d = await res.json();
check('logged-in shorten returns id', res.status === 200 && /^[0-9a-zA-Z]{6}$/.test(d.id || ''));
const ownedId = d.id;
res = await req(worker, env, ctx, 'GET', '/api/me/links', { cookie });
d = await res.json();
check('my links contains owned link', res.status === 200 && Array.isArray(d) && d.some(l => l.id === ownedId));
check('link record has owner', (kvDump()['link:' + ownedId] || '').includes('testuser'));
res = await req(worker, env, ctx, 'DELETE', '/api/me/links/' + ownedId, { cookie });
check('delete own link ok', res.status === 200);
res = await req(worker, env, ctx, 'GET', '/' + ownedId);
check('deleted link 404s', res.status === 404);
fres = await uploadFile('5.5.5.5', 'own.bin', new TextEncoder().encode('owned github file'), cookie);
d = await fres.json();
await ctx.flush();
const ownedFileId = d.id;
check('owned file upload works', fres.status === 200 && gh.has('files/' + ownedFileId + '/part-0001.b64'));
res = await req(worker, env, ctx, 'DELETE', '/api/me/links/' + ownedFileId, { cookie });
await ctx.flush();
check('delete own file ok', res.status === 200);
check('delete removed github blobs', !gh.has('files/' + ownedFileId + '/part-0001.b64') && !gh.has('files/' + ownedFileId + '/manifest.json'));
check('delete cleared fh dedupe key', !(kvDump()['fh:'] || '').includes(ownedFileId));
res = await req(worker, env, ctx, 'DELETE', '/api/me/links/' + id1, { cookie });
check('cannot delete unowned link', res.status === 404);
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'text to delete test' }, cookie });
d = await res.json();
const delTextId = d.id;
res = await req(worker, env, ctx, 'DELETE', '/api/me/links/' + delTextId, { cookie });
check('delete own text link ok', res.status === 200);
res = await req(worker, env, ctx, 'GET', '/' + delTextId);
check('deleted text link 404s', res.status === 404);
res = await req(worker, env, ctx, 'POST', '/api/logout', { cookie });
check('logout ok', res.status === 200);
res = await req(worker, env, ctx, 'GET', '/api/me', { cookie });
check('me 401 after logout', res.status === 401);

console.log('== security hardening ==');
res = await req(worker, env, ctx, 'POST', '/api/login', { body: { name: 'testuser', password: 'secret123' } });
d = await res.json();
cookie = (res.headers.get('Set-Cookie') || '').split(';')[0];

res = await req(worker, env, ctx, 'GET', '/');
const hdrCsp = res.headers.get('Content-Security-Policy') || '';
check('CSP header present on HTML', hdrCsp.includes("default-src 'none'") && hdrCsp.includes('script-src'));
check('CSP blocks unsafe-eval', !hdrCsp.includes("'unsafe-eval'"));
check('CSP allows Monetag domains', hdrCsp.includes('quge5.com') && hdrCsp.includes('nap5k.com') && hdrCsp.includes('al5sm.com'));
res = await req(worker, env, ctx, 'GET', '/api/stats');
check('CORS header on API responses', res.headers.get('Access-Control-Allow-Origin') === '*');
res = await req(worker, env, ctx, 'OPTIONS', '/api/stats');
check('OPTIONS preflight returns 204', res.status === 204 && res.headers.get('Access-Control-Allow-Methods'));

res = await req(worker, env, ctx, 'GET', '/' + textId, { ua: 'Mozilla/5.0' });
const tBody = await res.text();
check('text page loads monetag unconditionally', tBody.includes('quge5.com/88/tag.min.js'));

fres = await uploadFile('8.8.8.8', 'safe.bin', new TextEncoder().encode('safe-content'), cookie);
d = await fres.json();
const safeLink = JSON.parse(kvDump()['link:' + d.id] || '{}');
check('safe Content-Type preserved', safeLink.type === 'text/plain');

res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'owned text for total test' }, cookie });
d = await res.json();
const ownedTextForTotal = d.id;
res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'before total check' } });
await ctx.flush();
res = await req(worker, env, ctx, 'GET', '/api/stats');
const beforeTotal = (await res.json()).total;
res = await req(worker, env, ctx, 'DELETE', '/api/me/links/' + ownedTextForTotal, { cookie });
await ctx.flush();
res = await req(worker, env, ctx, 'GET', '/api/stats');
d = await res.json();
check('meta.total decremented after delete', d.total === beforeTotal - 1);

console.log('== auth rate limit ==');
let authCodes = [];
for (let i = 0; i < 9; i++) {
  res = await req(worker, env, ctx, 'POST', '/api/register', { body: { name: 'rluser' + i, password: 'pass123' }, ip: '11.11.11.11' });
  authCodes.push(res.status);
  await ctx.flush();
}
check('auth 8x200 then 429', authCodes.slice(0, 8).every(c => c === 200) && authCodes[8] === 429);

console.log('== text rate limit ==');
let textCodes = [];
for (let i = 0; i < 11; i++) {
  res = await req(worker, env, ctx, 'POST', '/api/text', { body: { text: 'rate limit test text ' + i }, ip: '22.22.22.22' });
  textCodes.push(res.status);
  await ctx.flush();
}
check('text 10x200 then 429', textCodes.slice(0, 10).every(c => c === 200) && textCodes[10] === 429);

console.log('== dl rate limit ==');
let dlCodes = [];
for (let i = 0; i < 61; i++) {
  res = await req(worker, env, ctx, 'GET', '/' + fileId + '/dl', { ip: '33.33.33.33' });
  dlCodes.push(res.status);
  await ctx.flush();
}
check('/dl 60x200 then 429', dlCodes.slice(0, 60).every(c => c === 200) && dlCodes[60] === 429);

console.log('== file type sanitization ==');
fres = await uploadFile('4.4.4.4', 'xss.html', new TextEncoder().encode('<script>alert(1)</script>'), null, 'text/html');
d = await fres.json();
const xssLink = JSON.parse(kvDump()['link:' + d.id] || '{}');
check('text/html Content-Type blocked to application/octet-stream', xssLink.type === 'application/octet-stream');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
