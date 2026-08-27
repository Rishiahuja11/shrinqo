const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.TUNNEL_TOKEN || 'eyJhIjoiNTA3N2NkM2Q2YWZmZjYyZTgzODhiYzVmM2RmZmQ1YTgiLCJ0IjoiM2EzYzk0NTEtMmNmYy00YmU0LWE4ODAtZjI4Yzc0OTU2NjRhIiwicyI6IkxaUnBZdXkwOHVMeWdaWmJnVHo2dityNkhzaklWVjBqQTRIblBJNEh3NTh3WUJvUFcrcUwybm5BSjU2Sjh1NEVzMitrVlh5c3dTQ0FoYmlGNEdPZjdnPT0ifQ==';

const CACHE_DIR = process.env.CLOUDFLARED_CACHE || path.join(__dirname, '.cache');
const BIN = path.join(CACHE_DIR, 'cloudflared');

const DOWNLOAD_URL = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

function hasBinary() {
  try {
    return fs.existsSync(BIN) && fs.statSync(BIN).size > 1000000;
  } catch (e) {
    return false;
  }
}

function download() {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file = fs.createWriteStream(BIN);
    const req = https.get(DOWNLOAD_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('Download failed: HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.chmodSync(BIN, 0o755);
          resolve();
        });
      });
    });
    req.on('error', (e) => { file.destroy(); reject(e); });
  });
}

async function main() {
  if (!hasBinary()) {
    console.log('[tunnel] Downloading cloudflared...');
    try {
      await download();
      console.log('[tunnel] cloudflared downloaded');
    } catch (e) {
      console.error('[tunnel] Download failed: ' + e.message);
      process.exit(1);
    }
  }

  console.log('[tunnel] Starting cloudflared tunnel...');
  const proc = spawn(BIN, ['tunnel', 'run', '--token', TOKEN], {
    stdio: 'inherit',
    env: { ...process.env, NO_COLOR: '1' }
  });

  proc.on('exit', (code) => {
    console.log('[tunnel] cloudflared exited with code ' + code);
    process.exit(code || 0);
  });

  proc.on('error', (e) => {
    console.error('[tunnel] Failed to spawn cloudflared: ' + e.message);
    process.exit(1);
  });

  ['SIGINT', 'SIGTERM'].forEach((sig) => {
    process.on(sig, () => {
      console.log('[tunnel] Received ' + sig + ', stopping tunnel...');
      proc.kill(sig);
      process.exit(0);
    });
  });
}

main();
