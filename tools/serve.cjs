// Dependency-free development server. Production is just static index.html.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createReadStream } = require('node:fs');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.cjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
async function startServer({ port = 8080, host = '0.0.0.0', root = ROOT } = {}) {
  root = await fs.realpath(path.resolve(root));
  const server = http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(p => p.startsWith('.') || p === 'node_modules' || p === 'uploads')) {
        res.writeHead(403); return res.end('Forbidden');
      }
      let file = path.resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const real = await fs.realpath(file);
      if (real !== root && !real.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
      const stat = await fs.stat(real);
      if (!stat.isFile()) throw Error('Not a file');
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(real)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      if (req.method === 'HEAD') return res.end();
      createReadStream(real).on('error', () => res.destroy()).pipe(res);
    } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid PORT');
  startServer({ port, host: process.env.HOST || '0.0.0.0' }).then(server => {
    console.log(`NewsGram: http://localhost:${server.address().port}`);
    for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { server.close(); server.closeAllConnections(); });
  }).catch(e => { console.error(e.message); process.exitCode = 1; });
}
module.exports = { startServer };
