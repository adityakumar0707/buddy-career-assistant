'use strict';
// Local server for testing: node server.js  (opens http://localhost:3000)
// On Vercel this file is not used: /public is served as static files and /api/*.js run as functions.
const http = require('http');
const fs = require('fs');
const path = require('path');

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env file */ }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9_-]/gi, '');
    let handler;
    try { handler = require('./api/' + name + '.js'); } catch (e) { res.statusCode = 404; return res.end('Not found'); }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try { req.body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; } catch (e) { req.body = {}; }
      await handler(req, res);
    });
    return;
  }
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));
  if (!full.startsWith(path.join(__dirname, 'public'))) { res.statusCode = 403; return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(full)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => console.log('Buddy running at http://localhost:' + PORT));
