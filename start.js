const { spawn } = require('child_process');
const path = require('path');

const APP_DIR = path.join(__dirname, 'linkshort-app');

function run(name, file, extraEnv) {
  const child = spawn(process.execPath, [file], {
    cwd: APP_DIR,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit'
  });
  child.on('exit', (code, signal) => {
    console.log(`[${name}] exited (code=${code}, signal=${signal})`);
    process.exit();
  });
  return child;
}

const server = run('server', 'server.js', {});
const tunnel = run('tunnel', 'tunnel.js', {});

process.on('SIGINT', () => { server.kill('SIGINT'); tunnel.kill('SIGINT'); });
process.on('SIGTERM', () => { server.kill('SIGTERM'); tunnel.kill('SIGTERM'); });
