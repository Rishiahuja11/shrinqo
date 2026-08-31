import { ASSETS } from './assets.js';

const SITE_URL = 'https://short.smp45.qzz.io';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_FILE = 104857600;
const FILE_CHUNK = 8388608;

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net quge5.com nap5k.com al5sm.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; base-uri 'self'; form-action 'self'"
};

function json(code, obj, extra) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Cookie' }, SECURITY, extra || {})
  });
}

function html(code, body, extra) {
  return new Response(body, {
    status: code,
    headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY, extra || {})
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isCrawler(ua) {
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Googlebot|Google-InspectionTool|Bingbot|YandexBot|Pinterest|redditbot|vkShare|Viber|SkypeUriPreview|WeChat|MicroMessenger|Snapchat|Applebot|facebookcatalog|curl|wget|python-requests/i.test(ua);
}

function notFound() {
  return html(404,
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LinkShort — Link not found</title><meta name="robots" content="noindex, nofollow"></head><body style="margin:0;font-family:system-ui,sans-serif;background:#0b0f0e;color:#e8f2ef;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><div style="font-size:48px">🔗</div><h1 style="font-size:24px;margin:12px 0 6px">Link not found</h1><p style="color:#7f9a93;margin:0 0 18px">The short link you opened does not exist.</p><a href="/" style="color:#2dd4bf;text-decoration:none;font-weight:600">← Back to LinkShort</a></div></body></html>',
    { 'X-Robots-Tag': 'noindex, nofollow' });
}

function crawlerPage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  let host = '';
  try { host = new URL(link.url).hostname; } catch (e) {}
  const title = host ? 'LinkShort — short link to ' + host : 'LinkShort — short link';
  const desc = 'A free short link hosted on LinkShort. Click to reach the destination.';
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + escapeHtml(title) + '</title>\n' +
    '<meta name="robots" content="noindex, nofollow">\n' +
    '<meta property="og:title" content="' + escapeHtml(title) + '">\n' +
    '<meta property="og:description" content="' + desc + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="LinkShort">\n' +
    '<meta property="og:url" content="' + shortUrl + '">\n' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">\n' +
    '<meta http-equiv="refresh" content="0; url=' + escapeHtml(link.url) + '">\n' +
    '</head>\n' +
    '<body>\n' +
    '<p>Redirecting to <a href="' + escapeHtml(link.url) + '">' + escapeHtml(host || link.url) + '</a>…</p>\n' +
    '</body>\n' +
    '</html>';
}

function textPage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  const text = escapeHtml(link.text);
  const preview = escapeHtml(String(link.text).slice(0, 160));
  const chars = String(link.text).length;
  const words = String(link.text).trim().split(/\s+/).filter(Boolean).length;
  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>LinkShort — text /' + escapeHtml(link.id) + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta property="og:title" content="Shared text — /' + escapeHtml(link.id) + '">' +
    '<meta property="og:description" content="' + preview + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="LinkShort">' +
    '<meta property="og:url" content="' + shortUrl + '">' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">' +
    '<link rel="stylesheet" href="/custom.css?v=5">' +
    '<style>' +
    'body{margin:0}' +
    'header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}' +
    '.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}' +
    '.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}' +
    'header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}' +
    'header button:active{transform:scale(.97)}' +
    'main{max-width:760px;margin:0 auto;padding:20px 16px 40px}' +
    '.meta{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}' +
    '.meta span{font-size:11px;font-weight:700;color:var(--accent-strong);background:var(--accent-soft);border:1px solid #99f6e4;border-radius:999px;padding:4px 10px}' +
    'pre{white-space:pre-wrap;word-wrap:break-word;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin:0;font-size:14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:var(--card-shadow)}' +
    '.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}' +
    '.foot a{color:var(--accent);text-decoration:none;font-weight:600}' +
    '.how{margin-top:28px;text-align:center}' +
    '.how h2{margin:4px 0 16px;font-size:22px;font-weight:800;color:var(--ink-900)}' +
    '.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}' +
    '.how-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 14px;box-shadow:var(--card-shadow)}' +
    '.how-card .how-ico{width:40px;height:40px;margin:0 auto;border-radius:999px;background:linear-gradient(135deg,#ccfbf1,#99f6e4);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.how-card h3{margin:10px 0 4px;font-size:13px;font-weight:800;color:var(--ink-900)}' +
    '.how-card p{margin:0;font-size:12px;color:var(--ink-400)}' +
    '</style></head><body class="text-view">' +
    '<header><div class="wrap">' +
    '<a class="brand" href="' + SITE_URL + '/"><span>🔗</span>Link<span style="color:var(--accent)">Short</span></a>' +
    '<button onclick="copyText()">Copy text</button>' +
    '</div></header>' +
    '<div class="ad-banner" style="max-width:760px;margin:14px auto 0;padding:0 16px"></div>' +
    '<main>' +
    '<div class="meta"><span>' + chars + ' chars</span><span>' + words + ' words</span><span>shared via LinkShort</span></div>' +
    '<pre id="tx">' + text + '</pre>' +
    '</main>' +
    '<section class="how" style="max-width:760px">' +
    '<span class="kicker">Simple</span>' +
    '<h2>How it works</h2>' +
    '<div class="how-grid">' +
    '<div class="how-card"><div class="how-ico">1️⃣</div><h3>Open the link</h3><p>Anyone with the link lands on your text.</p></div>' +
    '<div class="how-card"><div class="how-ico">2️⃣</div><h3>Read &amp; copy</h3><p>One tap copies the text to the clipboard.</p></div>' +
    '<div class="how-card"><div class="how-ico">3️⃣</div><h3>Share it on</h3><p>Forward the short link anywhere you like.</p></div>' +
    '</div>' +
    '</section>' +
    '<div class="direct-ad" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-count" style="max-width:760px;margin:12px 0 0"></div>' +
    '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a> · <a href="' + SITE_URL + '/">shorten a link</a> · <a href="' + SITE_URL + '/">text to link</a></div>' +
    '<div id="sticky-bar" class="sticky-bar"></div>' +
    '<div id="ad-modal" class="ad-modal"></div>' +
    '<script src="/safeads.js?v=15"></script>' +
    '<script>' +
    'window.__mtg=window.__mtg||false;' +
    'if(!window.__mtg){window.__mtg=true;' +
    '[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);});}' +
    'function copyText(){var tb=document.getElementById("tb");tb.value=document.getElementById("tx").textContent;tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy text"},1600)}' +
    '</script>' +
    '<textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea>' +
    '</body></html>';
}

function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

function filePage(link) {
  const shortUrl = SITE_URL + '/' + link.id;
  const dlUrl = SITE_URL + '/' + link.id + '/dl';
  const name = escapeHtml(link.name || 'file');
  const type = escapeHtml(link.type || 'file');
  const size = fmtSize(link.size || 0);
  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>LinkShort — ' + name + '</title>' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta property="og:title" content="Shared file — ' + name + '">' +
    '<meta property="og:description" content="' + size + ' file shared via LinkShort">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="LinkShort">' +
    '<meta property="og:url" content="' + shortUrl + '">' +
    '<meta property="og:image" content="' + SITE_URL + '/og-image.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">' +
    '<link rel="stylesheet" href="/custom.css?v=5">' +
    '<style>' +
    'body{margin:0}' +
    'header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);border-bottom:1px solid var(--line);padding:12px 16px}' +
    '.wrap{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.brand{display:flex;align-items:center;gap:8px;font-weight:800;text-decoration:none;color:var(--ink-900)}' +
    '.brand span{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:9px;background:var(--grad);color:#fff}' +
    'header button{background:var(--grad);color:#fff;border:none;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer}' +
    'header button:active{transform:scale(.97)}' +
    'main{max-width:760px;margin:0 auto;padding:20px 16px 40px}' +
    '.fcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:30px 22px;text-align:center;box-shadow:var(--card-shadow)}' +
    '.fico{width:72px;height:72px;margin:0 auto;border-radius:20px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:34px}' +
    '.fcard h1{font-size:20px;font-weight:800;color:var(--ink-900);margin:16px 0 4px;word-break:break-all}' +
    '.fmeta{color:#94a3b8;font-size:12px;font-weight:600}' +
    '.factions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:22px}' +
    '.fbtn{display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff;text-decoration:none;font-weight:800;font-size:14px;border-radius:999px;padding:12px 22px;box-shadow:0 10px 24px -12px rgba(5,150,105,.6)}' +
    '.fbtn.ghost{background:#fff;color:var(--accent-strong);border:1px solid rgba(13,148,136,.35);box-shadow:none}' +
    '.furl{margin-top:18px;font-size:12px;color:var(--ink-400);word-break:break-all}' +
    '.furl b{color:var(--ink-600);font-weight:700}' +
    '.step-card{margin-top:16px}' +
    '.step-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(45,212,191,.12);color:#0f766e;border:1px solid rgba(13,148,136,.25);padding:5px 13px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}' +
    '.timer-ring{width:88px;height:88px;border-radius:50%;margin:14px auto 8px;position:relative;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--ring,#10b981) calc(var(--p,100)*1%),#e2e8f0 0);transition:filter .2s ease}' +
    '.timer-ring::before{content:"";position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle,#0f1a17 0%,#0c1210 100%);box-shadow:inset 0 2px 8px rgba(0,0,0,.6)}' +
    '.timer-ring.warn{--ring:#f59e0b;animation:pulseRing .6s ease infinite alternate}' +
    '.timer-ring.done{background:conic-gradient(#10b981 0,#10b981 100%)}' +
    '.timer-num{position:relative;z-index:1;font-size:1.9em;font-weight:800;color:#e8f2ef;font-variant-numeric:tabular-nums}' +
    '.timer-msg{color:#94a3b8;font-size:12.5px;margin:6px 0 14px}' +
    '.timer-msg strong{color:#0f766e}' +
    '@keyframes pulseRing{from{filter:brightness(1)}to{filter:brightness(1.35)}}' +
    '.cta-btn{display:block;width:100%;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .2s ease,filter .2s ease;position:relative;font-family:inherit}' +
    '.cta-btn:active{transform:scale(.97)}' +
    '.cta-btn.disabled{background:#f1f5f9;color:#94a3b8;pointer-events:none;box-shadow:none}' +
    '.cta-btn.ready{background:var(--grad);color:#fff;box-shadow:0 8px 22px -12px rgba(5,150,105,.55)}' +
    '.cta-btn.ready:active{filter:brightness(1.08)}' +
    '.progress{display:flex;justify-content:center;gap:7px;margin-top:14px}' +
    '.progress .dot{width:8px;height:8px;border-radius:50%;background:#e2e8f0;transition:background .2s ease,transform .2s ease}' +
    '.progress .dot.on{background:#10b981;box-shadow:0 0 8px rgba(16,185,129,.5)}' +
    '.foot{max-width:760px;margin:0 auto;padding:0 16px 90px;color:#94a3b8;font-size:12px;text-align:center}' +
    '.foot a{color:var(--accent);text-decoration:none;font-weight:600}' +
    '.how{margin-top:28px;text-align:center}' +
    '.how h2{margin:4px 0 16px;font-size:22px;font-weight:800;color:var(--ink-900)}' +
    '.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}' +
    '.how-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 14px;box-shadow:var(--card-shadow)}' +
    '.how-card .how-ico{width:40px;height:40px;margin:0 auto;border-radius:999px;background:linear-gradient(135deg,#ccfbf1,#99f6e4);display:flex;align-items:center;justify-content:center;font-size:18px}' +
    '.how-card h3{margin:10px 0 4px;font-size:13px;font-weight:800;color:var(--ink-900)}' +
    '.how-card p{margin:0;font-size:12px;color:var(--ink-400)}' +
    '</style></head><body class="text-view">' +
    '<header><div class="wrap">' +
    '<a class="brand" href="' + SITE_URL + '/"><span>🔗</span>Link<span style="color:var(--accent)">Short</span></a>' +
    '<button onclick="copyDl()">Copy link</button>' +
    '</div></header>' +
    '<div class="ad-banner" style="max-width:760px;margin:14px auto 0;padding:0 16px"></div>' +
    '<main>' +
    '<div class="fcard">' +
    '<div class="fico">📁</div>' +
    '<h1>' + name + '</h1>' +
    '<div class="fmeta">' + type + ' · ' + size + ' · shared via LinkShort</div>' +
    '<div class="step-card" id="step-box">' +
    '<div class="step-chip" id="step-chip">Step 1 of 3</div>' +
    '<div class="timer-ring active" id="timer-ring"><span class="timer-num" id="timer-num">15</span></div>' +
    '<p class="timer-msg" id="timer-msg">Please wait <strong>15</strong> seconds</p>' +
    '<button class="cta-btn disabled" id="cta-btn" disabled>Wait...</button>' +
    '<div class="progress"><div class="dot on"></div><div class="dot"></div><div class="dot"></div></div>' +
    '</div>' +
    '<div id="dl-box" style="display:none">' +
    '<div class="factions">' +
    '<a class="fbtn" href="' + dlUrl + '" download="' + name + '" rel="noopener">⬇ Download</a>' +
    '<a class="fbtn ghost" href="' + shortUrl + '">🔗 Open link</a>' +
    '</div>' +
    '<div class="furl"><b>Link:</b> ' + shortUrl + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="ad-count" style="max-width:760px;margin:16px 0 0"></div>' +
    '<section class="how" style="max-width:760px">' +
    '<span class="kicker">Simple</span>' +
    '<h2>How it works</h2>' +
    '<div class="how-grid">' +
    '<div class="how-card"><div class="how-ico">1️⃣</div><h3>Open the link</h3><p>Anyone with the link lands on this page.</p></div>' +
    '<div class="how-card"><div class="how-ico">2️⃣</div><h3>Download the file</h3><p>One tap downloads it straight to their device.</p></div>' +
    '<div class="how-card"><div class="how-ico">3️⃣</div><h3>Share it on</h3><p>Forward the short link anywhere you like.</p></div>' +
    '</div>' +
    '</section>' +
    '</main>' +
    '<div class="direct-ad" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-duo" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="ad-banner" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="safead" style="max-width:760px;margin:12px auto 0;padding:0 16px"></div>' +
    '<div class="foot">Shared with <a href="' + SITE_URL + '/">LinkShort</a> · <a href="' + SITE_URL + '/">file to link</a></div>' +
    '<div id="sticky-bar" class="sticky-bar"></div>' +
    '<div id="ad-modal" class="ad-modal"></div>' +
    '<script src="/safeads.js?v=15"></script>' +
    '<script>' +
    'window.__mtg=window.__mtg||false;' +
    'if(!window.__mtg){window.__mtg=true;' +
    '[["265635","https://quge5.com/88/tag.min.js"],["11468479","https://nap5k.com/tag.min.js"],["11468375","https://al5sm.com/tag.min.js"]].forEach(function(z){var s=document.createElement("script");s.async=true;s.dataset.zone=z[0];s.src=z[1];s.setAttribute("data-cfasync","false");document.head.appendChild(s);});}' +
    'function copyDl(){var tb=document.getElementById("tb");tb.value="' + dlUrl + '";tb.select();try{document.execCommand("copy")}catch(e){}var b=document.querySelector("header button");b.textContent="Copied!";setTimeout(function(){b.textContent="Copy link"},1600)}' +
    'var Step={cur:1,secs:15,run:function(){' +
    'var chip=document.getElementById("step-chip"),ring=document.getElementById("timer-ring"),num=document.getElementById("timer-num"),msg=document.getElementById("timer-msg"),btn=document.getElementById("cta-btn"),dots=document.querySelectorAll("#step-box .progress .dot");' +
    'if(!num)return;' +
    'var labels=["Step 1 of 3","Step 2 of 3","Final Step"];' +
    'chip.textContent=labels[Step.cur-1];' +
    'dots.forEach(function(d,i){d.classList.toggle("on",i<Step.cur)});' +
    'var sec=Step.secs;num.textContent=sec;' +
    'ring.classList.remove("done","warn");ring.classList.add("active");ring.style.setProperty("--p",100);' +
    'btn.disabled=true;btn.classList.remove("ready");btn.classList.add("disabled");' +
    'msg.innerHTML=Step.cur===1?"Please wait <strong>"+Step.secs+"</strong> seconds":(Step.cur===2?"Preparing your download...":"Your download unlocks in <strong>"+Step.secs+"</strong> seconds");' +
    'btn.textContent=Step.cur===2?"Preparing...":(Step.cur===3?"Almost there...":"Wait...");' +
    'var iv=setInterval(function(){' +
    'sec--;num.textContent=sec>0?sec:"0";' +
    'ring.style.setProperty("--p",Math.max(0,(sec/Step.secs)*100));' +
    'if(sec<=5)ring.classList.add("warn");' +
    'if(sec<=0){clearInterval(iv);ring.classList.remove("active","warn");ring.classList.add("done");num.textContent="✓";' +
    'msg.innerHTML="<strong style=\\"color:#0f766e\\">Ready!</strong>";' +
    'btn.textContent=Step.cur===3?"Get Your Download":"Click Here to Continue";' +
    'btn.disabled=false;btn.classList.remove("disabled");btn.classList.add("ready");' +
    'btn.onclick=function(){if(Step.cur<3){Step.cur++;Step.run();}else Step.reveal();};' +
    '}' +
    '},1000);' +
    '},reveal:function(){' +
    'var sb=document.getElementById("step-box"),db=document.getElementById("dl-box");' +
    'if(sb)sb.style.display="none";' +
    'if(db){db.style.display="block";try{db.scrollIntoView({behavior:"smooth",block:"center"})}catch(e){}}' +
    '}};' +
    'Step.run();' +
    '</script>' +
    '<textarea id="tb" style="position:fixed;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true"></textarea>' +
    '</body></html>';
}

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(buf) {
  return hexBytes(await crypto.subtle.digest('SHA-256', buf));
}

async function ghFetch(env, pathname, options = {}) {
  const res = await fetch('https://api.github.com' + pathname, {
    ...options,
    headers: {
      Authorization: 'token ' + env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LinkShort-file2link',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error('GitHub ' + res.status + ' ' + pathname + ': ' + String(await res.text()).slice(0, 200));
  if (res.status === 204) return null;
  return res.json();
}

async function githubCommit(env, { add = [], removePrefixes = [] } = {}) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const refPath = '/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch;
  const latest = await ghFetch(env, refPath);
  const latestSha = latest.object.sha;
  const current = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/commits/' + latestSha);

  let entries = [];
  if (removePrefixes.length > 0) {
    const tree = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/trees/' + current.tree.sha + '?recursive=1');
    entries = tree.tree.filter(e => e.type === 'blob' && !removePrefixes.some(p => e.path === p || e.path.startsWith(p.replace(/\/$/, '') + '/')));
  }
  for (const a of add) {
    if (a.sha) {
      entries.push({ path: a.path, mode: a.mode || '100644', type: 'blob', sha: a.sha });
      continue;
    }
    const blob = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: a.content, encoding: 'utf-8' })
    });
    entries.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  let treeSha;
  if (entries.length === 0) {
    treeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  } else {
    const body = { tree: entries };
    if (removePrefixes.length === 0) body.base_tree = current.tree.sha;
    const newTree = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/trees', { method: 'POST', body: JSON.stringify(body) });
    treeSha = newTree.sha;
  }

  const newCommit = await ghFetch(env, '/repos/' + owner + '/' + repo + '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: 'file2link: ' + (add.length ? 'upload ' + add.length + ' blob(s)' : 'delete ' + removePrefixes.join(', ')), tree: treeSha, parents: [latestSha] })
  });
  await ghFetch(env, refPath, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });
  return newCommit.sha;
}

function bytesToBase64(u8) {
  const STEP = 3 * 4096;
  let out = '';
  for (let i = 0; i < u8.length; i += STEP) {
    out += btoa(String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + STEP, u8.length))));
  }
  return out;
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function githubFileStream(link) {
  const base = 'https://raw.githubusercontent.com/' + link.github.owner + '/' + link.github.repo + '/' + link.github.branch + '/files/' + link.github.id;
  const parts = link.chunks;
  let i = 1;
  return new ReadableStream({
    async pull(controller) {
      if (i > parts) { controller.close(); return; }
      const idx = i++;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(base + '/part-' + String(idx).padStart(4, '0') + '.b64');
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          controller.enqueue(base64ToBytes(txt));
          return;
        } catch (e) {
          if (attempt === 1) { controller.error(new Error('file part ' + idx + ' failed after retry')); return; }
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  });
}

async function genId(env) {
  let id;
  do {
    const rnd = new Uint8Array(8);
    crypto.getRandomValues(rnd);
    id = '';
    for (let i = 0; i < 6; i++) id += ALPHABET[rnd[i] % 62];
  } while (await env.KV.get('link:' + id));
  return id;
}

async function rateOk(env, ctx, ip, scope, max, windowMs) {
  const key = 'rl:' + ip + ':' + scope;
  let arr = [];
  try { arr = JSON.parse((await env.KV.get(key, 'text')) || '[]'); } catch (e) {}
  const now = Date.now();
  arr = arr.filter(t => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  ctx.waitUntil(env.KV.put(key, JSON.stringify(arr), { expirationTtl: Math.ceil(windowMs / 1000) + 30 }).catch(() => {}));
  return true;
}

async function updateMeta(env, link) {
  const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
  meta.total = (meta.total || 0) + 1;
  const summary = {
    id: link.id, kind: link.kind || 'url', clicks: link.clicks || 0,
    created: link.created, ...(link.kind === 'text' ? { text: String(link.text).slice(0, 200) } : {}),
    ...(link.kind === 'file' ? { name: link.name, size: link.size, type: link.type } : {}),
    ...(!link.kind || link.kind === 'url' ? { url: link.url } : {})
  };
  meta.recent = [summary].concat(meta.recent || []).slice(0, 25);
  await env.KV.put('meta', JSON.stringify(meta));
}

function incrClicks(env, id, link) {
  const newClicks = (link.clicks || 0) + 1;
  return Promise.all([
    env.KV.put('link:' + id, JSON.stringify(Object.assign({}, link, { clicks: newClicks }))),
    env.KV.get('meta', 'json').then(meta => {
      meta = meta || { total: 0, clicks: 0, recent: [] };
      meta.clicks = (meta.clicks || 0) + 1;
      return env.KV.put('meta', JSON.stringify(meta));
    })
  ]);
}

const SESSION_COOKIE = 'ls_sess';
const SESSION_TTL = 60 * 60 * 24 * 30;

function parseCookies(req) {
  const out = {};
  const c = req.headers.get('Cookie');
  if (!c) return out;
  c.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function hexBytes(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return hexBytes(b);
}

function constEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function pbkdf2(password, salt, iter) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: iter, hash: 'SHA-256' }, km, 256);
  return hexBytes(bits);
}

function sessionSetCookie(token) {
  return SESSION_COOKIE + '=' + token + '; Path=/; Max-Age=' + SESSION_TTL + '; HttpOnly; Secure; SameSite=Lax';
}

function sessionClearCookie() {
  return SESSION_COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax';
}

async function currentUser(env, request) {
  const t = parseCookies(request)[SESSION_COOKIE];
  if (!t) return null;
  const s = await env.KV.get('sess:' + t, 'json');
  if (!s || !s.name) return null;
  return { name: s.name };
}

async function createSession(env, name) {
  const token = randomToken(32);
  await env.KV.put('sess:' + token, JSON.stringify({ name }), { expirationTtl: SESSION_TTL });
  const r = json(200, { ok: true, name });
  r.headers.set('Set-Cookie', sessionSetCookie(token));
  return r;
}

async function addUserLink(env, name, link) {
  if (!link) return;
  const list = (await env.KV.get('userlinks:' + name, 'json')) || [];
  const next = [link].concat(list.filter(l => l.id !== link.id)).slice(0, 200);
  await env.KV.put('userlinks:' + name, JSON.stringify(next));
}

async function removeUserLink(env, name, id) {
  const list = (await env.KV.get('userlinks:' + name, 'json')) || [];
  await env.KV.put('userlinks:' + name, JSON.stringify(list.filter(l => l.id !== id)));
}

async function handleLink(request, env, ctx, id, ip) {
  const now = Date.now();
  const [rawRl, link] = await Promise.all([
    env.KV.get('rl:' + ip + ':go', 'text'),
    env.KV.get('link:' + id, 'json')
  ]);

  let rl = [];
  try { rl = JSON.parse(rawRl || '[]'); } catch (e) {}
  rl = rl.filter(t => now - t < 60000);
  if (rl.length >= 120) return html(429, 'Too many requests — slow down.', { 'X-Robots-Tag': 'noindex, nofollow' });
  rl.push(now);
  ctx.waitUntil(env.KV.put('rl:' + ip + ':go', JSON.stringify(rl), { expirationTtl: 120 }));

  if (!link) return notFound();
  if (link.kind === 'text') {
    ctx.waitUntil(incrClicks(env, id, link));
    return html(200, textPage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }
  if (link.kind === 'file') {
    ctx.waitUntil(incrClicks(env, id, link));
    return html(200, filePage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }
  if (isCrawler(request.headers.get('user-agent') || '')) {
    return html(200, crawlerPage(link), { 'X-Robots-Tag': 'noindex, nofollow' });
  }

  ctx.waitUntil(incrClicks(env, id, link));

  return new Response(null, {
    status: 301,
    headers: Object.assign({ 'Location': link.url, 'Cache-Control': 'no-store' }, SECURITY)
  });
}

async function handleFileDownload(env, ctx, id, ip) {
  const link = await env.KV.get('link:' + id, 'json');
  if (!link || link.kind !== 'file') return notFound();
  const now = Date.now();
  let rl = [];
  try { rl = JSON.parse((await env.KV.get('rl:' + ip + ':dl', 'text')) || '[]'); } catch (e) {}
  rl = rl.filter(t => now - t < 60000);
  if (rl.length >= 60) return html(429, 'Too many requests — slow down.', { 'X-Robots-Tag': 'noindex, nofollow' });
  rl.push(now);
  ctx.waitUntil(env.KV.put('rl:' + ip + ':dl', JSON.stringify(rl), { expirationTtl: 120 }));
  ctx.waitUntil(incrClicks(env, id, link));
  const cd = 'attachment; filename="' + (link.name || 'file').replace(/["\\\r\n]/g, '_') + '"';
  const headers = Object.assign({
    'Content-Type': link.type || 'application/octet-stream',
    'Content-Disposition': cd,
    'Cache-Control': 'private, max-age=60',
    'X-Robots-Tag': 'noindex, nofollow'
  }, SECURITY);
  if (link.github) {
    const stream = githubFileStream(link);
    return new Response(stream, { headers: Object.assign({ 'Content-Length': String(link.size) }, headers) });
  }
  if (link.chunks) {
    const n = link.chunks;
    let i = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (i >= n) { controller.close(); return Promise.resolve(); }
        const idx = i++;
        return env.KV.get('f:' + id + ':' + idx, 'arrayBuffer').then(v => {
          if (!v) { controller.error(new Error('missing chunk')); return; }
          controller.enqueue(new Uint8Array(v));
        });
      }
    });
    return new Response(stream, { headers: Object.assign({ 'Content-Length': String(link.size) }, headers) });
  }
  const data = await env.KV.get('f:' + id, 'arrayBuffer');
  if (!data) return notFound();
  return new Response(data, { headers: Object.assign({ 'Content-Length': String(link.size || data.byteLength) }, headers) });
}

async function handleApi(request, env, ctx, path, ip) {
  if (path === '/api/shorten' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    let target = String(body.url || '').trim();
    if (!target) return json(400, { error: 'URL required' });
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    try { new URL(target); } catch (e) { return json(400, { error: 'Invalid URL' }); }

    const hash = await sha1(target);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'short', 10, 60000),
      env.KV.get('u:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many links. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      id = await genId(env);
      const link = { id, url: target, clicks: 0, created: new Date().toISOString() };
      if (user) link.owner = user.name;
      await env.KV.put('link:' + id, JSON.stringify(link));
      ctx.waitUntil(env.KV.put('u:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/text' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const text = String(body.text || '');
    if (!text.trim()) return json(400, { error: 'Text required' });
    if (text.length > 100000) return json(400, { error: 'Text is too long — maximum 100,000 characters' });

    const hash = await sha1(text);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'text', 10, 60000),
      env.KV.get('t:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many links. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      id = await genId(env);
      const link = { id, kind: 'text', text, clicks: 0, created: new Date().toISOString() };
      if (user) link.owner = user.name;
      await env.KV.put('link:' + id, JSON.stringify(link));
      ctx.waitUntil(env.KV.put('t:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/file' && request.method === 'POST') {
    const user = await currentUser(env, request);
    let name = '';
    try { name = decodeURIComponent(request.headers.get('X-File-Name') || ''); } catch (e) {}
    name = String(name).trim().replace(/[\/\\]/g, '_').slice(0, 120) || 'file';
    const type = (request.headers.get('Content-Type') || 'application/octet-stream').split(';')[0].trim();
    const blocked = /^(text\/html|text\/javascript|text\/x-script|application\/x-javascript|application\/javascript|application\/x-html)/i;
    const safeType = blocked.test(type) ? 'application/octet-stream' : type;
    const buf = await request.arrayBuffer();
    if (!buf.byteLength) return json(400, { error: 'File required' });
    if (buf.byteLength > MAX_FILE) return json(400, { error: 'File too large — maximum 100 MB' });

    const hash = await sha256Bytes(buf);
    const [rateOkResult, dedupId] = await Promise.all([
      rateOk(env, ctx, ip, 'file', 6, 60000),
      env.KV.get('fh:' + hash, 'text')
    ]);
    if (!rateOkResult) return json(429, { error: 'Too many uploads. Slow down.' });
    let id = dedupId;
    let created = false;
    if (!id) {
      if (!env.GITHUB_TOKEN) return json(503, { error: 'File storage not configured' });
      id = await genId(env);
      const u8 = new Uint8Array(buf);
      const chunks = Math.max(1, Math.ceil(u8.byteLength / FILE_CHUNK));
      const b64s = [];
      for (let i = 0; i < chunks; i++) {
        const start = i * FILE_CHUNK;
        const end = Math.min(start + FILE_CHUNK, u8.byteLength);
        b64s.push(bytesToBase64(u8.subarray(start, end)));
      }
      const prefix = 'files/' + id;
      const add = [];
      for (let i = 0; i < chunks; i++) {
        add.push({ path: prefix + '/part-' + String(i + 1).padStart(4, '0') + '.b64', content: b64s[i] });
      }
      add.push({ path: prefix + '/manifest.json', content: JSON.stringify({ id, name, type: safeType, size: u8.byteLength, hash, chunks }) });
      const commitSha = await githubCommit(env, { add });
      const link = {
        id, kind: 'file', name, type: safeType, size: u8.byteLength, hash, chunks,
        github: { owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || 'main', id, commit: commitSha },
        clicks: 0, created: new Date().toISOString()
      };
      if (user) link.owner = user.name;
      const linkPutOk = await env.KV.put('link:' + id, JSON.stringify(link)).then(() => true).catch(() => false);
      if (!linkPutOk) return json(500, { error: 'Storage write failed' });
      ctx.waitUntil(env.KV.put('fh:' + hash, id).catch(() => {}));
      ctx.waitUntil(updateMeta(env, link));
      created = true;
    }
    if (user) {
      if (!created) {
        const cur = await env.KV.get('link:' + id, 'json');
        if (cur && !cur.owner) {
          cur.owner = user.name;
          await env.KV.put('link:' + id, JSON.stringify(cur));
        }
      }
      const link = await env.KV.get('link:' + id, 'json');
      if (link) ctx.waitUntil(addUserLink(env, user.name, link));
    }
    return json(200, { id, owned: !!user });
  }

  if (path === '/api/register' && request.method === 'POST') {
    if (!(await rateOk(env, ctx, ip, 'auth', 8, 60000))) return json(429, { error: 'Too many attempts. Slow down.' });
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!/^[a-zA-Z0-9_.\-]{3,20}$/.test(name)) return json(400, { error: 'Username must be 3–20 chars using letters, numbers, _ . -' });
    if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' });
    const key = 'user:' + name.toLowerCase();
    if (await env.KV.get(key)) return json(409, { error: 'Username is already taken' });
    const salt = randomToken(16);
    const iter = 100000;
    const hash = await pbkdf2(password, salt, iter);
    await env.KV.put(key, JSON.stringify({ name: name.toLowerCase(), hash, salt, iter, created: new Date().toISOString() }));
    return createSession(env, name.toLowerCase());
  }

  if (path === '/api/login' && request.method === 'POST') {
    if (!(await rateOk(env, ctx, ip, 'auth', 8, 60000))) return json(429, { error: 'Too many attempts. Slow down.' });
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = String(body.name || '').trim().toLowerCase();
    const rec = await env.KV.get('user:' + name, 'json');
    if (!rec) return json(401, { error: 'Invalid username or password' });
    const hash = await pbkdf2(String(body.password || ''), rec.salt, rec.iter);
    if (!constEq(hash, rec.hash)) return json(401, { error: 'Invalid username or password' });
    return createSession(env, name);
  }

  if (path === '/api/logout' && request.method === 'POST') {
    const t = parseCookies(request)[SESSION_COOKIE];
    if (t) await env.KV.delete('sess:' + t);
    const r = json(200, { ok: true });
    r.headers.set('Set-Cookie', sessionClearCookie());
    return r;
  }

  if (path === '/api/me' && request.method === 'GET') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    return json(200, { ok: true, name: u.name });
  }

  if (path === '/api/me/links' && request.method === 'GET') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    const list = (await env.KV.get('userlinks:' + u.name, 'json')) || [];
    return json(200, list);
  }

  const del = path.match(/^\/api\/me\/links\/([0-9a-zA-Z]{6})$/);
  if (del && request.method === 'DELETE') {
    const u = await currentUser(env, request);
    if (!u) return json(401, { error: 'Not signed in' });
    const id = del[1];
    const link = await env.KV.get('link:' + id, 'json');
    if (!link || link.owner !== u.name) return json(404, { error: 'Not found' });
    await env.KV.delete('link:' + id);
    if (link.kind === 'file') {
      if (link.github) {
        ctx.waitUntil(githubCommit(env, { removePrefixes: ['files/' + id] }).catch(() => {}));
      }
      if (link.chunks) {
        const n = link.chunks;
        for (let i = 0; i < n; i++) await env.KV.delete('f:' + id + ':' + i);
        await env.KV.delete('f:' + id);
      }
      if (link.hash) await env.KV.delete('fh:' + link.hash);
    } else {
      await env.KV.delete((link.kind === 'text' ? 't:' : 'u:') + (await sha1(link.kind === 'text' ? link.text : link.url)));
    }
    await removeUserLink(env, u.name, id);
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    meta.recent = (meta.recent || []).filter(l => l.id !== id);
    meta.total = Math.max(0, (meta.total || 0) - 1);
    await env.KV.put('meta', JSON.stringify(meta));
    return json(200, { ok: true });
  }

  if (path === '/api/links' && request.method === 'GET') {
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    return json(200, (meta.recent || []).slice(0, 25));
  }

  if (path === '/api/stats' && request.method === 'GET') {
    const meta = (await env.KV.get('meta', 'json')) || { total: 0, clicks: 0, recent: [] };
    return json(200, { total: meta.total || 0, clicks: meta.clicks || 0 });
  }

  return json(404, { error: 'Not found' });
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function serveAsset(path) {
  const p = path === '/' ? '/index.html' : path;
  const a = ASSETS.find(x => x.path === p) || ASSETS.find(x => x.path === path);
  if (!a) return null;
  const body = a.b64 ? b64ToBytes(a.b64) : a.content;
  return new Response(body, {
    status: 200,
    headers: Object.assign({ 'Content-Type': a.type, 'Cache-Control': a.cache, 'Vary': 'Accept-Encoding' }, SECURITY)
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+/g, '/');
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    const short = path.match(/^\/([0-9a-zA-Z]{6})$/);
    if (short) return handleLink(request, env, ctx, short[1], ip);

    const dl = path.match(/^\/([0-9a-zA-Z]{6})\/dl$/);
    if (dl) return handleFileDownload(env, ctx, dl[1], ip);

    if (path.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cookie',
            'Access-Control-Max-Age': '86400'
          }
        });
      }
      return handleApi(request, env, ctx, path, ip);
    }

    return serveAsset(path) || notFound();
  }
};
