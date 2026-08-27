const { spawn } = require('child_process');
const fs = require('fs');

const { bin, install } = require('cloudflared');

const TOKEN = process.env.TUNNEL_TOKEN;

async function main() {
  if (!TOKEN) {
    console.error('[tunnel] No TUNNEL_TOKEN env var set. Set it to the Cloudflare tunnel token to start the tunnel.');
    process.exit(0);
  }

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
