// Lightweight local preview for the static site and Netlify Functions.
// This process always uses local MongoDB and never loads .env.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/nexum_bms';
process.env.MONGODB_DB = 'nexum_bms';

const root = __dirname;
const functions = new Map([
  ['contact', require('./netlify/functions/contact').handler],
  ['login', require('./netlify/functions/login').handler],
  ['logout', require('./netlify/functions/logout').handler],
  ['inquiries', require('./netlify/functions/inquiries').handler],
  ['user-management', require('./netlify/functions/user-management').handler],
]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

async function routeFunction(req, res, name) {
  const handler = functions.get(name);
  if (!handler) return send(res, 404, 'Not found');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) return send(res, 413, 'Request too large');
    chunks.push(chunk);
  }
  try {
    const result = await handler({
      httpMethod: req.method,
      headers: req.headers,
      body: Buffer.concat(chunks).toString('utf8'),
      isBase64Encoded: false,
    });
    send(res, result.statusCode || 200, result.body || '', result.headers || {});
  } catch (error) {
    console.error(`[dev-server] ${name}:`, error);
    send(res, 500, JSON.stringify({ ok: false, detail: 'Internal server error.' }), {
      'Content-Type': 'application/json; charset=utf-8',
    });
  }
}

function routeStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let file = pathname === '/' || pathname === '/admin' || pathname === '/admin/'
    ? (pathname.startsWith('/admin') ? '/admin/index.html' : '/index.html')
    : pathname;
  const isPublicRoot = /^\/[a-zA-Z0-9_-]+\.(html|css|js)$/.test(file);
  const isAdmin = /^\/admin\/(index\.html|admin\.js)$/.test(file);
  if (!isPublicRoot && !isAdmin) return send(res, 404, 'Not found');
  file = path.join(root, file.slice(1));
  fs.readFile(file, (error, data) => {
    if (error) return send(res, error.code === 'ENOENT' ? 404 : 500, 'Not found');
    send(res, 200, req.method === 'HEAD' ? '' : data, {
      'Content-Type': types[path.extname(file)],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { return send(res, 400, 'Bad request'); }
  const match = /^\/\.netlify\/functions\/([a-z-]+)\/?$/.exec(pathname);
  if (match) return void routeFunction(req, res, match[1]);
  routeStatic(req, res, pathname);
});

if (require.main === module) {
  const port = Number(process.env.PORT || 8888);
  server.listen(port, '127.0.0.1', () => {
    console.log(`Local site: http://127.0.0.1:${port}/`);
    console.log(`Admin panel: http://127.0.0.1:${port}/admin/`);
  });
}

module.exports = server;
