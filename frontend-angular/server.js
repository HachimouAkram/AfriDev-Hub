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
  '.mp4': 'video/mp4',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const requestHandler = (req, res) => {
  // Support des probes Kubernetes (GET et HEAD sur /health, /healthz, /)
  if (req.url === '/health' || req.url === '/healthz' || (req.method === 'HEAD' && req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // Reverse proxy pour toutes les requêtes API vers Spring Boot
  if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
    const backendBase = process.env.BACKEND_URL || 'http://localhost:8081';
    let targetUrl;
    try {
      targetUrl = new URL(req.url, backendBase);
    } catch (e) {
      targetUrl = new URL(req.url, 'http://localhost:8081');
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
};

function startServer(portToTry) {
  const srv = http.createServer(requestHandler);

  srv.on('error', (err) => {
    // Sous Windows, le port 8080 est fréquemment réservé par Hyper-V / WinNAT (EACCES)
    // En l'absence de variable PORT explicite, basculer proprement sur un port libre (3000)
    if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && !process.env.PORT && portToTry !== 3000) {
      console.warn(`⚠️ Port ${portToTry} inaccessible sur cette machine (${err.code}).`);
      console.warn(`👉 Bascule automatique sur le port 3000 (http://localhost:3000)...`);
      startServer(3000);
    } else {
      console.error(`❌ Erreur au démarrage du serveur :`, err.message);
      process.exit(1);
    }
  });

  srv.listen(portToTry, HOST, () => {
    console.log(`===================================================`);
    console.log(`🌍 AfriDev Hub démarré avec succès sur http://${HOST}:${portToTry}`);
    console.log(`📁 Fichiers servis depuis : ${DIST_DIR}`);
    console.log(`===================================================`);
  });
}

startServer(PORT);
