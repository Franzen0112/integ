/**
 * Local development server for JJRK Studio
 * Serves static files at http://localhost:8080 (required for Supabase Auth in Chrome)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(ROOT, normalized);
  if (!full.startsWith(ROOT)) {
    return null;
  }
  return full;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = safePath(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (err) {
      if (urlPath.endsWith('/') || !path.extname(urlPath)) {
        const htmlFallback = safePath(urlPath + (urlPath.endsWith('/') ? '' : '/') + 'index.html') ||
          safePath(urlPath.replace(/\/?$/, '.html'));
        if (htmlFallback && fs.existsSync(htmlFallback)) {
          sendFile(res, htmlFallback);
          return;
        }
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    sendFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`;
  console.log('');
  console.log('  JJRK Studio — local dev server');
  console.log('  ------------------------------');
  console.log(`  Home:    ${base}/index.html`);
  console.log(`  Login:   ${base}/login.html`);
  console.log(`  Register:${base}/register.html`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
