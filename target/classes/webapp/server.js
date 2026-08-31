const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const util = require('util');
crypto.pbkdf2Promise = util.promisify(crypto.pbkdf2);

const PORT = parseInt(process.env.PORT) || 10000;
const SITE_URL = process.env.SITE_URL || 'https://short.smp45.qzz.io';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_FILE = 104857600;
const FILE_CHUNK = 8388608;
const SESSION_TTL = 60 * 60 * 24 * 30;

const DB_PATH = path.join(__dirname, 'linkshort.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    kind TEXT DEFAULT 'url',
    url TEXT,
    text_content TEXT,
    name TEXT,
    type TEXT,
    size INTEGER DEFAULT 0,
    hash TEXT,
    chunks INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    owner TEXT,
    created TEXT,
    github_owner TEXT,
    github_repo TEXT,
    github_branch TEXT,
    github_commit TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    name TEXT PRIMARY KEY,
    pwhash TEXT NOT NULL,
    salt TEXT NOT NULL,
    iter INTEGER NOT NULL,
    created TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT,
    ts INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_links (
    username TEXT,
    link_id TEXT,
    PRIMARY KEY (username, link_id)
  );
  CREATE TABLE IF NOT EXISTS dedup (
    key TEXT PRIMARY KEY,
    link_id TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rl_key ON rate_limits(key);
  CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner);
`);
// --- v2 migrations ---
try { db.exec('ALTER TABLE links ADD COLUMN enabled INTEGER DEFAULT 1'); } catch(e) {}
try { db.exec('ALTER TABLE links ADD COLUMN expires_at TEXT'); } catch(e) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    user TEXT NOT NULL,
    created TEXT,
    last_used TEXT
  );
  CREATE TABLE IF NOT EXISTS clicks (
    lid TEXT NOT NULL,
    ts INTEGER NOT NULL,
    ref TEXT,
    bot INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_clicks_lid ON clicks(lid, ts);
  CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user);
`);

const S = {
  getLink: db.prepare('SELECT * FROM links WHERE id = ?'),
  insLink: db.prepare(`INSERT OR IGNORE INTO links
    (id,kind,url,text_content,name,type,size,hash,chunks,clicks,owner,created,
     github_owner,github_repo,github_branch,github_commit)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
  incrClicks: db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?'),
  delLink: db.prepare('DELETE FROM links WHERE id = ?'),
  updCommit: db.prepare('UPDATE links SET github_commit = ?, github_owner = ?, github_repo = ?, github_branch = ? WHERE id = ?'),
  setMeta: db.prepare('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)'),
  getMeta: db.prepare('SELECT value FROM meta WHERE key = ?'),
  insDedup: db.prepare('INSERT OR IGNORE INTO dedup (key,link_id) VALUES (?,?)'),
  getDedup: db.prepare('SELECT link_id FROM dedup WHERE key = ?'),
  getUser: db.prepare('SELECT * FROM users WHERE name = ?'),
  insUser: db.prepare('INSERT INTO users (name,pwhash,salt,iter,created) VALUES (?,?,?,?,?)'),
  insSess: db.prepare('INSERT INTO sessions (token,name,expires) VALUES (?,?,?)'),
  getSess: db.prepare('SELECT * FROM sessions WHERE token = ? AND expires > ?'),
  delSess: db.prepare('DELETE FROM sessions WHERE token = ?'),
  insUL: db.prepare('INSERT OR IGNORE INTO user_links (username,link_id) VALUES (?,?)'),
  getUL: db.prepare(`SELECT l.* FROM user_links ul JOIN links l ON l.id = ul.link_id
    WHERE ul.username = ? ORDER BY l.created DESC LIMIT 200`),
  delUL: db.prepare('DELETE FROM user_links WHERE username = ? AND link_id = ?'),
  cleanRL: db.prepare('DELETE FROM rate_limits WHERE key = ? AND ts <= ?'),
  countRL: db.prepare('SELECT COUNT(*) as c FROM rate_limits WHERE key = ? AND ts > ?'),
  insRL: db.prepare('INSERT INTO rate_limits (key,ts) VALUES (?,?)'),
  recent: db.prepare('SELECT id,kind,clicks,created,url,text_content,name,size,type FROM links ORDER BY created DESC LIMIT 25'),
  countLinks: db.prepare('SELECT COUNT(*) as c FROM links'),
  // v2
  insKey: db.prepare('INSERT INTO api_keys (id,name,prefix,token_hash,user,created,last_used) VALUES (?,?,?,?,?,?,NULL)'),
  getKeyByHash: db.prepare('SELECT * FROM api_keys WHERE token_hash = ?'),
  getKeysFor: db.prepare('SELECT id,name,prefix,created,last_used FROM api_keys WHERE user = ? ORDER BY created DESC'),
  delKey: db.prepare('DELETE FROM api_keys WHERE id = ? AND user = ?'),
  touchKey: db.prepare('UPDATE api_keys SET last_used = ? WHERE id = ?'),
  insClick: db.prepare('INSERT INTO clicks (lid,ts,ref,bot) VALUES (?,?,?,?)'),
  clicksByDay: db.prepare(`SELECT strftime('%Y-%m-%d', ts/1000, 'unixepoch') d, COUNT(*) c
    FROM clicks WHERE lid = ? AND ts >= ? GROUP BY d ORDER BY d`),
  topRefs: db.prepare(`SELECT COALESCE(NULLIF(ref,''),'(direct)') r, COUNT(*) c
    FROM clicks WHERE lid = ? GROUP BY r ORDER BY c DESC LIMIT 10`),
  recentClicks: db.prepare('SELECT ts, ref, bot FROM clicks WHERE lid = ? ORDER BY ts DESC LIMIT 50'),
  countClicksLink: db.prepare('SELECT COUNT(*) c FROM clicks WHERE lid = ?'),
  pruneClicks: db.prepare('DELETE FROM clicks WHERE ts < ?'),
  userCountClicks: db.prepare(`SELECT l.id FROM links l WHERE l.owner = ? AND l.enabled = 1`),
  listMine: db.prepare(`SELECT id,kind,url,text_content,name,type,size,clicks,created,enabled,expires_at
    FROM links WHERE owner = ? ORDER BY created DESC LIMIT ? OFFSET ?`),
  countMine: db.prepare('SELECT COUNT(*) c FROM links WHERE owner = ?'),
  searchMine: db.prepare(`SELECT id,kind,url,text_content,name,type,size,clicks,created,enabled,expires_at
    FROM links WHERE owner = ? AND (url LIKE ? OR text_content LIKE ? OR name LIKE ? OR id LIKE ?)
    ORDER BY created DESC LIMIT ? OFFSET ?`),
  updUrl: db.prepare('UPDATE links SET url = ?, enabled = enabled WHERE id = ?'),
  updText: db.prepare('UPDATE links SET text_content = ? WHERE id = ?'),
  updName: db.prepare('UPDATE links SET name = ? WHERE id = ?'),
  updEnabled: db.prepare('UPDATE links SET enabled = ? WHERE id = ?'),
  updExpiry: db.prepare('UPDATE links SET expires_at = ? WHERE id = ?'),
  clearDedup: db.prepare('DELETE FROM dedup WHERE link_id = ?'),
  delAllUL: db.prepare('DELETE FROM user_links WHERE link_id = ?'),
  byKind: db.prepare('SELECT kind, COUNT(*) c FROM links GROUP BY kind'),
  clicksSince: db.prepare('SELECT COUNT(*) c FROM clicks WHERE ts >= ?'),
  sessAll: db.prepare('DELETE FROM sessions WHERE name = ?'),
  userCreated: db.prepare('SELECT created, iter FROM users WHERE name = ?'),
  updPassword: db.prepare('UPDATE users SET pwhash = ?, salt = ?, iter = ? WHERE name = ?'),
};

function genId() {
  const r = crypto.randomBytes(8);
  let id = '';
  for (let i = 0; i < 6; i++) id += ALPHABET[r[i] % 62];
  return id;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function isCrawler(ua) {
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|Bingbot|Pinterest|curl|wget|python/i.test(ua || '');
}

function sha1(str) { return crypto.createHash('sha1').update(str).digest('hex'); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function randomHex(n) { return crypto.randomBytes(n).toString('hex'); }

function constEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function parseCookies(raw) {
  const out = {};
  if (!raw) return out;
  raw.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) {
      try {
        out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
      } catch (e) {
        out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
      }
    }
  });
  return out;
}

function rateLimit(ip, scope, max, windowMs) {
  const key = 'rl:' + ip + ':' + scope;
  S.cleanRL.run(key, Date.now() - windowMs);
  const row = S.countRL.get(key, Date.now() - windowMs);
  if (row.c >= max) {
    return { ok: false, remaining: 0, reset: Math.ceil(windowMs / 1000) };
  }
  S.insRL.run(key, Date.now());
  return { ok: true, remaining: max - row.c - 1, reset: Math.ceil(windowMs / 1000) };
}

function rateOk(ip, scope, max, windowMs) { return rateLimit(ip, scope, max, windowMs).ok; }

function rlHeaders(rl, max) {
  return {
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(Math.max(0, rl.remaining)),
    'X-RateLimit-Reset': String(rl.reset)
  };
}

function hashToken(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

function getUser(req) {
  // Bearer API key first
  var auth = req.headers['authorization'] || '';
  if (/^bearer\s+lsk_/i.test(auth)) {
    var secret = auth.replace(/^bearer\s+/i, '').trim();
    var k = S.getKeyByHash.get(hashToken(secret));
    if (k) {
      if (!k.last_used || Math.random() < 0.05) S.touchKey.run(new Date().toISOString(), k.id);
      return { name: k.user, via: 'key', keyId: k.id };
    }
    return null;
  }
  const t = parseCookies(req.headers.cookie || '')['ls_sess'];
  if (!t) return null;
  const r = S.getSess.get(t, Date.now());
  return r ? { name: r.name, via: 'session' } : null;
}

function refHost(req) {
  try {
    var r = req.headers['referer'] || req.headers['referrer'] || '';
    if (!r) return '';
    return new URL(r).hostname.slice(0, 120);
  } catch(e) { return ''; }
}

var lastPrune = 0;
function recordClick(id, req) {
  S.incrClicks.run(id);
  const m = getMeta();
  m.clicks = (m.clicks || 0) + 1;
  setMeta(m);
  try {
    S.insClick.run(id, Date.now(), refHost(req), isCrawler(req.headers['user-agent'] || '') ? 1 : 0);
    if (Date.now() - lastPrune > 3600000) {
      lastPrune = Date.now();
      S.pruneClicks.run(Date.now() - 90 * 86400000);
    }
  } catch(e) {}
}

function createSession(name) {
  const token = randomHex(32);
  S.insSess.run(token, name, Date.now() + SESSION_TTL * 1000);
  return token;
}

function sessionCookie(req, token) {
  var secure = (req.headers['x-forwarded-proto'] || '').includes('https') || !!req.socket.encrypted;
  if (token) return 'ls_sess=' + token + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : '');
  return 'ls_sess=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : '');
}

function getMeta() {
  const r = S.getMeta.get('main');
  if (r) try { return JSON.parse(r.value); } catch(e) {}
  return { total: 0, clicks: 0 };
}
function setMeta(m) { S.setMeta.run('main', JSON.stringify(m)); }

function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

const SEC = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function send(res, code, body, headers) {
  res.writeHead(code, { ...SEC, ...headers });
  res.end(body);
}
function sendJson(res, code, obj) { send(res, code, JSON.stringify(obj), {'Content-Type':'application/json; charset=utf-8'}); }
function sendOk(res, code, data, extra) {
  send(res, code, JSON.stringify({ ok: true, data }), {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
    ...(extra || {})
  });
}
function sendErr(res, code, errCode, msg, extra) {
  send(res, code, JSON.stringify({ ok: false, error: { code: errCode, message: msg } }), {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
    ...(extra || {})
  });
}
function sendHtml(res, code, h) { send(res, code, h, {'Content-Type':'text/html; charset=utf-8'}); }
function sendRedirect(res, url) { send(res, 302, '', {'Location': url, 'Cache-Control': 'no-store'}); }

async function ghFetch(pathname, options) {
  const opts = options || {};
  const token = process.env.GITHUB_TOKEN || '';
  const res = await fetch('https://api.github.com' + pathname, {
    ...opts,
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Shrinqo-file2link',
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error('GitHub ' + res.status + ' ' + pathname);
  if (res.status === 204) return null;
  return res.json();
}

async function githubCommit(additions, removals) {
  var adds = additions || [];
  var rms = removals || [];
  var owner = process.env.GITHUB_OWNER || '';
  var repo = process.env.GITHUB_REPO || '';
  var branch = process.env.GITHUB_BRANCH || 'main';
  var refPath = '/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch;
  var latest = await ghFetch(refPath);
  var latestSha = latest.object.sha;
  var current = await ghFetch('/repos/' + owner + '/' + repo + '/git/commits/' + latestSha);
  var entries = [];
  if (rms.length > 0) {
    var tree = await ghFetch('/repos/' + owner + '/' + repo + '/git/trees/' + current.tree.sha + '?recursive=1');
    entries = tree.tree.filter(function(e) {
      return e.type === 'blob' && !rms.some(function(p) {
        return e.path === p || e.path.startsWith(p.replace(/\/$/, '') + '/');
      });
    });
  }
  for (var i = 0; i < adds.length; i++) {
    var a = adds[i];
    if (a.sha) { entries.push({ path: a.path, mode: a.mode || '100644', type: 'blob', sha: a.sha }); continue; }
    var blob = await ghFetch('/repos/' + owner + '/' + repo + '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: a.content, encoding: 'utf-8' })
    });
    entries.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  var treeSha;
  if (entries.length === 0) {
    treeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  } else {
    var tbody = { tree: entries };
    if (rms.length === 0) tbody.base_tree = current.tree.sha;
    var newTree = await ghFetch('/repos/' + owner + '/' + repo + '/git/trees', { method: 'POST', body: JSON.stringify(tbody) });
    treeSha = newTree.sha;
  }
  var newCommit = await ghFetch('/repos/' + owner + '/' + repo + '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: 'file2link', tree: treeSha, parents: [latestSha] })
  });
  await ghFetch(refPath, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });
  return newCommit.sha;
}

async function streamGithubFile(link, res) {
  var base = 'https://raw.githubusercontent.com/' + link.github_owner + '/' + link.github_repo + '/' + link.github_branch + '/files/' + link.id;
  for (var i = 1; i <= link.chunks; i++) {
    var idx = String(i).padStart(4, '0');
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        var r = await fetch(base + '/part-' + idx + '.b64');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var txt = await r.text();
        var bin = Buffer.from(txt, 'base64');
        res.write(bin);
        break;
      } catch(e) {
        if (attempt === 1) { res.destroy(e); return; }
        await new Promise(function(ok) { setTimeout(ok, 300); });
      }
    }
  }
  res.end();
}

var MTS = '<script>window.__mtg=window.__mtg||false;if(!window.__mtg){window.__mtg=true;[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);})}</script>';
var SAFEAD = '<script src="/safeads.js?v=18"></script>';
var SUBFX = '<script src="/subfx.js?v=1"></script>';
var BOOMJS = 'function boom(){var cols=["#2563eb","#7c3aed","#0ea5e9","#f59e0b","#059669","#ec4899"];for(var i=0;i<26;i++){(function(i){var d=document.createElement("div");var s=6+Math.random()*6;'
+ 'd.style.cssText="position:fixed;z-index:9999;pointer-events:none;width:"+s+"px;height:"+s+"px;border-radius:"+(Math.random()<.5?"50%":"2px")+";background:"+cols[i%cols.length]+";left:50%;top:45%;transition:transform .8s cubic-bezier(.16,.84,.44,1),opacity .8s ease";'
+ 'document.body.appendChild(d);requestAnimationFrame(function(){requestAnimationFrame(function(){var a=Math.random()*Math.PI*2,r=90+Math.random()*170;'
+ 'd.style.transform="translate("+Math.cos(a)*r+"px,"+(Math.sin(a)*r-70)+"px) rotate("+(Math.random()*540)+"deg)";d.style.opacity="0"})});'
+ 'setTimeout(function(){d.remove()},950)})(i)}}';
var ADS = '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-count" style="max-width:760px;margin:12px 0 0"></div><div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>';

// ---- Shrinqo sub-page design system (matches homepage identity) ----
var SUB_FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">';
var SUB_CSS = '<style>*{box-sizing:border-box}:root{--ink:#0f172a;--ink2:#334155;--mut:#64748b;--faint:#94a3b8;--acc:#2563eb;--vio:#7c3aed;--line:#e2e8f0;--grad:linear-gradient(135deg,#2563eb,#7c3aed)}'
+ 'html,body{margin:0;padding:0}body{min-height:100vh;font-family:"Plus Jakarta Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;color:var(--ink);background:#f6f8fc;-webkit-font-smoothing:antialiased;letter-spacing:-.011em;overflow-x:hidden}'
+ 'body::before,body::after{content:"";position:fixed;border-radius:50%;filter:blur(90px);z-index:-1;pointer-events:none}'
+ 'body::before{width:520px;height:520px;top:-160px;right:-120px;background:radial-gradient(circle,rgba(37,99,235,.16),transparent 70%)}'
+ 'body::after{width:560px;height:560px;bottom:-200px;left:-140px;background:radial-gradient(circle,rgba(124,58,237,.14),transparent 70%)}'
+ '.top{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(226,232,240,.8)}'
+ '.twrap{max-width:780px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px}'
+ '.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:16px;text-decoration:none;color:var(--ink)}.brand i{display:flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:10px;background:var(--grad);color:#fff;font-style:normal;font-size:15px;box-shadow:0 6px 14px -6px rgba(37,99,235,.55)}'
+ '.gbtn{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px -8px rgba(37,99,235,.55);transition:transform .15s ease,filter .2s ease}.gbtn:hover{transform:translateY(-1px);filter:brightness(1.06)}.gbtn:active{transform:scale(.97)}'
+ 'main{max-width:780px;margin:0 auto;padding:26px 16px 48px}'
+ '.card{background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border:1px solid rgba(226,232,240,.9);border-radius:24px;padding:34px 24px;box-shadow:0 1px 3px rgba(15,23,42,.05),0 24px 60px -20px rgba(37,99,235,.18)}'
+ '@keyframes sIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}'
+ '@keyframes sPop{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}'
+ '@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}'
+ '@keyframes spinSlow{to{transform:rotate(360deg)}}'
+ '.in1{animation:sIn .55s cubic-bezier(.22,1,.36,1) both}.in2{animation:sIn .55s cubic-bezier(.22,1,.36,1) .09s both}.in3{animation:sIn .55s cubic-bezier(.22,1,.36,1) .18s both}.in4{animation:sIn .55s cubic-bezier(.22,1,.36,1) .27s both}'
+ '.chip{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,rgba(37,99,235,.1),rgba(124,58,237,.1));color:#4338ca;border:1px solid rgba(37,99,235,.25);padding:6px 14px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}'
+ '.ring{position:relative;width:118px;height:118px;margin:20px auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--rc,#2563eb) calc(var(--p,100)*1%),#e8edf6 0)}'
+ '.ring::before{content:"";position:absolute;inset:9px;border-radius:50%;background:#fff;box-shadow:inset 0 2px 10px rgba(15,23,42,.07)}'
+ '.ring.warn{--rc:#f59e0b;animation:pulseR .55s ease infinite alternate}.ring.done{background:conic-gradient(#059669 0,#059669 100%)}'
+ '@keyframes pulseR{from{filter:brightness(1)}to{filter:brightness(1.3)}}'
+ '.rnum{position:relative;z-index:1;font-size:2rem;font-weight:800;font-variant-numeric:tabular-nums;background:linear-gradient(135deg,#2563eb,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}'
+ '.rmsg{color:var(--mut);font-size:13.5px;margin:4px 0 18px}.rmsg strong{color:#4338ca}'
+ '.cta{display:block;width:100%;max-width:340px;margin:0 auto;padding:15px 20px;border:none;border-radius:16px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:transform .15s ease,box-shadow .25s ease,filter .2s ease;position:relative;overflow:hidden}'
+ '.cta.off{background:#eef2f8;color:var(--faint);pointer-events:none}.cta.go{background:var(--grad);color:#fff;box-shadow:0 14px 28px -12px rgba(37,99,235,.65)}.cta.go:hover{transform:translateY(-2px);filter:brightness(1.07)}.cta.go:active{transform:scale(.98)}'
+ '.dots{display:flex;justify-content:center;gap:8px;margin-top:18px}.dots b{width:9px;height:9px;border-radius:50%;background:#dfe6f1;transition:all .3s ease}.dots b.on{background:linear-gradient(135deg,#2563eb,#7c3aed);transform:scale(1.25);box-shadow:0 0 10px rgba(37,99,235,.45)}'
+ '.foot{max-width:780px;margin:0 auto;padding:0 16px 84px;color:var(--faint);font-size:12px;text-align:center}.foot a{color:var(--acc);text-decoration:none;font-weight:700}'
+ '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
+ '</style>';

function subHead(title, extra) {
  return '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + title + '</title>'
    + '<meta name="theme-color" content="#2563eb">' + (extra || '') + SUB_FONT + SUB_CSS;
}
function subHeader(btnHtml) {
  return '<header class="top"><div class="twrap"><a class="brand" href="' + SITE_URL + '/"><i>&#128279;</i>Shrinqo</a>' + (btnHtml || '') + '</div></header>';
}

function notFoundPage() {
  return '<!DOCTYPE html><html lang="en"><head>' + subHead('Link not found \u2014 Shrinqo', '<meta name="robots" content="noindex, nofollow">')
    + '</head><body>' + subHeader()
    + '<main><div class="card" style="text-align:center;padding:52px 24px">'
    + '<div class="in1" style="width:92px;height:92px;margin:0 auto;border-radius:26px;background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.12));display:flex;align-items:center;justify-content:center;font-size:44px;animation:sPop .5s cubic-bezier(.22,1,.36,1) both,floaty 3.2s ease-in-out 1s infinite">&#128279;&#xFE0E;</div>'
    + '<h1 class="in2" style="font-size:26px;font-weight:800;margin:22px 0 8px">Link not found</h1>'
    + '<p class="in3" style="color:var(--mut);font-size:14.5px;margin:0 0 26px">This short link doesn\u2019t exist or was never created.<br>Double-check the address \u2014 one wrong character is all it takes.</p>'
    + '<a class="in4 gbtn" href="' + SITE_URL + '/" style="display:inline-block;text-decoration:none;padding:13px 30px;font-size:14.5px">Create one free \u2192</a>'
    + '</div></main>'
    + '<div class="foot">Shrinqo \u2014 free short links, pastes &amp; file sharing \u00b7 <a href="' + SITE_URL + '/docs">API docs</a></div>'
    + SUBFX + '</body></html>';
}

function gonePage(reason) {
  var msg = escapeHtml(reason || 'This link is no longer available.');
  return '<!DOCTYPE html><html lang="en"><head>' + subHead('Link unavailable \u2014 Shrinqo', '<meta name="robots" content="noindex, nofollow">')
    + '</head><body>' + subHeader()
    + '<main><div class="card" style="text-align:center;padding:52px 24px">'
    + '<div class="in1" style="width:92px;height:92px;margin:0 auto;border-radius:26px;background:linear-gradient(135deg,rgba(245,158,11,.14),rgba(234,88,12,.12));display:flex;align-items:center;justify-content:center;font-size:44px;animation:sPop .5s cubic-bezier(.22,1,.36,1) both,floaty 3.2s ease-in-out 1s infinite">&#9209;</div>'
    + '<h1 class="in2" style="font-size:26px;font-weight:800;margin:22px 0 8px">Link unavailable</h1>'
    + '<p class="in3" style="color:var(--mut);font-size:14.5px;margin:0 0 26px">' + msg + '</p>'
    + '<a class="in4 gbtn" href="' + SITE_URL + '/" style="display:inline-block;text-decoration:none;padding:13px 30px;font-size:14.5px">Back to Shrinqo \u2192</a>'
    + '</div></main>'
    + '<div class="foot">Shrinqo \u2014 free short links, pastes &amp; file sharing \u00b7 <a href="' + SITE_URL + '/docs">API docs</a></div>'
    + SUBFX + '</body></html>';
}

// ---- URL interstitial: 3 steps x 15s, ad-funded (the money page) ----
function stepsPage(link) {
  var dest = String(link.url || '');
  var host = '';
  try { host = new URL(dest).hostname.replace(/^www\./, ''); } catch (e) {}
  var letter = (host || 'u').charAt(0).toUpperCase();
  var dataJs = 'var T=' + JSON.stringify(dest) + ',H=' + JSON.stringify(host || 'destination') + ';';
  return '<!DOCTYPE html><html lang="en"><head>' + subHead('Redirecting \u2014 Shrinqo', '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="You are being redirected \u2014 Shrinqo"><meta property="og:description" content="Opens ' + escapeHtml(host || dest.slice(0, 80)) + ' \u2014 shared via Shrinqo"><meta property="og:image" content="' + SITE_URL + '/og-image.png">')
    + '</head><body>' + subHeader()
    + '<main>'
    + '<div class="ad-banner" style="margin:0 0 14px"></div>'
    + '<div class="card" id="stepbox" style="text-align:center">'
    + '<div class="chip in1" id="chip">Step 1 of 3</div>'
    + '<div class="in2" style="margin-top:18px">'
    + '<span style="display:inline-flex;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.12));border:1px solid rgba(37,99,235,.2);align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#4338ca">' + escapeHtml(letter) + '</span>'
    + '<div style="margin-top:10px;font-size:14px;font-weight:700">Taking you to <span style="color:#4338ca" id="h1"></span></div>'
    + '<div style="font-size:11.5px;color:#94a3b8;margin-top:3px">Free links are funded by a few seconds of your time</div>'
    + '</div>'
    + '<div class="ring in3" id="ring" style="--p:100"><span class="rnum" id="num">15</span></div>'
    + '<p class="rmsg in3" id="msg"></p>'
    + '<button class="cta off in3" id="go" disabled>Wait\u2026</button>'
    + '<div class="dots in4"><b class="on"></b><b></b><b></b></div>'
    + '<noscript><p style="margin:18px 0 0;font-size:13px;color:#64748b">JavaScript is off \u2014 <a href="' + escapeHtml(dest) + '" rel="nofollow">continue to destination</a></p></noscript>'
    + '</div>'
    + '<div class="ad-duo" style="margin:14px 0 0"></div>'
    + '<div class="ad-count" style="margin:14px 0 0"></div>'
    + '<div class="safead" style="margin:14px 0 0"></div>'
    + '</main>'
    + '<div class="foot">Shared via <a href="' + SITE_URL + '/">Shrinqo</a> \u2014 free URL shortener</div>'
    + SAFEAD + MTS
    + '<script>' + dataJs
    + 'document.getElementById("h1").textContent=H;'
    + 'var chip=document.getElementById("chip"),ring=document.getElementById("ring"),num=document.getElementById("num"),msg=document.getElementById("msg"),btn=document.getElementById("go"),dots=document.querySelectorAll(".dots b");'
    + 'var cur=1,SECS=15;'
    + 'function run(){'
    + 'chip.textContent=["Step 1 of 3","Step 2 of 3","Final Step"][cur-1];'
    + 'for(var i=0;i<dots.length;i++)dots[i].className=i<cur?"on":"";'
    + 'ring.classList.remove("done","warn");ring.style.setProperty("--p",100);'
    + 'btn.disabled=true;btn.className="cta off";num.style.background="";num.style.webkitTextFillColor="";num.style.color="";'
    + 'if(cur===1)msg.innerHTML="Please wait <strong>"+SECS+"</strong> seconds";else if(cur===2)msg.textContent="Verifying your session\\u2026";else msg.innerHTML="Unlocking <strong>"+H+"</strong> in <strong>"+SECS+"</strong>s";'
    + 'btn.textContent=cur===3?"Almost there\\u2026":"Wait\\u2026";'
    + 'var sec=SECS;'
    + 'var iv=setInterval(function(){sec--;'
    + 'num.textContent=sec>0?sec:"0";'
    + 'ring.style.setProperty("--p",Math.max(0,(sec/SECS)*100));'
    + 'if(sec<=5)ring.classList.add("warn");'
    + 'if(sec<=0){clearInterval(iv);'
    + 'ring.classList.remove("warn");ring.classList.add("done");num.textContent="\\u2713";num.style.background="none";num.style.webkitTextFillColor="#059669";'
    + 'msg.innerHTML="<strong style=\\"color:#059669\\">Ready!</strong>";'
    + 'btn.textContent=(cur===3?("Continue to "+H+" \\u2192"):"Click here to continue");'
    + 'btn.disabled=false;btn.className="cta go";'
    + 'btn.onclick=function(){if(cur<3){cur++;run();window.scrollTo({top:0,behavior:"smooth"});}else{fin();}}}'
    + '},1000)}'
    + 'function fin(){boom();document.getElementById("stepbox").style.display="none";'
    + 'var w=document.createElement("div");w.style.cssText="max-width:520px;margin:40px auto;padding:44px 24px;text-align:center;background:rgba(255,255,255,.92);border:1px solid rgba(226,232,240,.9);border-radius:24px;box-shadow:0 24px 60px -20px rgba(37,99,235,.18);animation:sIn .45s cubic-bezier(.22,1,.36,1) both";'
    + 'w.innerHTML="<div style=\\"font-size:40px\\">&#127919;</div><h2 style=\\"font-size:20px;font-weight:800;margin:14px 0 6px\\">You made it!</h2><p style=\\"font-size:13.5px;color:#64748b;margin:0 0 22px\\">Opening <b>"+H+"</b> in a moment\\u2026</p><button id=\\"lastgo\\" class=\\"gbtn\\" style=\\"padding:13px 30px;font-size:14.5px\\\">Open now \\u2192</button>";'
    + 'document.querySelector("main").prepend(w);'
    + 'document.getElementById("lastgo").onclick=function(){window.location.href=T;};'
    + 'setTimeout(function(){window.location.href=T;},900);}'
    + BOOMJS + 'run();'
    + '</script>' + SUBFX + '</body></html>';
}

// ---- Target-site metadata for crawler preview cards ----
const META_TTL_OK = 6 * 3600 * 1000;
const META_TTL_FAIL = 30 * 60 * 1000;
const metaCache = new Map();

function decodeEntities(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (m, n) => { try { return String.fromCodePoint(+n); } catch(e) { return m; } })
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch(e) { return m; } })
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function extractTag(head, re) {
  var m = head.match(re);
  if (!m) return '';
  return decodeEntities(m[1].replace(/\s+/g, ' ').trim().slice(0, 500));
}

function parseHeadMeta(s) {
  if (!s) return null;
  var headEnd = s.indexOf('</head>');
  var head = headEnd > -1 ? s.slice(0, headEnd) : s.slice(0, 200000);
  function both(reA, reB) {
    return extractTag(head, reA) || extractTag(head, reB);
  }
  var meta = {
    title: extractTag(head, /<title[^>]*>([\s\S]*?)<\/title>/i),
    ogTitle: both(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
                  /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:title["']/i),
    desc: both(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
               /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:description["']/i)
         || both(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
                 /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i),
    image: both(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']*)["']/i,
                /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:image(?::secure_url)?["']/i)
           || both(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']*)["']/i,
                   /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']twitter:image(?::src)?["']/i)
  };
  if (!meta.title && !meta.ogTitle && !meta.desc && !meta.image) return null;
  return meta;
}

function isPrivateHost(hostname) {
  var h = String(hostname || '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '::1' || h === '[::1]' || h === '0.0.0.0' || h === '::') return true;
  var m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    var a = +m[1], b = +m[2];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    if (a >= 224) return true;
  }
  return false;
}

function fetchUrlMeta(target, depth) {
  return new Promise(function(resolve) {
    var done = false;
    function finish(v) { if (!done) { done = true; resolve(v); } }
    var u;
    try { u = new URL(target); } catch(e) { return finish(null); }
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || isPrivateHost(u.hostname)) return finish(null);
    if ((depth || 0) > 2) return finish(null);
    var mod = u.protocol === 'https:' ? https : http;
    var req = mod.get(u.href, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    }, function(r) {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        try {
          var next = new URL(r.headers.location, u.href).href;
          fetchUrlMeta(next, (depth || 0) + 1).then(finish);
        } catch(e) { finish(null); }
        return;
      }
      if (r.statusCode >= 400 || !/text\/html|application\/xhtml/i.test(r.headers['content-type'] || '')) {
        r.resume(); return finish(null);
      }
      var buf = [], len = 0, stopped = false;
      r.on('data', function(c) {
        len += c.length;
        buf.push(c);
        if (len > 262144) stopped = true;
        var s = Buffer.concat(buf).toString('utf8');
        if (stopped || s.indexOf('</head>') !== -1) {
          r.destroy();
          finish(parseHeadMeta(s));
        }
      });
      r.on('end', function() { finish(parseHeadMeta(Buffer.concat(buf).toString('utf8'))); });
      r.on('error', function() { finish(null); });
    });
    req.on('timeout', function() { req.destroy(); });
    req.on('error', function() { finish(null); });
  });
}

async function getUrlMeta(id, target) {
  var hit = metaCache.get(id);
  var now = Date.now();
  if (hit && hit.exp > now) return hit.meta;
  var meta = await fetchUrlMeta(target);
  metaCache.set(id, { meta: meta, exp: now + (meta ? META_TTL_OK : META_TTL_FAIL) });
  if (metaCache.size > 2000) {
    var firstKey = metaCache.keys().next().value;
    metaCache.delete(firstKey);
  }
  return meta;
}

function crawlerPage(link, meta) {
  var shortUrl = SITE_URL + '/' + link.id;
  var host = '';
  try { host = new URL(link.url).hostname; } catch(e) {}
  // Prefer the destination site's own card; fall back to a neutral one
  var title = (meta && (meta.ogTitle || meta.title)) || (host ? host : link.url);
  var desc = (meta && (meta.desc || '')) || ('Opens ' + (host || link.url) + ' \u2014 shared via Shrinqo');
  var img = (meta && meta.image) ? meta.image : (SITE_URL + '/og-image.png');
  var siteName = host || 'Shrinqo';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHtml(title) + '</title><meta name="robots" content="noindex, nofollow"><meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + escapeHtml(desc) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="' + escapeHtml(siteName) + '"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + escapeHtml(img) + '"><meta http-equiv="refresh" content="0; url=' + escapeHtml(link.url) + '"></head><body><p>Redirecting to <a href="' + escapeHtml(link.url) + '">' + escapeHtml(host || link.url) + '</a>...</p></body></html>';
}

function textPage(link) {
  var shortUrl = SITE_URL + '/' + link.id;
  var text = escapeHtml(link.text_content);
  var preview = escapeHtml(String(link.text_content).slice(0, 160));
  var chars = String(link.text_content).length;
  var words = String(link.text_content).trim().split(/\s+/).filter(Boolean).length;
  return '<!DOCTYPE html><html lang="en"><head>' + subHead('Shrinqo \u2014 text /' + escapeHtml(link.id), '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="Shared text \u2014 /' + escapeHtml(link.id) + '"><meta property="og:description" content="' + preview + '"><meta property="og:type" content="website"><meta property="og:site_name" content="Shrinqo"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + SITE_URL + '/og-image.png">')
    + '</head><body>' + subHeader('<button class="gbtn" onclick="copyText()">Copy text</button>')
    + '<main>'
    + '<div class="card in1">'
    + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">'
    + '<span class="chip">' + chars + ' chars</span>'
    + '<span class="chip">' + words + ' words</span>'
    + '<span class="chip">paste /' + escapeHtml(link.id) + '</span>'
    + '</div>'
    + '<pre id="tx" style="white-space:pre-wrap;word-wrap:break-word;margin:0;background:#f8fafc;border:1px solid var(--line);border-radius:16px;padding:20px;font-size:14px;line-height:1.65;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--ink2);max-height:70vh;overflow:auto">' + text + '</pre>'
    + '</div>'
    + '</main>'
    + '<div class="foot">Shared with <a href="' + SITE_URL + '/">Shrinqo</a> \u2014 free pastes &amp; short links</div>'
    + '<textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea>'
    + '<script>function copyText(){var t=document.getElementById("tx").textContent;var b=document.querySelector(".gbtn");'
    + 'function ok(){b.textContent="Copied!";setTimeout(function(){b.textContent="Copy text"},1600)}'
    + 'if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){fallback()})}else fallback();'
    + 'function fallback(){var tb=document.getElementById("tb");tb.value=t;tb.select();try{document.execCommand("copy")}catch(e){}ok()}}</script>'
    + SUBFX + '</body></html>';
}

function filePage(link) {
  var shortUrl = SITE_URL + '/' + link.id;
  var dlUrl = SITE_URL + '/' + link.id + '/dl';
  var name = escapeHtml(link.name || 'file');
  var type = escapeHtml(link.type || 'file');
  var size = fmtSize(link.size || 0);
  var ext = String(link.name || '').split('.').pop().slice(0, 5) || 'file';
  return '<!DOCTYPE html><html lang="en"><head>' + subHead('Shrinqo \u2014 ' + name, '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="Shared file \u2014 ' + name + '"><meta property="og:description" content="' + size + ' file shared via Shrinqo"><meta property="og:type" content="website"><meta property="og:site_name" content="Shrinqo"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + SITE_URL + '/og-image.png">')
    + '</head><body>' + subHeader('<button class="gbtn" onclick="copyDl()">Copy link</button>')
    + '<main>'
    + '<div class="ad-banner" style="margin:0 0 14px"></div>'
    + '<div class="card" style="text-align:center">'
    + '<div id="dlbox">'
    + '<div class="in1" style="width:88px;height:88px;margin:0 auto;border-radius:24px;background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.12));border:1px solid rgba(37,99,235,.2);display:flex;align-items:center;justify-content:center;flex-direction:column;animation:sPop .5s cubic-bezier(.22,1,.36,1) both,floaty 3.4s ease-in-out 1.1s infinite">'
    + '<span style="font-size:30px">&#128190;</span><span style="font-size:9.5px;font-weight:800;color:#4338ca;text-transform:uppercase;letter-spacing:.06em;margin-top:3px">' + escapeHtml(ext) + '</span></div>'
    + '<h1 class="in2" style="font-size:19px;font-weight:800;margin:18px 0 4px;word-break:break-all">' + name + '</h1>'
    + '<div class="in2" style="color:#94a3b8;font-size:12.5px;font-weight:600">' + type + ' \u00b7 ' + size + ' \u00b7 shared via Shrinqo</div>'
    + '<div id="reveal" class="in4" style="display:none;margin-top:24px;animation:sPop .45s cubic-bezier(.22,1,.36,1) both">'
    + '<a class="gbtn" href="' + dlUrl + '" download="' + name + '" rel="noopener" style="display:inline-block;text-decoration:none;padding:15px 34px;font-size:15px">\u2B07 Download now</a>'
    + '<div style="margin-top:14px;font-size:12px;color:#94a3b8;word-break:break-all"><b style="color:#64748b">Link:</b> ' + shortUrl + '</div>'
    + '</div>'
    + '</div>'
    + '<div id="stepbox" style="margin-top:26px">'
    + '<div class="chip" id="chip">Step 1 of 3</div>'
    + '<div class="ring" id="ring" style="--p:100"><span class="rnum" id="num">15</span></div>'
    + '<p class="rmsg" id="msg"></p>'
    + '<button class="cta off" id="go" disabled>Wait\u2026</button>'
    + '<div class="dots"><b class="on"></b><b></b><b></b></div>'
    + '</div>'
    + '</div>'
    + '<div class="ad-duo" style="margin:14px 0 0"></div>'
    + '<div class="ad-count" style="margin:14px 0 0"></div>'
    + '<div class="safead" style="margin:14px 0 0"></div>'
    + '</main>'
    + '<div class="foot">Shared with <a href="' + SITE_URL + '/">Shrinqo</a> \u2014 free file hosting</div>'
    + SAFEAD + MTS
    + '<script>'
    + 'var SECS=15,cur=1;'
    + 'var chip=document.getElementById("chip"),ring=document.getElementById("ring"),num=document.getElementById("num"),msg=document.getElementById("msg"),btn=document.getElementById("go"),dots=document.querySelectorAll(".dots b");'
    + 'function run(){chip.textContent=["Step 1 of 3","Step 2 of 3","Final Step"][cur-1];'
    + 'for(var i=0;i<dots.length;i++)dots[i].className=i<cur?"on":"";'
    + 'ring.classList.remove("done","warn");ring.style.setProperty("--p",100);'
    + 'btn.disabled=true;btn.className="cta off";num.style.background="";num.style.webkitTextFillColor="";num.style.color="";'
    + 'if(cur===1)msg.innerHTML="Preparing your download \\u2014 <strong>"+SECS+"</strong>s";else if(cur===2)msg.textContent="Verifying your session\\u2026";else msg.innerHTML="Final check \\u2014 <strong>"+SECS+"</strong>s to go";'
    + 'btn.textContent=cur===3?"Almost there\\u2026":"Wait\\u2026";'
    + 'var sec=SECS;'
    + 'var iv=setInterval(function(){sec--;'
    + 'num.textContent=sec>0?sec:"0";ring.style.setProperty("--p",Math.max(0,(sec/SECS)*100));'
    + 'if(sec<=5)ring.classList.add("warn");'
    + 'if(sec<=0){clearInterval(iv);ring.classList.remove("warn");ring.classList.add("done");num.textContent="\\u2713";num.style.background="none";num.style.webkitTextFillColor="#059669";'
    + 'msg.innerHTML="<strong style=\\"color:#059669\\">Step "+cur+" complete!</strong>";'
    + 'btn.textContent=(cur===3?"Get your download":"Click here to continue");'
    + 'btn.disabled=false;btn.className="cta go";'
    + 'btn.onclick=function(){if(cur<3){cur++;run();}else fin();}}},1000)}'
    + 'function fin(){boom();document.getElementById("stepbox").style.display="none";document.getElementById("reveal").style.display="block";try{document.getElementById("reveal").scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}}'
    + 'function copyDl(){var tb=document.getElementById("tb")||document.createElement("textarea");tb.value="' + dlUrl + '";tb.id="tb";tb.style.cssText="position:fixed;opacity:0";document.body.appendChild(tb);tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector(".gbtn");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy link"},1600)}'
    + BOOMJS + 'run();'
    + '</script>' + SUBFX + '</body></html>';
}

// ===================== API v1 =====================
const API_VERSION = '2.0.0';
const START_TS = Date.now();

// prune expired sessions (boot + every 6h) — prevents unbounded table growth
try { db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()); } catch (e) {}
setInterval(function () {
  try { db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()); } catch (e) {}
}, 6 * 3600 * 1000).unref();
const RESERVED = new Set(['api','dl','me','login','register','logout','robots','sitemap','admin','assets','static','public','favicon','index','health','docs','openapi','preview','stats','links','auth','keys','shorten','files','text','file']);
const ALIAS_RE = /^[a-zA-Z0-9_-]{1,32}$/;

function normalizeUrl(raw) {
  var target = String(raw || '').trim();
  if (!target) return { error: 'URL required' };
  if (/\s/.test(target)) return { error: 'URL contains whitespace' };
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  var u;
  try { u = new URL(target); } catch(e) { return { error: 'Invalid URL' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: 'Only http/https URLs are allowed' };
  if (isPrivateHost(u.hostname)) return { error: 'Private network URLs are not allowed' };
  return { url: u.href };
}

function calcExpiry(secs) {
  var n = parseInt(secs, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  n = Math.min(n, 365 * 86400);
  return new Date(Date.now() + n * 1000).toISOString();
}

function linkJson(l) {
  return {
    id: l.id,
    short_url: SITE_URL + '/' + l.id,
    kind: l.kind,
    url: l.url || null,
    name: l.name || null,
    type: l.type || null,
    size: l.size || 0,
    clicks: l.clicks || 0,
    enabled: l.enabled === undefined ? true : !!l.enabled,
    expires_at: l.expires_at || null,
    created: l.created
  };
}

function createV1Link(user, kind, content, opts) {
  var opts2 = opts || {};
  var alias = String(opts2.alias || '').trim();
  if (alias) {
    if (!user) return { code: 401, error: 'auth_required', message: 'Sign in or use an API key to claim custom aliases' };
    if (!ALIAS_RE.test(alias)) return { code: 400, error: 'invalid_alias', message: 'Alias must be 1-32 chars: a-z A-Z 0-9 _ -' };
    if (RESERVED.has(alias.toLowerCase())) return { code: 409, error: 'alias_reserved', message: 'That alias is reserved' };
    if (S.getLink.get(alias)) return { code: 409, error: 'alias_taken', message: 'Alias already in use' };
  }
  var expiresAt = calcExpiry(opts2.expires_in);
  var hashKey = kind === 'url' ? 'url:' + sha1(content)
              : kind === 'text' ? 'text:' + sha1(content)
              : 'fh:' + content;
  var existing = S.getDedup.get(hashKey);
  if (existing && !alias) return { id: existing.link_id, created: false };

  var now = new Date().toISOString();
  var id;
  if (alias) {
    id = alias;
  } else {
    var attempts = 0;
    do {
      id = genId();
      attempts++;
      if (S.getLink.get(id) || RESERVED.has(id.toLowerCase())) continue;
      break;
    } while (attempts < 8);
  }
  var ins = S.insLink.run(
    id, kind,
    kind === 'url' ? content : null,
    kind === 'text' ? content : null,
    opts2.name || null, null,
    kind === 'file' ? (opts2.size || 0) : 0,
    kind === 'file' ? String(content) : null,
    0, 0,
    user ? user.name : null, now,
    null, null, null, null
  );
  if (ins.changes === 0) return { code: 409, error: 'id_taken', message: 'Could not allocate id — retry' };
  db.prepare('UPDATE links SET expires_at = ? WHERE id = ?').run(expiresAt, id);
  S.insDedup.run(hashKey, id);
  if (user) S.insUL.run(user.name, id);
  var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
  return { id: id, created: true };
}

async function handleApiV1(req, res, pathname, method, ip, jsonBody, rawBody) {
  const route = pathname.replace(/^\/api\/v1/, '') || '/';

  // ---- GET /api/v1 : index ----
  if ((route === '/' || route === '') && method === 'GET') {
    return sendOk(res, 200, {
      name: 'Shrinqo API',
      version: API_VERSION,
      docs: SITE_URL + '/docs',
      openapi: SITE_URL + '/openapi.json',
      health: SITE_URL + '/api/v1/health',
      auth: ['session cookie (ls_sess)', 'Authorization: Bearer <api key>'],
      endpoints: [
        'GET    /api/v1/health',
        'POST   /api/v1/auth/register        {name,password}',
        'POST   /api/v1/auth/login           {name,password}',
        'POST   /api/v1/auth/logout',
        'POST   /api/v1/auth/logout-all',
        'POST   /api/v1/auth/password        {current_password,new_password}',
        'GET    /api/v1/auth/me',
        'GET    /api/v1/keys',
        'POST   /api/v1/keys                 {name} -> returns secret ONCE',
        'DELETE /api/v1/keys/:id',
        'POST   /api/v1/shorten              {url|text, alias?, expires_in?, name?}',
        'POST   /api/v1/shorten/bulk         {links:[{url|text},...]} max 25',
        'POST   /api/v1/files                raw body + X-File-Name header',
        'GET    /api/v1/links                ?kind=&q=&sort=&limit=&offset=',
        'GET    /api/v1/links/public         ?limit=&offset=',
        'GET    /api/v1/links/:id',
        'PATCH  /api/v1/links/:id            {url?|text?, name?, enabled?, expires_in?}',
        'DELETE /api/v1/links/:id',
        'GET    /api/v1/links/:id/stats      ?days=1..90',
        'GET    /api/v1/stats',
        'GET    /api/v1/preview              ?url='
      ]
    });
  }

  // ---- health ----
  if (route === '/health' && method === 'GET') {
    var dbOk = true;
    try { db.prepare('SELECT 1').get(); } catch(e) { dbOk = false; }
    return sendOk(res, 200, {
      status: dbOk ? 'healthy' : 'degraded',
      version: API_VERSION,
      uptime_seconds: Math.floor((Date.now() - START_TS) / 1000),
      node: process.version,
      database: dbOk ? 'ok' : 'error',
      time: new Date().toISOString()
    });
  }

  // ---- auth: register ----
  if (route === '/auth/register' && method === 'POST') {
    var rl = rateLimit(ip, 'auth', 8, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Too many attempts', rlHeaders(rl, 8));
    var name = String(jsonBody.name || '').trim().toLowerCase();
    var pw = String(jsonBody.password || '');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) return sendErr(res, 400, 'invalid_username', 'Username: 3-20 chars, letters/digits/_', rlHeaders(rl, 8));
    if (pw.length < 6 || pw.length > 128) return sendErr(res, 400, 'weak_password', 'Password must be 6-128 chars', rlHeaders(rl, 8));
    if (S.getUser.get(name)) return sendErr(res, 409, 'username_taken', 'Username taken', rlHeaders(rl, 8));
    var salt = randomHex(16);
    var pwhash = (await crypto.pbkdf2Promise(pw, salt, 100000, 32, 'sha256')).toString('hex');
    S.insUser.run(name, pwhash, salt, 100000, new Date().toISOString());
    var token = createSession(name);
    sendOk(res, 200, { name: name }, { 'Set-Cookie': sessionCookie(req, token) });
    return;
  }

  // ---- auth: login ----
  if (route === '/auth/login' && method === 'POST') {
    var rl = rateLimit(ip, 'auth', 8, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Too many attempts', rlHeaders(rl, 8));
    var name = String(jsonBody.name || '').trim().toLowerCase();
    var rec = S.getUser.get(name);
    if (!rec) return sendErr(res, 401, 'invalid_credentials', 'Invalid credentials', rlHeaders(rl, 8));
    var pwhash = (await crypto.pbkdf2Promise(String(jsonBody.password || ''), rec.salt, rec.iter, 32, 'sha256')).toString('hex');
    if (!constEq(pwhash, rec.pwhash)) return sendErr(res, 401, 'invalid_credentials', 'Invalid credentials', rlHeaders(rl, 8));
    var token = createSession(name);
    sendOk(res, 200, { name: name }, { 'Set-Cookie': sessionCookie(req, token) });
    return;
  }

  // ---- auth: logout ----
  if (route === '/auth/logout' && method === 'POST') {
    var t = parseCookies(req.headers.cookie || '')['ls_sess'];
    if (t) S.delSess.run(t);
    sendOk(res, 200, { logged_out: true }, { 'Set-Cookie': sessionCookie(req, null) });
    return;
  }

  // everything below needs auth except where noted
  var user = getUser(req);

  if (route === '/auth/me' && method === 'GET') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    var uc = S.userCreated.get(user.name);
    var mineCount = S.countMine.get(user.name).c;
    var myClicks = db.prepare('SELECT COALESCE(SUM(clicks),0) c FROM links WHERE owner = ?').get(user.name).c;
    return sendOk(res, 200, {
      name: user.name,
      via: user.via,
      created: uc ? uc.created : null,
      links: mineCount,
      total_clicks: myClicks
    });
  }

  var isOpsRoute = route === '/ops' || route.indexOf('/ops/') === 0;
  if (!user && !isOpsRoute) {
    var PUBLIC_GETS = { '/stats': 1, '/links/public': 1, '/preview': 1 };
    var anonOk = (PUBLIC_GETS[route] && method === 'GET') ||
      (/^\/links\/[a-zA-Z0-9_-]{1,32}$/.test(route) && method === 'GET') ||
      ((route === '/shorten' || route === '/shorten/bulk' || route === '/files') && method === 'POST');
    if (!anonOk) return sendErr(res, 401, 'unauthorized', 'Sign in or send Authorization: Bearer <key>');
  }

  // ---- auth: logout-all ----
  if (route === '/auth/logout-all' && method === 'POST') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    S.sessAll.run(user.name);
    sendOk(res, 200, { revoked: 'all sessions' }, { 'Set-Cookie': sessionCookie(req, null) });
    return;
  }

  // ---- auth: change password ----
  if (route === '/auth/password' && method === 'POST') {
    if (!user || user.via !== 'session') return sendErr(res, 401, 'unauthorized', 'Password change requires a browser session');
    var cur = S.getUser.get(user.name);
    var ok = false;
    try {
      var h = (await crypto.pbkdf2Promise(String(jsonBody.current_password || ''), cur.salt, cur.iter, 32, 'sha256')).toString('hex');
      ok = constEq(h, cur.pwhash);
    } catch(e) {}
    if (!ok) return sendErr(res, 403, 'wrong_password', 'Current password incorrect');
    var npw = String(jsonBody.new_password || '');
    if (npw.length < 6 || npw.length > 128) return sendErr(res, 400, 'weak_password', 'New password must be 6-128 chars');
    var salt = randomHex(16);
    var pwhash = (await crypto.pbkdf2Promise(npw, salt, 100000, 32, 'sha256')).toString('hex');
    S.updPassword.run(pwhash, salt, 100000, user.name);
    S.sessAll.run(user.name);
    var token = createSession(user.name);
    sendOk(res, 200, { updated: true }, { 'Set-Cookie': sessionCookie(req, token) });
    return;
  }

  // ---- API keys ----
  if (route === '/keys' && method === 'GET') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    return sendOk(res, 200, S.getKeysFor.all(user.name));
  }
  if (route === '/keys' && method === 'POST') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    var rl = rateLimit(ip, 'keys', 5, 3600000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Max 5 keys per hour', rlHeaders(rl, 5));
    var kname = String(jsonBody.name || '').trim().slice(0, 40) || 'unnamed';
    var secret = 'lsk_' + randomHex(20);
    var kid = randomHex(8);
    S.insKey.run(kid, kname, secret.slice(0, 12), hashToken(secret), user.name, new Date().toISOString());
    return sendOk(res, 201, {
      id: kid, name: kname, secret: secret,
      note: 'Store this secret now — it is never shown again. Use as: Authorization: Bearer ' + secret.slice(0, 12) + '...'
    });
  }
  var keyDel = route.match(/^\/keys\/([a-f0-9]{8,16})$/);
  if (keyDel && method === 'DELETE') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    var d = S.delKey.run(keyDel[1], user.name);
    if (d.changes === 0) return sendErr(res, 404, 'not_found', 'Key not found');
    return sendOk(res, 200, { revoked: keyDel[1] });
  }

  // ---- shorten (single) ----
  if (route === '/shorten' && method === 'POST') {
    var rl = rateLimit(ip, 'v1short', 30, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Rate limit: 30 links/min', rlHeaders(rl, 30));
    var isText = jsonBody.text !== undefined && jsonBody.text !== null && jsonBody.url === undefined;
    var r;
    if (isText) {
      var text = String(jsonBody.text || '');
      if (!text.trim()) return sendErr(res, 400, 'empty_text', 'Text required', rlHeaders(rl, 30));
      if (text.length > 100000) return sendErr(res, 400, 'too_long', 'Text max 100000 chars', rlHeaders(rl, 30));
      r = createV1Link(user, 'text', text, jsonBody);
    } else {
      var nu = normalizeUrl(jsonBody.url);
      if (nu.error) return sendErr(res, 400, 'invalid_url', nu.error, rlHeaders(rl, 30));
      r = createV1Link(user, 'url', nu.url, jsonBody);
    }
    if (r.error) return sendErr(res, r.code || 500, r.error, r.message, rlHeaders(rl, 30));
    var row = S.getLink.get(r.id);
    return sendOk(res, r.created ? 201 : 200, Object.assign(linkJson(row), { deduplicated: !r.created }), rlHeaders(rl, 30));
  }

  // ---- bulk shorten ----
  if (route === '/shorten/bulk' && method === 'POST') {
    var rl = rateLimit(ip, 'v1bulk', 3, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Rate limit: 3 bulk calls/min', rlHeaders(rl, 3));
    var items = Array.isArray(jsonBody.links) ? jsonBody.links : [];
    if (items.length === 0) return sendErr(res, 400, 'empty', 'Provide links:[{url}|{text},...]', rlHeaders(rl, 3));
    if (items.length > 25) return sendErr(res, 400, 'too_many', 'Max 25 links per call', rlHeaders(rl, 3));
    var results = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var rr;
      if (it.text !== undefined && it.text !== null) {
        var txt = String(it.text || '');
        rr = (!txt.trim() || txt.length > 100000)
          ? { error: 'invalid_text', message: 'Item ' + i + ': text empty or >100k' }
          : createV1Link(user, 'text', txt, it);
      } else {
        var nu = normalizeUrl(it.url);
        rr = nu.error ? { error: 'invalid_url', message: 'Item ' + i + ': ' + nu.error } : createV1Link(user, 'url', nu.url, it);
      }
      if (rr.error) results.push({ index: i, ok: false, error: rr.error, message: rr.message });
      else results.push({ index: i, ok: true, id: rr.id, short_url: SITE_URL + '/' + rr.id, created: rr.created });
    }
    return sendOk(res, 200, { processed: results.length, succeeded: results.filter(x => x.ok).length, results }, rlHeaders(rl, 3));
  }

  // ---- file upload (v1) ----
  if (route === '/files' && method === 'POST') {
    var rl = rateLimit(ip, 'v1file', 6, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Rate limit: 6 uploads/min', rlHeaders(rl, 6));
    var ghToken = process.env.GITHUB_TOKEN || '';
    if (!ghToken) return sendErr(res, 503, 'storage_unavailable', 'File storage not configured', rlHeaders(rl, 6));
    if (!rawBody || rawBody.length === 0) return sendErr(res, 400, 'empty_body', 'Send file bytes in request body', rlHeaders(rl, 6));
    var maxFile = user ? MAX_FILE : Math.min(MAX_FILE, 25 * 1024 * 1024);
    if (rawBody.length > maxFile) return sendErr(res, 413, 'too_large', user ? 'Max 100 MB' : 'Max 25 MB — free account lifts it to 100 MB', rlHeaders(rl, 6));
    var fileName = '';
    try { fileName = decodeURIComponent(req.headers['x-file-name'] || ''); } catch(e) {}
    fileName = String(fileName).trim().replace(/[\/\\]/g, '_').slice(0, 120) || 'file';
    var fileType = (req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
    if (/^text\/html|javascript/i.test(fileType)) fileType = 'application/octet-stream';
    var fhash = sha256(rawBody);
    var fexisting = S.getDedup.get('fh:' + fhash);
    if (fexisting) {
      var frow = S.getLink.get(fexisting.link_id);
      return sendOk(res, 200, Object.assign(linkJson(frow), { deduplicated: true }), rlHeaders(rl, 6));
    }
    var fid;
    var attempts = 0;
    do { fid = genId(); attempts++; } while ((S.getLink.get(fid) || RESERVED.has(fid.toLowerCase())) && attempts < 8);
    var chunks = Math.max(1, Math.ceil(rawBody.length / FILE_CHUNK));
    var expiresAtF = calcExpiry(jsonBody.expires_in);
    S.insLink.run(fid, 'file', null, null, fileName, fileType, rawBody.length, fhash, chunks, 0, user ? user.name : null, new Date().toISOString(), '', '', '', '');
    db.prepare('UPDATE links SET expires_at = ? WHERE id = ?').run(expiresAtF, fid);
    var adds = [];
    var prefix = 'files/' + fid;
    for (var ci = 0; ci < chunks; ci++) {
      var start = ci * FILE_CHUNK;
      adds.push({ path: prefix + '/part-' + String(ci + 1).padStart(4, '0') + '.b64', content: rawBody.slice(start, start + FILE_CHUNK).toString('base64') });
    }
    adds.push({ path: prefix + '/manifest.json', content: JSON.stringify({ id: fid, name: fileName, type: fileType, size: rawBody.length, hash: fhash, chunks }) });
    var commitSha;
    try {
      commitSha = await githubCommit(adds, []);
    } catch (e) {
      S.delLink.run(fid);
      return sendErr(res, 502, 'upload_failed', 'File storage write failed', rlHeaders(rl, 6));
    }
    S.updCommit.run(commitSha || '', process.env.GITHUB_OWNER || '', process.env.GITHUB_REPO || '', process.env.GITHUB_BRANCH || 'main', fid);
    S.insDedup.run('fh:' + fhash, fid);
    if (user) S.insUL.run(user.name, fid);
    var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
    var frow2 = S.getLink.get(fid);
    return sendOk(res, 201, linkJson(frow2), rlHeaders(rl, 6));
  }

  // ---- my links list ----
  if (route === '/links' && method === 'GET') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    var limit = Math.min(Math.max(parseInt(new URL(req.url, 'http://x').searchParams.get('limit'), 10) || 50, 1), 200);
    var offset = Math.max(parseInt(new URL(req.url, 'http://x').searchParams.get('offset'), 10) || 0, 0);
    var q = (new URL(req.url, 'http://x').searchParams.get('q') || '').trim();
    var rows, total;
    if (q) {
      var like = '%' + q.replace(/[%_]/g, '\\$&') + '%';
      total = db.prepare("SELECT COUNT(*) c FROM links WHERE owner = ? AND (url LIKE ? ESCAPE '\\' OR text_content LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR id LIKE ?)").get(user.name, like, like, like, like).c;
      rows = S.searchMine.all(user.name, like, like, like, like, limit, offset);
    } else {
      total = S.countMine.get(user.name).c;
      rows = S.listMine.all(user.name, limit, offset);
    }
    var kindFilter = new URL(req.url, 'http://x').searchParams.get('kind');
    if (kindFilter) rows = rows.filter(r => r.kind === kindFilter);
    return sendOk(res, 200, { total, limit, offset, count: rows.length, links: rows.map(linkJson) }, { 'X-Total-Count': String(total) });
  }

  // ---- public feed ----
  if (route === '/links/public' && method === 'GET') {
    var sp = new URL(req.url, 'http://x').searchParams;
    var plimit = Math.min(Math.max(parseInt(sp.get('limit'), 10) || 25, 1), 100);
    var poffset = Math.max(parseInt(sp.get('offset'), 10) || 0, 0);
    var prows = db.prepare(`SELECT id,kind,url,text_content,name,type,size,clicks,created FROM links ORDER BY created DESC LIMIT ? OFFSET ?`).all(plimit, poffset);
    var ptotal = S.countLinks.get().c;
    return sendOk(res, 200, {
      total: ptotal, limit: plimit, offset: poffset, count: prows.length,
      links: prows.map(function(l) {
        return {
          id: l.id, short_url: SITE_URL + '/' + l.id, kind: l.kind,
          clicks: l.clicks, created: l.created, name: l.name || null,
          url: l.kind === 'url' ? l.url : null,
          preview: null
        };
      })
    }, { 'X-Total-Count': String(ptotal) });
  }

  // ---- single link detail / update / delete / stats ----
  var linkMatch = route.match(/^\/links\/([a-zA-Z0-9_-]{1,32})$/);
  if (linkMatch) {
    var lid = linkMatch[1];
    var link = S.getLink.get(lid);
    if (method === 'GET') {
      if (!link) return sendErr(res, 404, 'not_found', 'Link not found');
      var isOwner = user && (link.owner === user.name);
      var pub = {
        id: link.id, short_url: SITE_URL + '/' + link.id, kind: link.kind,
        clicks: link.clicks, created: link.created,
        url: link.kind === 'url' ? link.url : null,
        preview: link.kind === 'text' && link.text_content ? String(link.text_content).replace(/\s+/g, ' ').trim().slice(0, 80) : null,
        name: link.kind === 'file' ? link.name : null,
        size: link.kind === 'file' ? link.size : undefined,
        expired: !!(link.expires_at && Date.now() > Date.parse(link.expires_at))
      };
      if (isOwner) {
        pub.enabled = !!link.enabled;
        pub.expires_at = link.expires_at || null;
        pub.you_own = true;
        if (link.kind === 'text') pub.text = link.text_content;
      }
      return sendOk(res, 200, pub);
    }
    if (method === 'PATCH') {
      if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
      if (!link || link.owner !== user.name) return sendErr(res, 404, 'not_found', 'Link not found');
      var changed = [];
      if (jsonBody.url !== undefined && link.kind === 'url') {
        var nu = normalizeUrl(jsonBody.url);
        if (nu.error) return sendErr(res, 400, 'invalid_url', nu.error);
        S.clearDedup.run(lid);
        S.updUrl.run(nu.url, lid);
        S.insDedup.run('url:' + sha1(nu.url), lid);
        changed.push('url');
      }
      if (jsonBody.text !== undefined && link.kind === 'text') {
        var nt = String(jsonBody.text || '');
        if (!nt.trim() || nt.length > 100000) return sendErr(res, 400, 'invalid_text', 'Text empty or >100k');
        S.clearDedup.run(lid);
        S.updText.run(nt, lid);
        S.insDedup.run('text:' + sha1(nt), lid);
        changed.push('text');
      }
      if (jsonBody.name !== undefined) {
        S.updName.run(String(jsonBody.name).slice(0, 120) || null, lid);
        changed.push('name');
      }
      if (jsonBody.enabled !== undefined) {
        S.updEnabled.run(jsonBody.enabled ? 1 : 0, lid);
        changed.push('enabled');
      }
      if (jsonBody.expires_in !== undefined) {
        var ex = calcExpiry(jsonBody.expires_in);
        S.updExpiry.run(jsonBody.expires_in === null ? null : ex, lid);
        changed.push('expires_at');
      }
      return sendOk(res, 200, Object.assign(linkJson(S.getLink.get(lid)), { changed }));
    }
    if (method === 'DELETE') {
      if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
      if (!link || link.owner !== user.name) return sendErr(res, 404, 'not_found', 'Link not found');
      S.clearDedup.run(lid);
      S.delAllUL.run(lid);
      S.delUL.run(user.name, lid);
      S.delLink.run(lid);
      var m = getMeta(); m.total = Math.max(0, (m.total || 0) - 1); setMeta(m);
      return sendOk(res, 200, { deleted: lid });
    }
  }

  var statMatch = route.match(/^\/links\/([a-zA-Z0-9_-]{1,32})\/stats$/);
  if (statMatch && method === 'GET') {
    if (!user) return sendErr(res, 401, 'unauthorized', 'Not signed in');
    var slink = S.getLink.get(statMatch[1]);
    if (!slink || slink.owner !== user.name) return sendErr(res, 404, 'not_found', 'Link not found');
    var days = Math.min(Math.max(parseInt(new URL(req.url, 'http://x').searchParams.get('days'), 10) || 7, 1), 90);
    var since = Date.now() - days * 86400000;
    return sendOk(res, 200, {
      id: slink.id,
      total_clicks: slink.clicks,
      tracked_clicks: S.countClicksLink.get(slink.id).c,
      period_days: days,
      by_day: S.clicksByDay.all(slink.id, since),
      top_referrers: S.topRefs.all(slink.id),
      recent: S.recentClicks.all(slink.id).map(function(c) { return { at: new Date(c.ts).toISOString(), referrer: c.ref || '(direct)', bot: !!c.bot }; })
    });
  }

  // ---- global stats ----
  if (route === '/stats' && method === 'GET') {
    var mm = getMeta();
    var kinds = {};
    S.byKind.all().forEach(function(k) { kinds[k.kind] = k.c; });
    return sendOk(res, 200, {
      total_links: S.countLinks.get().c,
      total_clicks: mm.clicks || 0,
      clicks_last_24h: S.clicksSince.get(Date.now() - 86400000).c,
      by_kind: kinds,
      version: API_VERSION
    });
  }

  // ---- URL metadata preview ----
  if (route === '/preview' && method === 'GET') {
    var rl = rateLimit(ip, 'v1prev', 10, 60000);
    if (!rl.ok) return sendErr(res, 429, 'rate_limited', 'Rate limit: 10 previews/min', rlHeaders(rl, 10));
    var pu = normalizeUrl(new URL(req.url, 'http://x').searchParams.get('url'));
    if (pu.error) return sendErr(res, 400, 'invalid_url', pu.error, rlHeaders(rl, 10));
    var meta = await fetchUrlMeta(pu.url);
    if (!meta) return sendOk(res, 200, { url: pu.url, found: false }, rlHeaders(rl, 10));
    return sendOk(res, 200, {
      url: pu.url, found: true,
      title: meta.ogTitle || meta.title || null,
      description: meta.desc || null,
      image: meta.image || null
    }, rlHeaders(rl, 10));
  }

  // ================= OPS console (remote admin, key-guarded) =================
  if (route === '/ops' || route.startsWith('/ops/')) return handleOps(req, res, route, method, jsonBody, rawBody);

  return sendErr(res, 404, 'unknown_endpoint', 'See GET /api/v1 for the endpoint catalog');
}

// ---------------- ops implementation ----------------
const OPS_KEY = String(process.env.OPS_KEY || '');
const OPS_ROOT = path.resolve(__dirname, '..', '..', '..'); // server root (plugins/LinkShort/app -> up 3)
const OPS_QUEUE = path.join(__dirname, '..', 'ops-queue'); // plugins/LinkShort/ops-queue (matches OpsBridge)
const OPS_OUT = path.join(__dirname, '..', 'ops-out');
var OPS_EXEC_SEQ = 0;

function opsAuthed(req) {
  if (!OPS_KEY) return false;
  var m = /^Bearer\s+(.+)$/i.exec(req.headers['authorization'] || '');
  return !!m && m[1].trim() === OPS_KEY;
}

function opsSafe(p) {
  var full = path.resolve(OPS_ROOT, String(p || '.'));
  if (full !== OPS_ROOT && full.indexOf(OPS_ROOT + path.sep) !== 0) return null;
  return full;
}

function handleOps(req, res, route, method, jsonBody, rawBody) {
  if (!opsAuthed(req)) {
    if (route === '/ops/ping' && method === 'GET') return sendErr(res, 503, 'ops_disabled', 'Ops console not configured on this server');
    return sendErr(res, 403, 'forbidden', 'Valid ops key required (Authorization: Bearer <key>)');
  }
  var q = {};
  try { new URL(req.url, 'http://x').searchParams.forEach(function (v, k) { q[k] = v; }); } catch (e) {}

  if (route === '/ops/ping' && method === 'GET') {
    return sendOk(res, 200, { pong: true, version: API_VERSION, uptime: Math.floor((Date.now() - START_TS) / 1000) });
  }

  if (route === '/ops/status' && method === 'GET') {
    try {
      var st = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'ops-status.json'), 'utf8'));
      return sendOk(res, 200, Object.assign({ node_uptime: Math.floor((Date.now() - START_TS) / 1000), node_mem_mb: Math.round(process.memoryUsage().rss / 1048576) }, st));
    } catch (e) { return sendOk(res, 200, { ts: null, note: 'no status yet' }); }
  }

  if (route === '/ops/exec' && method === 'POST') {
    var cmd = (jsonBody && typeof jsonBody.command === 'string') ? jsonBody.command : '';
    var mode = jsonBody && jsonBody.mode === 'shell' ? 'shell' : 'console';
    if (!cmd.trim()) return sendErr(res, 400, 'bad_request', 'command required; optional mode=console|shell');
    if (cmd.length > 8192) return sendErr(res, 400, 'bad_request', 'command too long');
    fs.mkdirSync(OPS_QUEUE, { recursive: true });
    fs.mkdirSync(OPS_OUT, { recursive: true });
    // sweep stale files (bridge dead >10min etc.)
    var sweepCutoff = Date.now() - 600000;
    [OPS_QUEUE, OPS_OUT].forEach(function (d) {
      try { fs.readdirSync(d).forEach(function (f) {
        var fp = path.join(d, f);
        try { if (fs.statSync(fp).mtimeMs < sweepCutoff) fs.unlinkSync(fp); } catch (e) {}
      }); } catch (e) {}
    });
    var id = Date.now().toString(36) + '-' + (++OPS_EXEC_SEQ) + '-' + Math.random().toString(36).slice(2, 8);
    fs.writeFileSync(path.join(OPS_QUEUE, id + '.mode'), mode);
    fs.writeFileSync(path.join(OPS_QUEUE, id + '.cmd'), cmd);
    var deadline = Date.now() + 30000;
    (function poll() {
      if (fs.existsSync(path.join(OPS_OUT, id + '.done'))) {
        var meta = {};
        var output = '';
        try { meta = JSON.parse(fs.readFileSync(path.join(OPS_OUT, id + '.meta'), 'utf8')); } catch (e) {}
        try { output = fs.readFileSync(path.join(OPS_OUT, id + '.out'), 'utf8'); } catch (e) {}
        [id + '.meta', id + '.out', id + '.done'].forEach(function (f) { try { fs.unlinkSync(path.join(OPS_OUT, f)); } catch (e) {} });
        return sendOk(res, 200, Object.assign({ id: id, mode: mode }, meta, { output: output }));
      }
      if (Date.now() > deadline) {
        return sendOk(res, 200, { id: id, mode: mode, ok: false, timeout: true, output: '', note: 'still running — poll GET /api/v1/ops/exec/' + id + '/result' });
      }
      setTimeout(poll, 150);
    })();
    return undefined;
  }

  // result pickup for timed-out execs
  var execMatch = route.match(/^\/ops\/exec\/([a-z0-9-]+)\/result$/);
  if (execMatch && method === 'GET') {
    var rid = execMatch[1].replace(/[^a-z0-9-]/g, '');
    var rmeta = {}, rout = '';
    try { rmeta = JSON.parse(fs.readFileSync(path.join(OPS_OUT, rid + '.meta'), 'utf8')); } catch (e) {}
    try { rout = fs.readFileSync(path.join(OPS_OUT, rid + '.out'), 'utf8'); } catch (e) {}
    if (fs.existsSync(path.join(OPS_OUT, rid + '.done'))) {
      [rid + '.meta', rid + '.out', rid + '.done'].forEach(function (f) { try { fs.unlinkSync(path.join(OPS_OUT, f)); } catch (e) {} });
      return sendOk(res, 200, Object.assign({ id: rid }, rmeta, { output: rout }));
    }
    return sendOk(res, 200, { id: rid, done: false });
  }

  if (route === '/ops/list' && method === 'GET') {
    var lp = opsSafe(q.path || '.');
    if (!lp) return sendErr(res, 400, 'bad_path', 'path escapes server root');
    if (!fs.existsSync(lp)) return sendErr(res, 404, 'not_found', 'No such path');
    var entries = fs.readdirSync(lp, { withFileTypes: true }).slice(0, 2000).map(function (d) {
      var fp = path.join(lp, d.name);
      var st = {};
      try { st = fs.statSync(fp); } catch (e) {}
      return { name: d.name, dir: d.isDirectory(), size: st.size || 0, mtime: st.mtime || null };
    });
    return sendOk(res, 200, { path: q.path || '.', entries: entries });
  }

  if (route === '/ops/file' && method === 'GET') {
    var gp = opsSafe(q.path);
    if (!gp) return sendErr(res, 400, 'bad_path', 'path escapes server root');
    var gst;
    try { gst = fs.statSync(gp); } catch (e) { return sendErr(res, 404, 'not_found', 'No such file'); }
    if (gst.isDirectory()) return sendErr(res, 400, 'is_dir', 'Use /ops/list for directories');
    if (gst.size > 4 * 1024 * 1024 && !q.tail) return sendErr(res, 413, 'too_large', 'File > 4MB; use ?tail=N for text files');
    if (q.tail) {
      var want = Math.max(1, Math.min(parseInt(q.tail) || 100, 5000));
      var fd = fs.openSync(gp, 'r');
      var chunkLen = Math.min(gst.size, 512 * 1024);
      var buf = Buffer.alloc(chunkLen);
      fs.readSync(fd, buf, 0, chunkLen, gst.size - chunkLen);
      fs.closeSync(fd);
      var lines = buf.toString('utf8').split('\n').filter(Boolean);
      return sendOk(res, 200, { path: q.path, size: gst.size, lines: lines.slice(-want) });
    }
    return sendOk(res, 200, { path: q.path, size: gst.size, encoding: 'base64', content_b64: fs.readFileSync(gp).toString('base64') });
  }

  if (route === '/ops/file' && method === 'PUT') {
    var pp = opsSafe(q.path);
    if (!pp || pp === OPS_ROOT) return sendErr(res, 400, 'bad_path', 'path escapes server root or is root');
    if ((rawBody || []).length > 8 * 1024 * 1024) return sendErr(res, 413, 'too_large', 'Max 8MB per write');
    fs.mkdirSync(path.dirname(pp), { recursive: true });
    fs.writeFileSync(pp, rawBody || Buffer.alloc(0));
    return sendOk(res, 200, { path: q.path, bytes: (rawBody || []).length });
  }

  if (route === '/ops/file' && method === 'DELETE') {
    var dp = opsSafe(q.path);
    if (!dp || dp === OPS_ROOT) return sendErr(res, 400, 'bad_path', 'path escapes server root or is root');
    if (!fs.existsSync(dp)) return sendErr(res, 404, 'not_found', 'No such path');
    var dst = fs.statSync(dp);
    if (dst.isDirectory()) { fs.rmdirSync(dp); return sendOk(res, 200, { removed: q.path, type: 'dir(empty)' }); }
    fs.unlinkSync(dp);
    return sendOk(res, 200, { removed: q.path, type: 'file' });
  }

  if (route === '/ops/log' && method === 'GET') {
    var logPath = opsSafe('logs/latest.log');
    var want = Math.max(1, Math.min(parseInt(q.tail) || 150, 5000));
    try {
      var lst = fs.statSync(logPath);
      var fd = fs.openSync(logPath, 'r');
      var clen = Math.min(lst.size, 512 * 1024);
      var lbuf = Buffer.alloc(clen);
      fs.readSync(fd, lbuf, 0, clen, lst.size - clen);
      fs.closeSync(fd);
      var llines = lbuf.toString('utf8').split('\n').filter(Boolean);
      return sendOk(res, 200, { path: 'logs/latest.log', size: lst.size, lines: llines.slice(-want) });
    } catch (e) { return sendErr(res, 404, 'not_found', 'logs/latest.log not readable'); }
  }

  return sendErr(res, 404, 'unknown_ops_endpoint', 'Known: ping status exec exec/:id/result list file log');
}


const server = http.createServer(async (req, res) => {

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/\/+/g, '/');
    const ip = req.socket.remoteAddress || '0.0.0.0';
    const method = req.method;

    // CORS preflight
    if (pathname.startsWith('/api/') && method === 'OPTIONS') {
      return send(res, 204, '', {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie, X-File-Name, Authorization',
        'Access-Control-Max-Age': '86400'
      });
    }

    // robots.txt
    if (pathname === '/robots.txt') {
      return send(res, 200, 'User-agent: *\nDisallow: /api/\nAllow: /\nSitemap: ' + SITE_URL + '/sitemap.xml', {'Content-Type': 'text/plain'});
    }

    // Human-friendly API docs + playground
    if (pathname === '/docs' || pathname === '/api/docs') {
      try {
        var docsHtml = fs.readFileSync(path.join(__dirname, 'public', 'api-docs.html'), 'utf8');
        return sendHtml(res, 200, docsHtml);
      } catch(e) { return sendHtml(res, 404, notFoundPage()); }
    }

    // OpenAPI spec
    if (pathname === '/openapi.json') {
      var spec = {
        openapi: '3.1.0',
        info: {
          title: 'Shrinqo API',
          version: API_VERSION,
          description: 'URL shortener, pastebin and file-sharing API. All list endpoints support pagination via limit/offset. Errors use {ok:false,error:{code,message}}.',
          'x-logo': { url: SITE_URL + '/icon.svg' }
        },
        servers: [{ url: SITE_URL }],
        security: [{ bearerAuth: [] }, {}],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', description: 'API key from POST /api/v1/keys (lsk_...)' }
          }
        },
        paths: {
          '/api/v1': { get: { summary: 'Endpoint catalog', responses: { '200': { description: 'OK' } } } },
          '/api/v1/health': { get: { summary: 'Service health', security: [], responses: { '200': { description: 'OK' } } } },
          '/api/v1/auth/register': { post: { summary: 'Create account', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','password'], properties: { name: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { '200': { description: 'Registered, session cookie set' }, '409': { description: 'Username taken' } } } },
          '/api/v1/auth/login': { post: { summary: 'Log in', responses: { '200': { description: 'Session cookie set' }, '401': { description: 'Invalid credentials' } } } },
          '/api/v1/auth/logout': { post: { summary: 'Log out', responses: { '200': { description: 'OK' } } } },
          '/api/v1/auth/logout-all': { post: { summary: 'Revoke all sessions', responses: { '200': { description: 'OK' } } } },
          '/api/v1/auth/me': { get: { summary: 'Account details + totals', responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } } } },
          '/api/v1/auth/password': { post: { summary: 'Change password (revokes other sessions)', responses: { '200': { description: 'OK' } } } },
          '/api/v1/keys': {
            get: { summary: 'List API keys', responses: { '200': { description: 'OK' } } },
            post: { summary: 'Create API key (secret shown once)', responses: { '201': { description: 'Created' } } }
          },
          '/api/v1/keys/{id}': { delete: { summary: 'Revoke key', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Revoked' } } } },
          '/api/v1/shorten': { post: { summary: 'Shorten URL or create paste', description: 'Body: {url} or {text}. Optional: alias (auth required), expires_in seconds, name.', responses: { '201': { description: 'Created' }, '200': { description: 'Deduplicated existing link' } } } },
          '/api/v1/shorten/bulk': { post: { summary: 'Shorten up to 25 links at once', responses: { '200': { description: 'Per-item results' } } } },
          '/api/v1/files': { post: { summary: 'Upload file (raw bytes body)', parameters: [{ name: 'X-File-Name', in: 'header', schema: { type: 'string' } }], responses: { '201': { description: 'Created' } } } },
          '/api/v1/links': { get: { summary: 'My links', parameters: [{ name: 'kind', in: 'query', schema: { type: 'string', enum: ['url','text','file'] } }, { name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'offset', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Paginated list' } } } },
          '/api/v1/links/public': { get: { summary: 'Public feed of recent links', responses: { '200': { description: 'OK' } } } },
          '/api/v1/links/{id}': {
            get: { summary: 'Link detail (extra fields for owner)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
            patch: { summary: 'Update destination/text/name/enabled/expiry (owner only)', responses: { '200': { description: 'Changed fields listed' } } },
            delete: { summary: 'Delete link (owner only)', responses: { '200': { description: 'Deleted' } } }
          },
          '/api/v1/links/{id}/stats': { get: { summary: 'Click analytics: by-day series, referrers, recent hits (owner only)', parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 7 } }], responses: { '200': { description: 'OK' } } } },
          '/api/v1/stats': { get: { summary: 'Global platform stats', security: [], responses: { '200': { description: 'OK' } } } },
          '/api/v1/preview': { get: { summary: 'Fetch OpenGraph metadata for any URL', parameters: [{ name: 'url', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Metadata or found:false' } } } }
        }
      };
      return send(res, 200, JSON.stringify(spec), {'Content-Type': 'application/json; charset=utf-8'});
    }

    // sitemap — only live url-links
    if (pathname === '/sitemap.xml') {
      var nowIso = new Date().toISOString();
      var rows = db.prepare(`SELECT id, created FROM links WHERE kind = 'url' AND enabled = 1 AND (expires_at IS NULL OR expires_at > ?) ORDER BY created DESC LIMIT 25`).all(nowIso);
      var urls = rows.map(function(r) {
        var lm = '';
        try { lm = '<lastmod>' + new Date(r.created).toISOString().slice(0, 10) + '</lastmod>'; } catch(e) {}
        return '  <url><loc>' + SITE_URL + '/' + r.id + '</loc><changefreq>never</changefreq>' + lm + '</url>';
      }).join('\n');
      var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' + SITE_URL + '/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n' + urls + '\n</urlset>';
      return send(res, 200, xml, {'Content-Type': 'application/xml; charset=utf-8'});
    }

    // Short link redirect: /:id or /:alias
    var shortMatch = pathname.match(/^\/([a-zA-Z0-9_-]{1,32})$/);
    if (shortMatch) {
      var id = shortMatch[1];
      if (!rateOk(ip, 'go', 120, 60000)) {
        return send(res, 429, 'Too many requests', {'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow'});
      }
      var link = S.getLink.get(id);
      if (!link) return sendHtml(res, 404, notFoundPage());
      if (!link.enabled) return sendHtml(res, 410, gonePage('This link has been disabled by its owner.'));
      if (link.expires_at && Date.now() > Date.parse(link.expires_at)) {
        return sendHtml(res, 410, gonePage('This link has expired.'));
      }

      if (link.kind === 'text') {
        recordClick(id, req);
        return sendHtml(res, 200, textPage(link));
      }
      if (link.kind === 'file') {
        recordClick(id, req);
        return sendHtml(res, 200, filePage(link));
      }
      if (isCrawler(req.headers['user-agent'] || '')) {
        var meta = await getUrlMeta(id, link.url);
        return sendHtml(res, 200, crawlerPage(link, meta));
      }
      recordClick(id, req);
      return sendHtml(res, 200, stepsPage(link));
    }

    // File download: /:id/dl
    var dlMatch = pathname.match(/^\/([a-zA-Z0-9_-]{1,32})\/dl$/);
    if (dlMatch) {
      var dlId = dlMatch[1];
      var dlLink = S.getLink.get(dlId);
      if (!dlLink || dlLink.kind !== 'file') return sendHtml(res, 404, notFoundPage());
      if (!dlLink.enabled || (dlLink.expires_at && Date.now() > Date.parse(dlLink.expires_at))) {
        return sendHtml(res, 410, gonePage('This file is no longer available.'));
      }
      if (!rateOk(ip, 'dl', 60, 60000)) return send(res, 429, 'Too many requests', {'Content-Type': 'text/plain'});
      recordClick(dlId, req);
      var cd = 'attachment; filename="' + (dlLink.name || 'file').replace(/["\\\r\n]/g, '_') + '"';
      var dlHeaders = {
        'Content-Type': dlLink.type || 'application/octet-stream',
        'Content-Disposition': cd,
        'Content-Length': String(dlLink.size),
        'Cache-Control': 'private, max-age=60',
        'X-Robots-Tag': 'noindex, nofollow'
      };
      if (dlLink.github_owner) {
        res.writeHead(200, { ...SEC, ...dlHeaders });
        return streamGithubFile(dlLink, res);
      }
      return send(res, 500, 'No storage configured', {'Content-Type': 'text/plain'});
    }

    // Static files
    if (pathname === '/' || pathname === '/index.html') {
      try {
        var html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
        return sendHtml(res, 200, html);
      } catch(e) { return sendHtml(res, 200, '<!DOCTYPE html><html><head><title>Shrinqo</title></head><body><h1>Shrinqo</h1><p>Index page not found.</p></body></html>'); }
    }
    if (pathname === '/custom.css') {
      try {
        var css = fs.readFileSync(path.join(__dirname, 'public', 'custom.css'), 'utf8');
        return send(res, 200, css, {'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=86400'});
      } catch(e) { return send(res, 404, '', {'Content-Type': 'text/plain'}); }
    }
    if (pathname === '/safeads.js') {
      try {
        var js = fs.readFileSync(path.join(__dirname, 'public', 'safeads.js'), 'utf8');
        return send(res, 200, js, {'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600'});
      } catch(e) { return send(res, 404, '', {'Content-Type': 'text/plain'}); }
    }

    // Serve other static files from public/
    if (pathname.startsWith('/')) {
      try {
        var pubRoot = path.join(__dirname, 'public');
        var safePath = path.join(pubRoot, pathname);
        var resolved = path.resolve(safePath);
        if ((resolved === pubRoot || resolved.startsWith(pubRoot + path.sep)) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
          var ext = path.extname(resolved).toLowerCase();
          var types = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.pdf':'application/pdf','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.mp3':'audio/mpeg'};
          var ct = types[ext] || 'application/octet-stream';
          var data = fs.readFileSync(resolved);
          return send(res, 200, data, {'Content-Type': ct, 'Cache-Control': 'public, max-age=86400'});
        }
      } catch(e) {}
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      var body = '';
      if (method === 'POST' || method === 'DELETE' || method === 'PATCH' || method === 'PUT') {
        var cl = parseInt(req.headers['content-length'], 10);
        if (Number.isFinite(cl) && cl > MAX_FILE) {
          return sendJson(res, 413, {error: 'Payload too large'});
        }
        body = await new Promise((resolve) => {
          var chunks = [];
          var total = 0;
          var done = false;
          req.on('data', c => {
            total += c.length;
            if (total > MAX_FILE) { if (!done) { done = true; resolve(Buffer.alloc(0)); req.destroy(); return; } }
            if (!done) chunks.push(c);
          });
          req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks)); } });
          req.on('error', () => { if (!done) { done = true; resolve(Buffer.alloc(0)); } });
        });
      }

      var jsonBody = {};
      if (body.length > 0 && (req.headers['content-type'] || '').includes('application/json')) {
        try { jsonBody = JSON.parse(body.toString()); } catch(e) {}
      }

      // ---- v2 API router ----
      if (pathname === '/api/v1' || pathname.startsWith('/api/v1/')) {
        return await handleApiV1(req, res, pathname, method, ip, jsonBody, body);
      }

      // POST /api/shorten
      if (pathname === '/api/shorten' && method === 'POST') {
        var user = getUser(req);
        var target = String(jsonBody.url || '').trim();
        if (!target) return sendJson(res, 400, {error: 'URL required'});
        var norm = normalizeUrl(target);
        if (norm.error) return sendJson(res, 400, {error: norm.error});
        target = norm.url;
        if (!rateOk(ip, 'short', 10, 60000)) return sendJson(res, 429, {error: 'Too many links'});
        var hash = sha1(target);
        var existing = S.getDedup.get('url:' + hash);
        var id, created = false;
        if (existing) {
          id = existing.link_id;
        } else {
          var attempts = 0;
          do {
            id = genId();
            attempts++;
            var ins = S.insLink.run(id, 'url', target, null, null, null, 0, null, 0, 0, user ? user.name : null, new Date().toISOString(), null, null, null, null);
          } while (ins.changes === 0 && attempts < 5);
          if (ins.changes === 0) return sendJson(res, 500, {error: 'Could not create link'});
          S.insDedup.run('url:' + hash, id);
          if (user) S.insUL.run(user.name, id);
          var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
          created = true;
        }
        return sendJson(res, 200, {id: id, owned: !!user});
      }

      // POST /api/text
      if (pathname === '/api/text' && method === 'POST') {
        var user = getUser(req);
        var text = String(jsonBody.text || '');
        if (!text.trim()) return sendJson(res, 400, {error: 'Text required'});
        if (text.length > 100000) return sendJson(res, 400, {error: 'Text too long'});
        if (!rateOk(ip, 'text', 10, 60000)) return sendJson(res, 429, {error: 'Too many links'});
        var hash = sha1(text);
        var existing = S.getDedup.get('text:' + hash);
        var id;
        if (existing) {
          id = existing.link_id;
        } else {
          var attempts = 0;
          do {
            id = genId();
            attempts++;
            var ins = S.insLink.run(id, 'text', null, text, null, null, 0, null, 0, 0, user ? user.name : null, new Date().toISOString(), null, null, null, null);
          } while (ins.changes === 0 && attempts < 5);
          if (ins.changes === 0) return sendJson(res, 500, {error: 'Could not create link'});
          S.insDedup.run('text:' + hash, id);
          if (user) S.insUL.run(user.name, id);
          var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
        }
        return sendJson(res, 200, {id: id, owned: !!user});
      }

      // POST /api/file
      if (pathname === '/api/file' && method === 'POST') {
        var user = getUser(req);
        var fileName = '';
        try { fileName = decodeURIComponent(req.headers['x-file-name'] || ''); } catch(e) {}
        fileName = String(fileName).trim().replace(/[\/\\]/g, '_').slice(0, 120) || 'file';
        var fileType = (req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
        var blocked = /^text\/html|text\/javascript|application\/javascript/i;
        if (blocked.test(fileType)) fileType = 'application/octet-stream';
        if (body.length === 0) return sendJson(res, 400, {error: 'File required'});
        var legacyMax = user ? MAX_FILE : Math.min(MAX_FILE, 25 * 1024 * 1024);
        if (body.length > legacyMax) return sendJson(res, 413, {error: user ? 'File too large' : 'Max 25 MB for guests — sign in for 100 MB'});
        if (!rateOk(ip, 'file', 6, 60000)) return sendJson(res, 429, {error: 'Too many uploads'});
        var hash = sha256(body);
        var existing = S.getDedup.get('fh:' + hash);
        var id;
        if (existing) {
          id = existing.link_id;
        } else {
          var ghToken = process.env.GITHUB_TOKEN || '';
          if (!ghToken) return sendJson(res, 503, {error: 'File storage not configured'});
          id = genId();
          while (S.getLink.get(id)) id = genId();
          var chunks = Math.max(1, Math.ceil(body.length / FILE_CHUNK));
          S.insLink.run(id, 'file', null, null, fileName, fileType, body.length, hash, chunks, 0, user ? user.name : null, new Date().toISOString(), '', '', '', '');
          var adds = [];
          var prefix = 'files/' + id;
          for (var ci = 0; ci < chunks; ci++) {
            var start = ci * FILE_CHUNK;
            var end = Math.min(start + FILE_CHUNK, body.length);
            var part = body.slice(start, end);
            adds.push({ path: prefix + '/part-' + String(ci + 1).padStart(4, '0') + '.b64', content: part.toString('base64') });
          }
          adds.push({ path: prefix + '/manifest.json', content: JSON.stringify({id: id, name: fileName, type: fileType, size: body.length, hash: hash, chunks: chunks}) });
          var commitSha;
          try {
            commitSha = await githubCommit(adds, []);
          } catch (e) {
            S.delLink.run(id);
            return sendJson(res, 502, {error: 'File upload failed'});
          }
          S.updCommit.run(commitSha || '', process.env.GITHUB_OWNER || '', process.env.GITHUB_REPO || '', process.env.GITHUB_BRANCH || 'main', id);
          S.insDedup.run('fh:' + hash, id);
          if (user) S.insUL.run(user.name, id);
          var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
        }
        return sendJson(res, 200, {id: id, owned: !!user});
      }

      // POST /api/register
      if (pathname === '/api/register' && method === 'POST') {
        if (!rateOk(ip, 'auth', 8, 60000)) return sendJson(res, 429, {error: 'Too many attempts'});
        var name = String(jsonBody.name || '').trim();
        var pw = String(jsonBody.password || '');
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) return sendJson(res, 400, {error: 'Username must be 3-20 chars'});
        if (pw.length < 6) return sendJson(res, 400, {error: 'Password must be 6+ chars'});
        var existing = S.getUser.get(name.toLowerCase());
        if (existing) return sendJson(res, 409, {error: 'Username taken'});
        var salt = randomHex(16);
        var iter = 100000;
        var pwhash = (await crypto.pbkdf2Promise(pw, salt, iter, 32, 'sha256')).toString('hex');
        S.insUser.run(name.toLowerCase(), pwhash, salt, iter, new Date().toISOString());
        var token = createSession(name.toLowerCase());
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': sessionCookie(req, token) });
        return res.end(JSON.stringify({ok: true, name: name.toLowerCase()}));
      }

      // POST /api/login
      if (pathname === '/api/login' && method === 'POST') {
        if (!rateOk(ip, 'auth', 8, 60000)) return sendJson(res, 429, {error: 'Too many attempts'});
        var name = String(jsonBody.name || '').trim().toLowerCase();
        var rec = S.getUser.get(name);
        if (!rec) return sendJson(res, 401, {error: 'Invalid credentials'});
        var pwhash = (await crypto.pbkdf2Promise(String(jsonBody.password || ''), rec.salt, rec.iter, 32, 'sha256')).toString('hex');
        if (!constEq(pwhash, rec.pwhash)) return sendJson(res, 401, {error: 'Invalid credentials'});
        var token = createSession(name);
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': sessionCookie(req, token) });
        return res.end(JSON.stringify({ok: true, name: name}));
      }

      // POST /api/logout
      if (pathname === '/api/logout' && method === 'POST') {
        var t = parseCookies(req.headers.cookie || '')['ls_sess'];
        if (t) S.delSess.run(t);
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': sessionCookie(req, null) });
        return res.end(JSON.stringify({ok: true}));
      }

      // GET /api/me
      if (pathname === '/api/me' && method === 'GET') {
        var user = getUser(req);
        if (!user) return sendJson(res, 401, {error: 'Not signed in'});
        return sendJson(res, 200, {ok: true, name: user.name});
      }

      // GET /api/me/links
      if (pathname === '/api/me/links' && method === 'GET') {
        var user = getUser(req);
        if (!user) return sendJson(res, 401, {error: 'Not signed in'});
        var list = S.getUL.all(user.name);
        return sendJson(res, 200, list);
      }

      // DELETE /api/me/links/:id
      var delMatch = pathname.match(/^\/api\/me\/links\/([0-9a-zA-Z]{6})$/);
      if (delMatch && method === 'DELETE') {
        var user = getUser(req);
        if (!user) return sendJson(res, 401, {error: 'Not signed in'});
        var delId = delMatch[1];
        var delLink = S.getLink.get(delId);
        if (!delLink || delLink.owner !== user.name) return sendJson(res, 404, {error: 'Not found'});
        // Remove dedup entries pointing at this link so re-creating works
        if (delLink.kind === 'url' && delLink.url) db.prepare('DELETE FROM dedup WHERE key = ?').run('url:' + sha1(delLink.url));
        if (delLink.kind === 'text' && delLink.text_content) db.prepare('DELETE FROM dedup WHERE key = ?').run('text:' + sha1(delLink.text_content));
        if (delLink.kind === 'file' && delLink.hash) db.prepare('DELETE FROM dedup WHERE key = ?').run('fh:' + delLink.hash);
        S.delUL.run(user.name, delId);
        S.delLink.run(delId);
        var m = getMeta(); m.total = Math.max(0, (m.total || 0) - 1); setMeta(m);
        return sendJson(res, 200, {ok: true});
      }

      // GET /api/links (public feed)
      if (pathname === '/api/links' && method === 'GET') {
        return sendJson(res, 200, S.recent.all().map(l => ({
          id: l.id,
          kind: l.kind,
          clicks: l.clicks,
          created: l.created,
          name: l.name || null,
          url: l.url || null,
          preview: null
        })));
      }

      // GET /api/stats
      if (pathname === '/api/stats' && method === 'GET') {
        var total = S.countLinks.get().c;
        var clicks = 0;
        try { var mm = getMeta(); clicks = mm.clicks || 0; } catch(e) {}
        return sendJson(res, 200, {total: total, clicks: clicks});
      }

      return sendJson(res, 404, {error: 'Not found'});
    }

    // Fallback 404
    return sendHtml(res, 404, notFoundPage());

  } catch(err) {
    console.error('Server error:', err);
    try { send(res, 500, 'Internal error', {'Content-Type': 'text/plain'}); } catch(e) {}
  }
});

server.listen(PORT, () => {
  console.log('Shrinqo running on http://localhost:' + PORT);
});
