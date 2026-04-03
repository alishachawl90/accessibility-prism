/**
 * Unit test for card expand/collapse in results-template.
 * Verifies that clicking .a11y-card-header toggles .a11y-card-body visibility.
 *
 * Run: node test/card-expand.test.js
 */

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 9223;

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
};

function startServer() {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      const url = req.url === '/' ? '/index.html' : req.url;
      const filePath = resolve(ROOT, '.' + url);
      if (!existsSync(filePath)) { resp.writeHead(404); resp.end('Not found'); return; }
      const ext = extname(filePath);
      resp.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      resp.end(readFileSync(filePath));
    });
    server.listen(PORT, () => res(server));
  });
}

function log(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exit(1); }

async function run() {
  console.log('\n🔨 Building...');
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  log('Build succeeded');

  const server = await startServer();
  let browser;

  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 900 });

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#a11y-analyzer-activate', { timeout: 5000 });
    await page.click('#a11y-analyzer-activate');
    await page.waitForSelector('#a11y-analyzer-panel', { timeout: 5000 });
    log('Panel open');

    // --- Test 1: Axe issue details occurrence expand ---
    console.log('\n📋 Test 1: Axe issue details occurrences');
    await page.click('#a11y-analyzer-panel #btn-auto-axe');
    await page.waitForFunction(
      () => document.querySelectorAll('#a11y-analyzer-panel .rule-card').length > 0,
      { timeout: 15000 }
    );
    await page.click('#a11y-analyzer-panel .rule-card');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel .occ-header'),
      { timeout: 5000 }
    );
    log('Navigated to issue details');

    // Click occurrence header
    const occBodyBefore = await page.evaluate(() => {
      const body = document.querySelector('#a11y-analyzer-panel .occ-body');
      return body ? getComputedStyle(body).display : null;
    });
    log(`Occurrence body before click: ${occBodyBefore}`);

    await page.click('#a11y-analyzer-panel .occ-header');
    await new Promise(r => setTimeout(r, 200));

    const occBodyAfter = await page.evaluate(() => {
      const body = document.querySelector('#a11y-analyzer-panel .occ-body');
      return body ? getComputedStyle(body).display : null;
    });
    if (occBodyAfter !== 'block') {
      fail(`Occurrence expand failed: expected 'block', got '${occBodyAfter}'`);
    }
    log(`Occurrence body after click: ${occBodyAfter} ✓`);

    // Go back to pre-screen
    await page.click('#a11y-analyzer-panel #btn-back');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel .rule-card'),
      { timeout: 5000 }
    );
    await page.click('#a11y-analyzer-panel #btn-back');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel #btn-alt-text'),
      { timeout: 5000 }
    );
    log('Back to pre-screen');

    // --- Test 2: Alt Text cards expand ---
    console.log('\n📋 Test 2: Alt Text card expand/collapse');
    await page.click('#a11y-analyzer-panel #btn-alt-text');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel .a11y-issue-card'),
      { timeout: 10000 }
    );
    log('Alt Text results loaded');

    const altCardCount = await page.evaluate(
      () => document.querySelectorAll('#a11y-analyzer-panel .a11y-issue-card').length
    );
    log(`Found ${altCardCount} alt text cards`);

    if (altCardCount === 0) {
      log('No alt text issues on test page — skipping expand test');
    } else {
      // Check body is hidden
      const bodyHiddenBefore = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      log(`Card body before click: display=${bodyHiddenBefore}`);
      if (bodyHiddenBefore !== 'none') {
        fail(`Card body should start hidden, got: ${bodyHiddenBefore}`);
      }

      // Click header to expand
      await page.click('#a11y-analyzer-panel .a11y-card-header');
      await new Promise(r => setTimeout(r, 200));

      const bodyAfterExpand = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      if (bodyAfterExpand !== 'block') {
        fail(`Card expand failed: expected 'block', got '${bodyAfterExpand}'`);
      }
      log(`Card body after expand: display=${bodyAfterExpand} ✓`);

      // Click header again to collapse
      await page.click('#a11y-analyzer-panel .a11y-card-header');
      await new Promise(r => setTimeout(r, 200));

      const bodyAfterCollapse = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      if (bodyAfterCollapse !== 'none') {
        fail(`Card collapse failed: expected 'none', got '${bodyAfterCollapse}'`);
      }
      log(`Card body after collapse: display=${bodyAfterCollapse} ✓`);
    }

    // --- Test 3: Form Labels cards expand ---
    console.log('\n📋 Test 3: Form Labels card expand/collapse');
    await page.click('#a11y-analyzer-panel #btn-back');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel #btn-form-labels'),
      { timeout: 5000 }
    );
    await page.click('#a11y-analyzer-panel #btn-form-labels');
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('#a11y-analyzer-panel');
        return panel?.querySelector('.a11y-issue-card') || panel?.querySelector('.a11y-empty-success');
      },
      { timeout: 10000 }
    );

    const formCardCount = await page.evaluate(
      () => document.querySelectorAll('#a11y-analyzer-panel .a11y-issue-card').length
    );
    log(`Found ${formCardCount} form label cards`);

    if (formCardCount === 0) {
      log('No form label issues on test page — skipping expand test');
    } else {
      const bodyBefore = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      log(`Card body before click: display=${bodyBefore}`);

      await page.click('#a11y-analyzer-panel .a11y-card-header');
      await new Promise(r => setTimeout(r, 200));

      const bodyAfter = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      if (bodyAfter !== 'block') {
        fail(`Form labels card expand failed: expected 'block', got '${bodyAfter}'`);
      }
      log(`Card body after expand: display=${bodyAfter} ✓`);
    }

    // --- Test 4: Contrast cards expand ---
    console.log('\n📋 Test 4: Contrast card expand/collapse');
    await page.click('#a11y-analyzer-panel #btn-back');
    await page.waitForFunction(
      () => document.querySelector('#a11y-analyzer-panel #btn-contrast'),
      { timeout: 5000 }
    );
    await page.click('#a11y-analyzer-panel #btn-contrast');
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('#a11y-analyzer-panel');
        return panel?.querySelector('.a11y-issue-card') || panel?.querySelector('.a11y-empty-success');
      },
      { timeout: 10000 }
    );

    const contrastCardCount = await page.evaluate(
      () => document.querySelectorAll('#a11y-analyzer-panel .a11y-issue-card').length
    );
    log(`Found ${contrastCardCount} contrast cards`);

    if (contrastCardCount === 0) {
      log('No contrast issues on test page — skipping expand test');
    } else {
      await page.click('#a11y-analyzer-panel .a11y-card-header');
      await new Promise(r => setTimeout(r, 200));

      const bodyAfter = await page.evaluate(() => {
        const body = document.querySelector('#a11y-analyzer-panel .a11y-card-body');
        return body ? getComputedStyle(body).display : 'NOT_FOUND';
      });
      if (bodyAfter !== 'block') {
        fail(`Contrast card expand failed: expected 'block', got '${bodyAfter}'`);
      }
      log(`Card body after expand: display=${bodyAfter} ✓`);
    }

    console.log('\n✅ All card expand/collapse tests passed!\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run();
