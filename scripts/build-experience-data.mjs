// Generates js/experience-data.js — the data the public experience.html
// showcase renders. We DON'T hand-copy ~100 cards: instead we read the
// funnel's source JSX (js/step3-culture.jsx, js/step4-cuisine.jsx), slice out
// the pure-data object/array literals, evaluate them in a sandbox, join each
// card with its drawer detail, and emit window.EXPERIENCE_DATA.
//
// The four literals we pull (CULTURE_PAGES, CULTURE_DETAILS, FB_PAGES,
// CUISINE_DETAILS) are pure data — no React refs inside — so a `new Function`
// eval is safe and faithful.
//
// Run by `npm run build` (before post-build). The output js/experience-data.js
// is COMMITTED (not gitignored): experience.html is plain static HTML with no
// bundler, so it must load the file at runtime on the static host. Vercel also
// re-runs `npm run build` on deploy, so the committed file and the built file
// stay identical (the generator is deterministic).
//
// Counts emitted (asserted at the end): Heritage 18 · Famous 16 · Shop 16 ·
// Cuisine 56 (only the cuisine cards that have a CUISINE_DETAILS entry).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'js');

// ── Extract a top-level literal by name from a JSX source string. ──────────
// We find `const <NAME> = ` then walk the braces/brackets to the matching
// close, respecting strings (single/double/backtick) and escapes. Returns the
// literal text (including the opening { or [), ready for `new Function`.
function sliceLiteral(src, name) {
  const decl = new RegExp('const\\s+' + name + '\\s*=\\s*');
  const m = decl.exec(src);
  if (!m) throw new Error('literal not found: ' + name);
  let i = m.index + m[0].length;
  const open = src[i];
  if (open !== '{' && open !== '[') {
    throw new Error(name + ' does not start with { or [ (got "' + open + '")');
  }
  const close = open === '{' ? '}' : ']';
  let depth = 0, quote = null, start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

function evalLiteral(text, label) {
  try {
    return new Function('return (' + text + ')')();
  } catch (e) {
    throw new Error('failed to eval literal ' + label + ': ' + e.message);
  }
}

const cultureSrc = readFileSync(join(JS, 'step3-culture.jsx'), 'utf8');
const cuisineSrc = readFileSync(join(JS, 'step4-cuisine.jsx'), 'utf8');

const CULTURE_PAGES   = evalLiteral(sliceLiteral(cultureSrc, 'CULTURE_PAGES'),   'CULTURE_PAGES');
const CULTURE_DETAILS = evalLiteral(sliceLiteral(cultureSrc, 'CULTURE_DETAILS'), 'CULTURE_DETAILS');
const FB_PAGES        = evalLiteral(sliceLiteral(cuisineSrc, 'FB_PAGES'),        'FB_PAGES');
const CUISINE_DETAILS = evalLiteral(sliceLiteral(cuisineSrc, 'CUISINE_DETAILS'), 'CUISINE_DETAILS');
const ALLERGENS       = evalLiteral(sliceLiteral(cuisineSrc, 'ALLERGENS'),       'ALLERGENS');
const DIETS           = evalLiteral(sliceLiteral(cuisineSrc, 'DIETS'),           'DIETS');

// Shape sanity checks.
if (!Array.isArray(CULTURE_PAGES) || !CULTURE_PAGES[0]?.items) throw new Error('CULTURE_PAGES shape unexpected');
if (typeof CULTURE_DETAILS !== 'object') throw new Error('CULTURE_DETAILS shape unexpected');
if (!Array.isArray(FB_PAGES) || !FB_PAGES[0]?.items) throw new Error('FB_PAGES shape unexpected');
if (typeof CUISINE_DETAILS !== 'object') throw new Error('CUISINE_DETAILS shape unexpected');

const ALLERGEN_NAME = Object.fromEntries(ALLERGENS.map(a => [a.code, a.name]));
const DIET_NAME     = Object.fromEntries(DIETS.map(d => [d.code, d.name]));

// /assets/culture-heritage/x.webp -> culture-heritage
function folderOf(image) {
  const m = /\/assets\/([^/]+)\//.exec(image || '');
  return m ? m[1] : '';
}

// Culture facts are {label,value} -> [label,value]. Drawer renders f[0]/f[1].
function factPairs(facts) {
  return (facts || []).map(f => [f.label, f.value]);
}

// Build one culture sector (heritage / famous / shop) from its page.
function cultureSector(pageId) {
  const page = CULTURE_PAGES.find(p => p.id === pageId);
  if (!page) throw new Error('culture page not found: ' + pageId);
  const out = [];
  for (const item of page.items) {
    const d = CULTURE_DETAILS[item.code];
    if (!d) {
      droppedCulture.push(pageId + '/' + item.code + ' (no CULTURE_DETAILS)');
      continue;
    }
    out.push({
      code: item.code,
      name: item.name,
      eyebrow: item.eyebrow,
      meta: item.meta,
      image: item.image,
      folder: folderOf(item.image),
      gallery: d.photos || (d.photo ? [d.photo] : undefined),
      heroEyebrow: d.hero?.eyebrow || '',
      tagline: d.hero?.tagline || '',
      facts: factPairs(d.facts),
      yt: d.youtubeId,
      vtitle: d.videoTitle,
    });
  }
  return out;
}

// Cuisine sector: ALL cards across FB_PAGES that have a CUISINE_DETAILS entry.
function cuisineSector() {
  const out = [];
  for (const page of FB_PAGES) {
    for (const item of page.items) {
      const d = CUISINE_DETAILS[item.code];
      if (!d) {
        droppedCuisine.push(page.id + '/' + item.code + ' (no CUISINE_DETAILS)');
        continue;
      }
      const card = {
        code: item.code,
        name: item.name,
        eyebrow: item.eyebrow,
        meta: item.meta,
        image: item.image,
        folder: folderOf(item.image),
        gallery: d.photos || (d.photo ? [d.photo] : undefined),
        heroEyebrow: d.hero?.eyebrow || '',
        tagline: d.hero?.tagline || '',
        facts: factPairs(d.facts),
        yt: d.youtubeId,
        vtitle: d.videoTitle,
      };
      // Cuisine drawer's Diet & spice block. Source `dietary` has
      // contains[]/suitable[] as codes (+ spice number, notes string). The
      // experience drawer expects diet.contains as a STRING and diet.suitable
      // as an array of human labels, plus diet.spice and diet.notes.
      const dt = d.dietary;
      if (dt) {
        card.diet = {
          spice: typeof dt.spice === 'number' ? dt.spice : 0,
          contains: (dt.contains || []).map(c => ALLERGEN_NAME[c] || c).join(' · ') || 'None',
          suitable: (dt.suitable || []).map(s => DIET_NAME[s] || s),
          notes: dt.notes || '',
        };
      }
      out.push(card);
    }
  }
  return out;
}

const droppedCulture = [];
const droppedCuisine = [];

const DATA = {
  Heritage: cultureSector('heritage'),
  Famous:   cultureSector('famous'),
  Shop:     cultureSector('shop'),
  Cuisine:  cuisineSector(),
};

// Assert expected counts so a source change that silently drops cards is caught.
const EXPECT = { Heritage: 18, Famous: 16, Shop: 16, Cuisine: 56 };
const counts = Object.fromEntries(Object.entries(DATA).map(([k, v]) => [k, v.length]));
let mismatch = false;
for (const [k, n] of Object.entries(EXPECT)) {
  if (counts[k] !== n) { mismatch = true; console.warn(`  ⚠ ${k}: expected ${n}, got ${counts[k]}`); }
}

const header =
  '// AUTO-GENERATED by scripts/build-experience-data.mjs from\n' +
  '// js/step3-culture.jsx + js/step4-cuisine.jsx — do not edit by hand.\n' +
  '// Regenerate with `npm run build`. Committed so the static experience.html\n' +
  `// can load it at runtime. Counts: Heritage ${counts.Heritage} · Famous ${counts.Famous} · Shop ${counts.Shop} · Cuisine ${counts.Cuisine}.\n`;

const out = header + 'window.EXPERIENCE_DATA = ' + JSON.stringify(DATA, null, 2) + ';\n';
writeFileSync(join(JS, 'experience-data.js'), out);

console.log(
  'experience-data: Heritage ' + counts.Heritage +
  ' · Famous ' + counts.Famous +
  ' · Shop ' + counts.Shop +
  ' · Cuisine ' + counts.Cuisine +
  ' (' + out.length + ' bytes)'
);
if (droppedCulture.length) console.log('  dropped (culture): ' + droppedCulture.join(', '));
if (droppedCuisine.length) console.log('  dropped (cuisine, no detail): ' + droppedCuisine.length + ' cards');
if (mismatch) { console.error('  ✗ count mismatch — see warnings above'); process.exit(1); }
