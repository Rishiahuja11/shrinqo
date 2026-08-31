import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const PUB = 'public';
const TYPE = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};
const BINARY = new Set(['.png', '.ico', '.jpg', '.jpeg', '.webp']);
const CACHE_HTML = 'no-store';
const CACHE_ASSET = 'public, max-age=86400';

const items = [];
for (const f of readdirSync(PUB).filter(f => !f.startsWith('.'))) {
  const data = readFileSync(join(PUB, f));
  const ext = extname(f).toLowerCase();
  const isBinary = BINARY.has(ext);
  items.push({
    path: '/' + f,
    type: TYPE[ext] || 'application/octet-stream',
    cache: ext === '.html' ? CACHE_HTML : CACHE_ASSET,
    ...(isBinary ? { b64: data.toString('base64') } : { content: data.toString('utf8') })
  });
}
if (!items.some(i => i.path === '/index.html')) throw new Error('public/index.html missing');

const assetsJs =
  'const ASSETS = ' + JSON.stringify(items) + ';\nexport { ASSETS };\n';
writeFileSync('src/assets.js', assetsJs);

const raw = readFileSync('src/worker.js', 'utf8');
const importLine = /^import\s*\{[^}]*ASSETS[^}]*\}\s*from\s*'\.\/assets\.js';?\s*\n/m;
if (!importLine.test(raw)) throw new Error('worker.js does not import ./assets.js');
const workerWithoutImport = raw.replace(importLine, '');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/worker.js', assetsJs + '\n' + workerWithoutImport);

console.log('dist/worker.js written —', items.length, 'assets,',
  (Buffer.byteLength(assetsJs) / 1024).toFixed(1) + 'KB of assets');
