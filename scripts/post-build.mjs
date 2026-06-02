// post-build · run after `esbuild` to stamp every HTML script reference
// with a content hash. We don't rename the output files — instead we
// append a `?v=<hash>` query string so the URL invalidates whenever the
// JS content changes. Combined with `Cache-Control: max-age=31536000,
// immutable` on /js/*.js, the browser caches forever and a new hash
// forces a fresh fetch.
//
// HTML stays cached briefly (max-age=300) so users pick up the new hash
// within minutes of a deploy.
//
// Source HTML may reference `js/foo.js`, `js/foo.js?v=DEV`, or any
// previously-stamped value — the regex tolerates all three.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = resolve(__dirname, '..');
const JS_DIR   = resolve(ROOT, 'js');

// Esbuild outputs — only these are content-hashed.
const HASHED_BASENAMES = [
  'step1-trip-shared.js',
  'step1-trip-v1.js',
  'step2-medical.js',
  'step3-culture.js',
  'step4-cuisine.js',
  'me-itineraries.js',
  'me-status.js',
  'me-profile.js',
  'me-settings.js',
  'me-overview.js',
];

// 1. Compute SHA-256 short hash (8 chars) of each built JS file.
const hashes = {};
for (const name of HASHED_BASENAMES) {
  const path = resolve(JS_DIR, name);
  if (!existsSync(path)) {
    console.warn(`  ⚠ ${name} not found in js/ — skipping`);
    continue;
  }
  const content = readFileSync(path);
  hashes[name] = createHash('sha256').update(content).digest('hex').slice(0, 8);
}

// 2. Rewrite each HTML's script-src query strings.
let updatedCount = 0;
for (const file of readdirSync(ROOT)) {
  if (!file.endsWith('.html')) continue;
  const path = resolve(ROOT, file);
  let html = readFileSync(path, 'utf8');
  let touched = false;

  for (const [basename, hash] of Object.entries(hashes)) {
    const escapedName = basename.replace(/\./g, '\\.');
    // Match `js/<name>` optionally followed by `?v=<anything-up-to-quote-or-space>`
    const regex   = new RegExp(`js/${escapedName}(\\?v=[^"'\\s]*)?`, 'g');
    const target  = `js/${basename}?v=${hash}`;
    const updated = html.replace(regex, target);
    if (updated !== html) { html = updated; touched = true; }
  }

  if (touched) {
    writeFileSync(path, html);
    console.log(`  ✎ ${file}`);
    updatedCount++;
  }
}

console.log(`post-build: stamped ${updatedCount} HTML file(s) with ${Object.keys(hashes).length} hash(es)`);
