const { spawn } = require('child_process');
const fs = require('fs');

const { bin, install } = require('cloudflared');

const TOKEN = process.env.TUNNEL_TOKEN || 'eyJhIjoiNTA3N2NkM2Q2YWZmZjYyZTgzODhiYzVmM2RmZmQ1YTgiLCJ0IjoiM2EzYzk0NTEtMmNmYy00YmU0LWE4ODAtZjI4Yzc0OTU2NjRhIiwicyI6IkxaUnBZdXkwOHVMeWdaWmJnVHo2dityNkhzaklWVjBqQTRIblBJNEh3NTh3WUJvUFcrcUwybm5BSjU2Sjh1NEVzMitrVlh5c3dTQ0FoYmlGNEdPZjdnPT0ifQ==';

async function main() {
  let binary = bin;
  if (!fs.existsSync(binary)) {
    console.log('[tunnel] Installing cloudflared binary...');
    try {
      binary = await install(bin);
      console.log('[tunnel] cloudflared installed at ' + binary);
    } catch (e) {
      console.error('[tunnel] Install failed: ' + e.message);
      process.exit(1);
    }
  }

  console.log('[tunnel] Starting cloudflared tunnel to localhost:10000...');
  const proc = spawn(binary, ['tunnel', 'run', '--token', TOKEN], {
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
      proc.kill(sig);
      setTimeout(() => process.exit(0), 500);
    });
  });
}

main();
