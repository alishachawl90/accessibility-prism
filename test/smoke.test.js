/**
 * Smoke test: builds the extension, launches a test page,
 * injects content.js, activates the panel, runs an axe scan,
 * and asserts results are rendered.
 *
 * Run: npm run test:smoke
 * Prereq: npm install (puppeteer is a devDependency)
 */

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 9222;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

function startServer() {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      const url = req.url === '/' ? '/index.html' : req.url;
      const filePath = resolve(ROOT, '.' + url);
      if (!existsSync(filePath)) {
        resp.writeHead(404);
        resp.end('Not found');
        return;
      }
      const ext = extname(filePath);
      resp.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      resp.end(readFileSync(filePath));
    });
    server.listen(PORT, () => res(server));
  });
}

function log(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  process.exit(1);
}

async function run() {
  console.log('\n🔨 Building...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    log('Build succeeded');
  } catch (e) {
    fail(`Build failed:\n${e.stderr?.toString()}`);
  }

  if (!existsSync(resolve(ROOT, 'dist/content.js'))) {
    fail('dist/content.js not found after build');
  }
  log('dist/content.js exists');

  console.log('\n🌐 Starting local server...');
  const server = await startServer();
  log(`Server running on http://localhost:${PORT}`);

  let browser;
  try {
    console.log('\n🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 900 });

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
    log('Test page loaded');

    // The test page loads dist/content.js via <script> tag, which auto-creates the activation button
    await page.waitForSelector('#a11y-analyzer-activate', { timeout: 5000 });
    log('Activation button found');

    await page.click('#a11y-analyzer-activate');
    await page.waitForSelector('#a11y-analyzer-panel', { timeout: 5000 });
    log('Panel activated');

    await page.screenshot({ path: resolve(ROOT, 'test/screenshots/01-panel-open.png') });

    // Find and click "Full Page Scan (Axe)" button (id: btn-auto-axe)
    const axeBtn = await page.$('#a11y-analyzer-panel #btn-auto-axe');
    if (!axeBtn) {
      fail('Could not find "Full Page Scan (Axe)" button (#btn-auto-axe)');
    }
    await axeBtn.click();
    log('Clicked "Full Page Scan (Axe)"');

    // Wait for results to render (rule cards appear)
    await page.waitForFunction(
      () => document.querySelectorAll('#a11y-analyzer-panel .rule-card').length > 0,
      { timeout: 15000 }
    );
    log('Axe results rendered');

    const ruleCardCount = await page.evaluate(
      () => document.querySelectorAll('#a11y-analyzer-panel .rule-card').length
    );
    log(`Found ${ruleCardCount} rule cards`);

    if (ruleCardCount === 0) {
      fail('No rule cards found — axe scan produced no results');
    }

    // Check result type chips exist
    const chipCount = await page.evaluate(
      () => document.querySelectorAll('#a11y-analyzer-panel .result-type-chip').length
    );
    if (chipCount < 3) {
      fail(`Expected at least 3 result type chips, found ${chipCount}`);
    }
    log(`Found ${chipCount} result type chips`);

    await page.screenshot({ path: resolve(ROOT, 'test/screenshots/02-axe-results.png') });

    // Click first rule card to test navigation to details
    await page.click('#a11y-analyzer-panel .rule-card');
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('#a11y-analyzer-panel');
        return panel?.querySelector('#btn-back') && !panel?.querySelector('.rule-card');
      },
      { timeout: 5000 }
    );
    log('Navigated to issue details');

    await page.screenshot({ path: resolve(ROOT, 'test/screenshots/03-issue-details.png') });

    // Click back
    await page.click('#a11y-analyzer-panel #btn-back');
    await page.waitForFunction(
      () => document.querySelectorAll('#a11y-analyzer-panel .rule-card').length > 0,
      { timeout: 5000 }
    );
    log('Back navigation works');

    console.log('\n✅ All smoke tests passed!\n');
    console.log(`   Screenshots saved to test/screenshots/\n`);
  } catch (err) {
    console.error('\n❌ Smoke test failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run();
