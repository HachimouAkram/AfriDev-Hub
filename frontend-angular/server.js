const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist', 'frontend-angular', 'browser');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Support des probes Kubernetes (GET et HEAD sur /health, /healthz, /)
  if (req.url === '/health' || req.url === '/healthz' || (req.method === 'HEAD' && req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // Reverse proxy pour toutes les requêtes API vers Spring Boot
  if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
    const backendBase = process.env.BACKEND_URL || 'http://31.207.36.107:8081';
    let targetUrl;
    try {
      targetUrl = new URL(req.url, backendBase);
    } catch (e) {
      targetUrl = new URL(req.url, 'http://31.207.36.107:8081');
    }

    const proxyHeaders = { ...req.headers };
    proxyHeaders.host = targetUrl.host;

    const client = targetUrl.protocol === 'https:' ? https : http;
    const proxyReq = client.request({
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: proxyHeaders
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[API Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 502,
        error: 'Bad Gateway',
        message: 'Impossible de joindre le backend Spring Boot (' + backendBase + ')'
      }));
    });

    req.pipe(proxyReq);
    return;
  }

  // Nettoyage de l'URL
  let safePath = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Vérifier si le fichier statique existe
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Fallback SPA : rediriger toute route vers index.html pour Angular
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Build not found. Run npm run build first.');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`===================================================`);
  console.log(`🌍 AfriDev Hub Frontend démarré sur http://${HOST}:${PORT}`);
  console.log(`📁 Fichiers servis depuis : ${DIST_DIR}`);
  console.log(`===================================================`);
});
