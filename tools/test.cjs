// Explicit suites: no live Microlink calls and no obsolete Source/draft UI tests.
const { spawn } = require('node:child_process');
const path = require('node:path');
const { startServer } = require('./serve.cjs');
const root = path.resolve(__dirname, '..');
const core = ['highlights-section', 'browser', 'mobile', 'cuts', 'touch', 'ratios', 'setup', 'pdf', 'marking'];
const allowed = new Set([...core, 'pdf-loading', 'screenshots', 'pdf-screenshots']);
const arg = process.argv[2];
let suites;
if (!arg) suites = core;
else if (arg === '--all') suites = [...core, 'pdf-loading'];
else if (arg === '--screenshots') suites = ['screenshots', 'pdf-screenshots'];
else if (allowed.has(arg)) suites = [arg];
else { console.error(`Unknown suite: ${arg}`); process.exit(2); }
let child, server;
async function run(name, env) {
  console.log(`\n--- ${name} ---`);
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [path.join(root, 'tests', name + '.cjs')], { cwd: root, env, stdio: 'inherit' });
    const timer = setTimeout(() => { console.error(`${name}: exceeded 180 seconds`); child.kill('SIGKILL'); }, 180000);
    child.once('error', e => { clearTimeout(timer); reject(e); });
    child.once('exit', (code, signal) => { clearTimeout(timer); child = null; code === 0 ? resolve() : reject(Error(`${name} failed (${signal || code})`)); });
  });
}
for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { child?.kill(sig); server?.closeAllConnections(); server?.close(); process.exit(130); });
(async () => {
  try {
    const env = { ...process.env };
    if (!env.NEWSGRAM_TEST_URL) {
      server = await startServer({ host: '127.0.0.1', port: 0 });
      env.NEWSGRAM_TEST_URL = `http://127.0.0.1:${server.address().port}`;
    }
    console.log(`Testing ${env.NEWSGRAM_TEST_URL}`);
    for (const suite of suites) await run(suite, env);
    console.log(`\nPASS: ${suites.length} suite(s). Artifacts: validation/ (gitignored).`);
  } catch (e) { console.error(e.message); process.exitCode = 1; }
  finally { if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } }
})();
