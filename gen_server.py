#!/usr/bin/env python3
"""Generate server.js for LinkShort"""
import os

OUT = '/data/data/com.termux/files/home/url-shortener/linkshort-app/server.js'

# We'll build the file by writing multiple sections
sections = []

# Section 1: requires + DB setup
sections.append("""const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

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

const S = {
  getLink: db.prepare('SELECT * FROM links WHERE id = ?'),
  insLink: db.prepare(`INSERT OR IGNORE INTO links
    (id,kind,url,text_content,name,type,size,hash,chunks,clicks,owner,created,
     github_owner,github_repo,github_branch,github_commit)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`),
  incrClicks: db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?'),
  delLink: db.prepare('DELETE FROM links WHERE id = ?'),
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
};
""")

# Section 2: helper functions
sections.append("""
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
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function rateOk(ip, scope, max, windowMs) {
  const key = 'rl:' + ip + ':' + scope;
  S.cleanRL.run(key, Date.now() - windowMs);
  const row = S.countRL.get(key, Date.now() - windowMs);
  if (row.c >= max) return false;
  S.insRL.run(key, Date.now());
  return true;
}

function getUser(req) {
  const t = parseCookies(req.headers.cookie || '')['ls_sess'];
  if (!t) return null;
  const r = S.getSess.get(t, Date.now());
  return r ? { name: r.name } : null;
}

function createSession(name) {
  const token = randomHex(32);
  S.insSess.run(token, name, Date.now() + SESSION_TTL * 1000);
  return token;
}

function getMeta() {
  const r = S.getMeta.get('main');
  if (r) try { return JSON.parse(r.value); } catch(e) {}
  return { total: 0, clicks: 0 };
}
function setMeta(m) { S.setMeta.run('main', JSON.stringify(m)); }

function incrClicks(id) {
  S.incrClicks.run(id);
  const m = getMeta();
  m.clicks = (m.clicks || 0) + 1;
  setMeta(m);
}

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
function sendHtml(res, code, h) { send(res, code, h, {'Content-Type':'text/html; charset=utf-8'}); }
function sendRedirect(res, url) { send(res, 301, '', {'Location': url}); }
""")

# Section 3: GitHub file storage
sections.append("""
async function ghFetch(pathname, options) {
  const opts = options || {};
  const token = process.env.GITHUB_TOKEN || '';
  const res = await fetch('https://api.github.com' + pathname, {
    ...opts,
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LinkShort-file2link',
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
        return e.path === p || e.path.startsWith(p.replace(/\\/$/, '') + '/');
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
""")

# Section 4: HTML pages
sections.append("""
var MTS = '<script>window.__mtg=window.__mtg||false;if(!window.__mtg){window.__mtg=true;[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);})}</script>';
var SAFEAD = '<script src="/safeads.js?v=15"></script>';
var ADS = '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div><div class="ad-count" style="max-width:760px;margin:12px 0 0"></div><div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>';

function notFoundPage() {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LinkShort</title><meta name="robots" content="noindex, nofollow"></head><body style="margin:0;font-family:system-ui,sans-serif;background:#f0faf4;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><div style="font-size:48px">&#128279;</div><h1 style="font-size:24px;margin:12px 0 6px">Link not found</h1><p style="color:#64748b;margin:0 0 18px">The short link you opened does not exist.</p><a href="/" style="color:#2563eb;text-decoration:none;font-weight:600">&larr; Back to LinkShort</a></div></body></html>';
}

function crawlerPage(link) {
  var shortUrl = SITE_URL + '/' + link.id;
  var host = '';
  try { host = new URL(link.url).hostname; } catch(e) {}
  var title = host ? 'LinkShort \\u2014 short link to ' + host : 'LinkShort \\u2014 short link';
  var desc = 'A free short link hosted on LinkShort. Click to reach the destination.';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHtml(title) + '</title><meta name="robots" content="noindex, nofollow"><meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + desc + '"><meta property="og:type" content="website"><meta property="og:site_name" content="LinkShort"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + SITE_URL + '/og-image.png"><meta http-equiv="refresh" content="0; url=' + escapeHtml(link.url) + '"></head><body><p>Redirecting to <a href="' + escapeHtml(link.url) + '">' + escapeHtml(host || link.url) + '</a>...</p></body></html>';
}

function textPage(link) {
  var shortUrl = SITE_URL + '/' + link.id;
  var text = escapeHtml(link.text_content);
  var preview = escapeHtml(String(link.text_content).slice(0, 160));
  var chars = String(link.text_content).length;
  var words = String(link.text_content).trim().split(/\\s+/).filter(Boolean).length;
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LinkShort \\u2014 text /' + escapeHtml(link.id) + '</title><meta name="robots" content="noindex, nofollow"><meta property="og:title" content="Shared text \\u2014 /' + escapeHtml(link.id) + '"><meta property="og:description" content="' + preview + '"><meta property="og:type" content="website"><meta property="og:site_name" content="LinkShort"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + SITE_URL + '/og-image.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"><link rel="stylesheet" href="/custom.css?v=5"><style>body{margin:0}header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}header button:active{transform:scale(.97)}main{max-width:760px;margin:0 auto;padding:20px 16px 40px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.meta span{font-size:11px;font-weight:700;color:var(--accent-strong);background:var(--accent-soft);border:1px solid #bfdbfe;border-radius:999px;padding:4px 10px}pre{white-space:pre-wrap;word-wrap:break-word;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin:0;font-size:14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:var(--card-shadow)}.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}.foot a{color:var(--accent);text-decoration:none;font-weight:600}</style></head><body><header><div class="wrap"><a class="brand" href="' + SITE_URL + '/"><span>&#128279;</span>Link<span style="color:var(--accent)">Short</span></a><button onclick="copyText()">Copy text</button></div></header><main><div class="meta"><span>' + chars + ' chars</span><span>' + words + ' words</span><span>shared via LinkShort</span></div><pre id="tx">' + text + '</pre></main>' + ADS + '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a></div>' + SAFEAD + MTS + '<script>function copyText(){var t=document.getElementById("tx").textContent;navigator.clipboard.writeText(t).then(function(){var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy text"},1600)})}</script></body></html>';
}
""")

# Section 5: File page with 3-step timer
sections.append("""
function filePage(link) {
  var shortUrl = SITE_URL + '/' + link.id;
  var dlUrl = SITE_URL + '/' + link.id + '/dl';
  var name = escapeHtml(link.name || 'file');
  var type = escapeHtml(link.type || 'file');
  var size = fmtSize(link.size || 0);
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LinkShort \\u2014 ' + name + '</title><meta name="robots" content="noindex, nofollow"><meta property="og:title" content="Shared file \\u2014 ' + name + '"><meta property="og:description" content="' + size + ' file shared via LinkShort"><meta property="og:type" content="website"><meta property="og:site_name" content="LinkShort"><meta property="og:url" content="' + shortUrl + '"><meta property="og:image" content="' + SITE_URL + '/og-image.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"><link rel="stylesheet" href="/custom.css?v=5"><style>body{margin:0}header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}header button:active{transform:scale(.97)}main{max-width:760px;margin:0 auto;padding:20px 16px 40px}.fcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:30px 22px;text-align:center;box-shadow:var(--card-shadow)}.fico{width:72px;height:72px;margin:0 auto;border-radius:20px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:34px}.fcard h1{font-size:20px;font-weight:800;color:var(--ink-900);margin:16px 0 4px;word-break:break-all}.fmeta{color:#94a3b8;font-size:12px;font-weight:600}.factions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:22px}.fbtn{display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff;text-decoration:none;font-weight:800;font-size:14px;border-radius:999px;padding:12px 22px;box-shadow:0 10px 24px -12px rgba(37,99,235,.6)}.fbtn.ghost{background:#fff;color:var(--accent-strong);border:1px solid rgba(37,99,235,.35);box-shadow:none}.furl{margin-top:18px;font-size:12px;color:var(--ink-400);word-break:break-all}.furl b{color:var(--ink-600);font-weight:700}.step-card{margin-top:16px}.step-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(37,99,235,.1);color:#1d4ed8;border:1px solid rgba(37,99,235,.25);padding:5px 13px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.timer-ring{width:88px;height:88px;border-radius:50%;margin:14px auto 8px;position:relative;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--ring,#2563eb) calc(var(--p,100)*1%),#e2e8f0 0);transition:filter .2s ease}.timer-ring::before{content:"";position:absolute;inset:7px;border-radius:50%;background:#fff;box-shadow:inset 0 2px 8px rgba(0,0,0,.08)}.timer-ring.warn{--ring:#f59e0b;animation:pulseRing .6s ease infinite alternate}.timer-ring.done{background:conic-gradient(#059669 0,#059669 100%)}.timer-num{position:relative;z-index:1;font-size:1.9em;font-weight:800;color:var(--ink-900);font-variant-numeric:tabular-nums}.timer-msg{color:#94a3b8;font-size:12.5px;margin:6px 0 14px}.timer-msg strong{color:#1d4ed8}@keyframes pulseRing{from{filter:brightness(1)}to{filter:brightness(1.35)}}.cta-btn{display:block;width:100%;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .2s ease,filter .2s ease;position:relative;font-family:inherit}.cta-btn:active{transform:scale(.97)}.cta-btn.disabled{background:#f1f5f9;color:#94a3b8;pointer-events:none;box-shadow:none}.cta-btn.ready{background:var(--grad);color:#fff;box-shadow:0 8px 22px -12px rgba(37,99,235,.55)}.cta-btn.ready:active{filter:brightness(1.08)}.progress{display:flex;justify-content:center;gap:7px;margin-top:14px}.progress .dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s ease,transform .2s ease}.progress .dot.on{background:#2563eb;box-shadow:0 0 8px rgba(37,99,235,.5)}.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}.foot a{color:var(--accent);text-decoration:none;font-weight:600}</style></head><body><header><div class="wrap"><a class="brand" href="' + SITE_URL + '/"><span>&#128279;</span>Link<span style="color:var(--accent)">Short</span></a><button onclick="copyDl()">Copy link</button></div></header><div class="ad-banner" style="max-width:760px;margin:14px auto 0;padding:0 16px"></div><main><div class="fcard"><div class="fico">&#128193;</div><h1>' + name + '</h1><div class="fmeta">' + type + ' \\u00b7 ' + size + ' \\u00b7 shared via LinkShort</div><div class="step-card" id="step-box"><div class="step-chip" id="step-chip">Step 1 of 3</div><div class="timer-ring active" id="timer-ring"><span class="timer-num" id="timer-num">15</span></div><p class="timer-msg" id="timer-msg">Please wait <strong>15</strong> seconds</p><button class="cta-btn disabled" id="cta-btn" disabled>Wait...</button><div class="progress"><div class="dot on"></div><div class="dot"></div><div class="dot"></div></div></div><div id="dl-box" style="display:none"><div class="factions"><a class="fbtn" href="' + dlUrl + '" download="' + name + '" rel="noopener">&#11015; Download</a><a class="fbtn ghost" href="' + shortUrl + '">&#128279; Open link</a></div><div class="furl"><b>Link:</b> ' + shortUrl + '</div></div></div><div class="ad-count" style="max-width:760px;margin:16px 0 0"></div></main>' + ADS + '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a></div>' + SAFEAD + MTS + '<script>function copyDl(){var tb=document.getElementById("tb");tb.value="' + dlUrl + '";tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy link"},1600)}var Step={cur:1,secs:15,run:function(){var chip=document.getElementById("step-chip"),ring=document.getElementById("timer-ring"),num=document.getElementById("timer-num"),msg=document.getElementById("timer-msg"),btn=document.getElementById("cta-btn"),dots=document.querySelectorAll("#step-box .progress .dot");if(!num)return;var labels=["Step 1 of 3","Step 2 of 3","Final Step"];chip.textContent=labels[Step.cur-1];dots.forEach(function(d,i){d.classList.toggle("on",i<Step.cur)});var sec=Step.secs;num.textContent=sec;ring.classList.remove("done","warn");ring.classList.add("active");ring.style.setProperty("--p",100);btn.disabled=true;btn.classList.remove("ready");btn.classList.add("disabled");msg.innerHTML=Step.cur===1?"Please wait <strong>"+Step.secs+"</strong> seconds":(Step.cur===2?"Preparing your download...":"Your download unlocks in <strong>"+Step.secs+"</strong> seconds");btn.textContent=Step.cur===2?"Preparing...":(Step.cur===3?"Almost there...":"Wait...");var iv=setInterval(function(){sec--;num.textContent=sec>0?sec:"0";ring.style.setProperty("--p",Math.max(0,(sec/Step.secs)*100));if(sec<=5)ring.classList.add("warn");if(sec<=0){clearInterval(iv);ring.classList.remove("active","warn");ring.classList.add("done");num.textContent="\\u2713";msg.innerHTML="<strong style=\\"color:#059669\\">Ready!</strong>";btn.textContent=Step.cur===3?"Get Your Download":"Click Here to Continue";btn.disabled=false;btn.classList.remove("disabled");btn.classList.add("ready");btn.onclick=function(){if(Step.cur<3){Step.cur++;Step.run();}else Step.reveal();}}},1000);},reveal:function(){var sb=document.getElementById("step-box"),db=document.getElementById("dl-box");if(sb)sb.style.display="none";if(db){db.style.display="block";try{db.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}}}};Step.run();</script><textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea></body></html>';
}
""")

# Section 6: Main HTTP server
sections.append("""
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/\\/+/g, '/');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
    const method = req.method;

    // CORS preflight
    if (pathname.startsWith('/api/') && method === 'OPTIONS') {
      return send(res, 204, '', {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie, X-File-Name',
        'Access-Control-Max-Age': '86400'
      });
    }

    // robots.txt
    if (pathname === '/robots.txt') {
      return send(res, 200, 'User-agent: *\\nAllow: /\\nSitemap: ' + SITE_URL + '/sitemap.xml', {'Content-Type': 'text/plain'});
    }

    // sitemap
    if (pathname === '/sitemap.xml') {
      var rows = S.recent.all();
      var urls = rows.map(function(r) {
        return '  <url><loc>' + SITE_URL + '/' + r.id + '</loc><changefreq>never</changefreq></url>';
      }).join('\\n');
      var xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' + urls + '\\n</urlset>';
      return send(res, 200, xml, {'Content-Type': 'application/xml; charset=utf-8'});
    }

    // Short link redirect: /:id (6 chars)
    var shortMatch = pathname.match(/^\\/([0-9a-zA-Z]{6})$/);
    if (shortMatch) {
      var id = shortMatch[1];
      if (!rateOk(ip, 'go', 120, 60000)) {
        return send(res, 429, 'Too many requests', {'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow'});
      }
      var link = S.getLink.get(id);
      if (!link) return sendHtml(res, 404, notFoundPage());

      if (link.kind === 'text') {
        incrClicks(id);
        return sendHtml(res, 200, textPage(link));
      }
      if (link.kind === 'file') {
        incrClicks(id);
        return sendHtml(res, 200, filePage(link));
      }
      if (isCrawler(req.headers['user-agent'] || '')) {
        return sendHtml(res, 200, crawlerPage(link));
      }
      incrClicks(id);
      return sendRedirect(res, link.url);
    }

    // File download: /:id/dl
    var dlMatch = pathname.match(/^\\/([0-9a-zA-Z]{6})\\/dl$/);
    if (dlMatch) {
      var dlId = dlMatch[1];
      var dlLink = S.getLink.get(dlId);
      if (!dlLink || dlLink.kind !== 'file') return sendHtml(res, 404, notFoundPage());
      if (!rateOk(ip, 'dl', 60, 60000)) return send(res, 429, 'Too many requests', {'Content-Type': 'text/plain'});
      incrClicks(dlId);
      var cd = 'attachment; filename="' + (dlLink.name || 'file').replace(/["\\\\\\r\\n]/g, '_') + '"';
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
      } catch(e) { return sendHtml(res, 200, '<!DOCTYPE html><html><head><title>LinkShort</title></head><body><h1>LinkShort</h1><p>Index page not found.</p></body></html>'); }
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
        var safePath = path.join(__dirname, 'public', pathname);
        var resolved = path.resolve(safePath);
        if (resolved.startsWith(path.join(__dirname, 'public')) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
          var ext = path.extname(resolved).toLowerCase();
          var types = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
          var ct = types[ext] || 'application/octet-stream';
          var data = fs.readFileSync(resolved);
          return send(res, 200, data, {'Content-Type': ct, 'Cache-Control': 'public, max-age=86400'});
        }
      } catch(e) {}
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      var body = '';
      if (method === 'POST' || method === 'DELETE') {
        body = await new Promise((resolve) => {
          var chunks = [];
          req.on('data', c => chunks.push(c));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', () => resolve(Buffer.alloc(0)));
        });
      }

      var jsonBody = {};
      if (body.length > 0 && (req.headers['content-type'] || '').includes('application/json')) {
        try { jsonBody = JSON.parse(body.toString()); } catch(e) {}
      }

      // POST /api/shorten
      if (pathname === '/api/shorten' && method === 'POST') {
        var user = getUser(req);
        var target = String(jsonBody.url || '').trim();
        if (!target) return sendJson(res, 400, {error: 'URL required'});
        if (!/^https?:\\/\\//i.test(target)) target = 'https://' + target;
        try { new URL(target); } catch(e) { return sendJson(res, 400, {error: 'Invalid URL'}); }
        if (!rateOk(ip, 'short', 10, 60000)) return sendJson(res, 429, {error: 'Too many links'});
        var hash = sha1(target);
        var existing = S.getDedup.get('url:' + hash);
        var id, created = false;
        if (existing) {
          id = existing.link_id;
        } else {
          id = genId();
          S.insLink.run(id, 'url', target, null, null, null, 0, null, 0, 0, user ? user.name : null, new Date().toISOString(), null, null, null, null);
          S.insDedup.run('url:' + hash, id);
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
          id = genId();
          S.insLink.run(id, 'text', null, text, null, null, 0, null, 0, 0, user ? user.name : null, new Date().toISOString(), null, null, null, null);
          S.insDedup.run('text:' + hash, id);
          var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
        }
        return sendJson(res, 200, {id: id, owned: !!user});
      }

      // POST /api/file
      if (pathname === '/api/file' && method === 'POST') {
        var user = getUser(req);
        var fileName = '';
        try { fileName = decodeURIComponent(req.headers['x-file-name'] || ''); } catch(e) {}
        fileName = String(fileName).trim().replace(/[\\/\\\\]/g, '_').slice(0, 120) || 'file';
        var fileType = (req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
        var blocked = /^text\\/html|text\\/javascript|application\\/javascript/i;
        if (blocked.test(fileType)) fileType = 'application/octet-stream';
        if (body.length === 0) return sendJson(res, 400, {error: 'File required'});
        if (body.length > MAX_FILE) return sendJson(res, 400, {error: 'File too large'});
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
          var chunks = Math.max(1, Math.ceil(body.length / FILE_CHUNK));
          var adds = [];
          var prefix = 'files/' + id;
          for (var ci = 0; ci < chunks; ci++) {
            var start = ci * FILE_CHUNK;
            var end = Math.min(start + FILE_CHUNK, body.length);
            var part = body.slice(start, end);
            adds.push({ path: prefix + '/part-' + String(ci + 1).padStart(4, '0') + '.b64', content: part.toString('base64') });
          }
          adds.push({ path: prefix + '/manifest.json', content: JSON.stringify({id: id, name: fileName, type: fileType, size: body.length, hash: hash, chunks: chunks}) });
          var commitSha = await githubCommit(adds, []);
          S.insLink.run(id, 'file', null, null, fileName, fileType, body.length, hash, chunks, 0, user ? user.name : null, new Date().toISOString(), process.env.GITHUB_OWNER || '', process.env.GITHUB_REPO || '', process.env.GITHUB_BRANCH || 'main', commitSha);
          S.insDedup.run('fh:' + hash, id);
          var m = getMeta(); m.total = (m.total || 0) + 1; setMeta(m);
        }
        return sendJson(res, 200, {id: id, owned: !!user});
      }

      // POST /api/register
      if (pathname === '/api/register' && method === 'POST') {
        if (!rateOk(ip, 'auth', 8, 60000)) return sendJson(res, 429, {error: 'Too many attempts'});
        var name = String(jsonBody.name || '').trim();
        var pw = String(jsonBody.password || '');
        if (!/^[a-zA-Z0-9_.\\-]{3,20}$/.test(name)) return sendJson(res, 400, {error: 'Username must be 3-20 chars'});
        if (pw.length < 6) return sendJson(res, 400, {error: 'Password must be 6+ chars'});
        var existing = S.getUser.get(name.toLowerCase());
        if (existing) return sendJson(res, 409, {error: 'Username taken'});
        var salt = randomHex(16);
        var iter = 100000;
        var pwhash = crypto.pbkdf2Sync(pw, salt, iter, 32, 'sha256').toString('hex');
        S.insUser.run(name.toLowerCase(), pwhash, salt, iter, new Date().toISOString());
        var token = createSession(name.toLowerCase());
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': 'ls_sess=' + token + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; SameSite=Lax' });
        return res.end(JSON.stringify({ok: true, name: name.toLowerCase()}));
      }

      // POST /api/login
      if (pathname === '/api/login' && method === 'POST') {
        if (!rateOk(ip, 'auth', 8, 60000)) return sendJson(res, 429, {error: 'Too many attempts'});
        var name = String(jsonBody.name || '').trim().toLowerCase();
        var rec = S.getUser.get(name);
        if (!rec) return sendJson(res, 401, {error: 'Invalid credentials'});
        var pwhash = crypto.pbkdf2Sync(String(jsonBody.password || ''), rec.salt, rec.iter, 32, 'sha256').toString('hex');
        if (!constEq(pwhash, rec.pwhash)) return sendJson(res, 401, {error: 'Invalid credentials'});
        var token = createSession(name);
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': 'ls_sess=' + token + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; SameSite=Lax' });
        return res.end(JSON.stringify({ok: true, name: name}));
      }

      // POST /api/logout
      if (pathname === '/api/logout' && method === 'POST') {
        var t = parseCookies(req.headers.cookie || '')['ls_sess'];
        if (t) S.delSess.run(t);
        res.writeHead(200, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': 'ls_sess=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax' });
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
      var delMatch = pathname.match(/^\\/api\\/me\\/links\\/([0-9a-zA-Z]{6})$/);
      if (delMatch && method === 'DELETE') {
        var user = getUser(req);
        if (!user) return sendJson(res, 401, {error: 'Not signed in'});
        var delId = delMatch[1];
        var delLink = S.getLink.get(delId);
        if (!delLink || delLink.owner !== user.name) return sendJson(res, 404, {error: 'Not found'});
        S.delLink.run(delId);
        S.delUL.run(user.name, delId);
        var m = getMeta(); m.total = Math.max(0, (m.total || 0) - 1); setMeta(m);
        return sendJson(res, 200, {ok: true});
      }

      // GET /api/links
      if (pathname === '/api/links' && method === 'GET') {
        return sendJson(res, 200, S.recent.all());
      }

      // GET /api/stats
      if (pathname === '/api/stats' && method === 'GET') {
        var total = S.recent.all().length;
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
  console.log('LinkShort running on http://localhost:' + PORT);
});
""")

# Write all sections
with open(OUT, 'w') as f:
    for s in sections:
        f.write(s)

print(f'Written {os.path.getsize(OUT)} bytes to {OUT}')
