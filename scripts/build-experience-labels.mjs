// Generates api/_lib/experience-labels.generated.js — the SERVER-side map the
// itinerary planner (api/schedule.js) uses to turn funnel codes into a
// human-readable traveler brief.
//
// Single source of truth: this is derived from the SAME literals the funnel
// renders (CULTURE_PAGES in js/step3-culture.jsx, plus ALLERGENS/DIETS in
// js/step4-cuisine.jsx). If a funnel option is added/renamed, this map updates
// on the next `npm run build` — funnel / brief / prompt can never drift.
//
// Emits three maps:
//   EXPERIENCE_LABELS: code -> { name, group, region, meta }
//       group  = the CULTURE_PAGES page label (Heritage / Shop / Famous / Beyond Seoul)
//       region = 'seoul' | 'beyond_seoul'  (jeju/busan/gyeongju/jeonju/gangwon/incheon = beyond_seoul)
//       meta   = the funnel's duration/intensity tag verbatim (e.g. "Full day · 18 holes",
//                "3 hours · with snacks") so the brief can tell the planner how long each
//                experience takes and how heavy it is. Drives the no-overload pacing rules.
//   ALLERGEN_LABELS: code -> name   (cuisine.allergens / comfort.food allergen codes)
//   DIET_LABELS:     code -> name   (cuisine.diets / comfort.food diet/religion codes)
//   CUISINE_LABELS:  code -> name   (cuisine.items dish/drink codes, all FB_PAGES)
//
// Run by `npm run build` (before the prompt + esbuild steps).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'js');

// ── Extract a top-level literal by name from a JSX source string. ──────────
// (Same brace-walking extractor used by build-experience-data.mjs — these
// literals are pure data, so a `new Function` eval is safe and faithful.)
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

const CULTURE_PAGES = evalLiteral(sliceLiteral(cultureSrc, 'CULTURE_PAGES'), 'CULTURE_PAGES');
const FB_PAGES      = evalLiteral(sliceLiteral(cuisineSrc, 'FB_PAGES'),      'FB_PAGES');
const ALLERGENS     = evalLiteral(sliceLiteral(cuisineSrc, 'ALLERGENS'),     'ALLERGENS');
const DIETS         = evalLiteral(sliceLiteral(cuisineSrc, 'DIETS'),         'DIETS');

if (!Array.isArray(CULTURE_PAGES) || !CULTURE_PAGES.length) throw new Error('CULTURE_PAGES shape unexpected');

// The six far destinations that are NOT Seoul day trips — real excursions.
const BEYOND_SEOUL_CODES = new Set(['jeju', 'busan', 'gyeongju', 'jeonju', 'gangwon', 'incheon']);

// Build code -> { name, group, region } across EVERY page, including `beyond`.
const EXPERIENCE_LABELS = {};
let total = 0;
let beyondCount = 0;
for (const page of CULTURE_PAGES) {
  const group = page.label || page.id;
  for (const item of (page.items || [])) {
    if (!item || !item.code) continue;
    const region = BEYOND_SEOUL_CODES.has(item.code) ? 'beyond_seoul' : 'seoul';
    if (region === 'beyond_seoul') beyondCount++;
    EXPERIENCE_LABELS[item.code] = {
      name: item.name || item.code,
      group,
      region,
      // Duration/intensity tag from the funnel card (may be empty for Beyond-Seoul
      // destinations, which carry their own travel/overnight shape in the prompt).
      meta: (item.meta || '').trim(),
    };
    total++;
  }
}

// Sanity: every beyond_seoul code must have been found in the source.
const missingBeyond = [...BEYOND_SEOUL_CODES].filter((c) => !EXPERIENCE_LABELS[c]);
if (missingBeyond.length) {
  throw new Error('beyond_seoul codes missing from CULTURE_PAGES: ' + missingBeyond.join(', '));
}

const ALLERGEN_LABELS = Object.fromEntries(ALLERGENS.map((a) => [a.code, a.name]));
const DIET_LABELS     = Object.fromEntries(DIETS.map((d) => [d.code, d.name]));

// Cuisine dish/drink code -> name, across EVERY FB_PAGES page (Hansik / Street /
// Grill / Drinks). Drives the cuisine.items section of the traveler brief so the
// planner places the exact dishes the traveler chose into real meal slots.
if (!Array.isArray(FB_PAGES) || !FB_PAGES.length) throw new Error('FB_PAGES shape unexpected');
const CUISINE_LABELS = {};
let cuisineTotal = 0;
for (const page of FB_PAGES) {
  for (const item of (page.items || [])) {
    if (!item || !item.code) continue;
    CUISINE_LABELS[item.code] = item.name || item.code;
    cuisineTotal++;
  }
}

const header =
  '// AUTO-GENERATED by scripts/build-experience-labels.mjs from\n' +
  '// js/step3-culture.jsx (CULTURE_PAGES) + js/step4-cuisine.jsx (ALLERGENS/DIETS).\n' +
  '// Do not edit by hand — regenerate with `npm run build`. Server-only: imported\n' +
  '// by api/schedule.js to translate funnel codes into a human-readable brief.\n' +
  `// Experiences: ${total} total (${beyondCount} beyond-Seoul).\n`;

const body =
  'export const EXPERIENCE_LABELS = ' + JSON.stringify(EXPERIENCE_LABELS, null, 2) + ';\n\n' +
  'export const ALLERGEN_LABELS = ' + JSON.stringify(ALLERGEN_LABELS, null, 2) + ';\n\n' +
  'export const DIET_LABELS = ' + JSON.stringify(DIET_LABELS, null, 2) + ';\n\n' +
  'export const CUISINE_LABELS = ' + JSON.stringify(CUISINE_LABELS, null, 2) + ';\n';

mkdirSync(join(ROOT, 'api', '_lib'), { recursive: true });
writeFileSync(join(ROOT, 'api', '_lib', 'experience-labels.generated.js'), header + body);

console.log(
  'experience-labels: ' + total + ' experiences (' + beyondCount + ' beyond-Seoul), ' +
  Object.keys(ALLERGEN_LABELS).length + ' allergens, ' +
  Object.keys(DIET_LABELS).length + ' diets, ' +
  cuisineTotal + ' cuisine dishes'
);
