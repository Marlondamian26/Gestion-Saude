const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist-promo');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  let filePath = path.join(DIST_DIR, urlPath);
  let ext = path.extname(filePath);

  if (!ext || !fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'promo.html');
    ext = '.html';
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Promo static server running on port ${PORT}`);
});
