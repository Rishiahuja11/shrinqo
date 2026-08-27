const { spawn } = require('child_process');
const path = require('path');

const APP_DIR = path.join(__dirname, 'linkshort-app');
const TUNNEL_RESTART_DELAY = 4000;

function run(name, file, extraEnv, cwd) {
  const child = spawn(process.execPath, [file], {
    cwd: cwd || APP_DIR,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit'
  });
  child.on('error', (err) => {
    console.error(`[${name}] failed to spawn: ${err.message}`);
  });
  return child;
}

let shuttingDown = false;

const server = run('server', 'server.js', {});

server.on('exit', (code, signal) => {
  console.log(`[server] exited (code=${code}, signal=${signal})`);
  if (!shuttingDown) process.exit(code || 1);
});

function startTunnel() {
  const tunnel = run('tunnel', 'tunnel.js', {});
  tunnel.on('exit', (code, signal) => {
    console.log(`[tunnel] exited (code=${code}, signal=${signal})`);
    if (shuttingDown) return;
    if (code === 0) {
      // Graceful stop (no token configured) or clean exit: keep server up.
      console.log('[tunnel] stopped (code 0); not restarting to avoid a crash loop.');
    } else {
      // Unexpected tunnel death: restart to keep the custom domain alive.
      console.log(`[tunnel] died (code=${code}); restarting in ${TUNNEL_RESTART_DELAY}ms...`);
      setTimeout(startTunnel, TUNNEL_RESTART_DELAY);
    }
  });
  return tunnel;
}

startTunnel();

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.kill('SIGTERM');
}
process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
