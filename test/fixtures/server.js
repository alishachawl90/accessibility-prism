/**
 * Static file server for Playwright tests.
 * Serves the project root so index.html + dist/ are accessible.
 * Starts on port from PORT env var or 9333.
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../..');
const PORT = parseInt(process.env.PORT || '9333', 10);

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

if (!existsSync(resolve(ROOT, 'dist/content.js'))) {
  console.log('Building dist/content.js...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = resolve(ROOT, '.' + url);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = extname(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});
