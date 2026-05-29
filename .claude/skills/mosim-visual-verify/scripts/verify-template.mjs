// mosim-site visual verification template.
// Copy to /tmp/verify-x.mjs, edit BASE/checks, run: node /tmp/verify-x.mjs
// Requires a local server already running (python3 -m http.server <port>  OR  vercel dev).
import pw from '/Users/robodash/Desktop/Mosim/mosim-site/node_modules/playwright-core/index.js';
const { chromium } = pw;
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:8123';      // <-- set to your server
const SHOT = '/tmp/mosim-verify-shots';
mkdirSync(SHOT, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch();
const errs = [];

async function view(width, height, label, fn) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errs.push(`[${label}] ${m.text()}`); });
  page.on('pageerror', e => errs.push(`[${label}] PAGEERROR: ${e.message}`));
  await fn(page);
  await ctx.close();
}

// ---- Desktop ----
await view(1280, 900, 'desktop', async (page) => {
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // EXAMPLE checks — replace with the change under test:
  check('landing renders', (await page.locator('nav.top').count()) > 0);
  // lazy image: scroll into view BEFORE checking naturalWidth
  // const img = page.locator('#about .about-photo img');
  // await img.scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
  // check('photo loaded', await page.evaluate(() => { const i=document.querySelector('#about img'); return !!(i&&i.complete&&i.naturalWidth>0); }));
  await page.screenshot({ path: SHOT + '/desktop.png' });
});

// ---- Mobile ----
await view(390, 844, 'mobile', async (page) => {
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT + '/mobile.png', fullPage: true });
});

console.log('\n=== console errors (note: /api/config 404 on static server is expected noise) ===');
console.log(errs.length ? [...new Set(errs)].join('\n') : '(none)');
const passed = results.filter(r => r.pass).length;
console.log(`\n=== ${passed}/${results.length} passed ===  screenshots in ${SHOT}`);
await browser.close();
process.exit(passed === results.length ? 0 : 1);
