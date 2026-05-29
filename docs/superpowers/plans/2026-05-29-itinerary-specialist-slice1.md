# Itinerary Specialist (Slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded demo itinerary on result.html with a real, variable-length, AI-generated plan (Claude Sonnet) that fills the existing rich senior-friendly cards, with a template fallback so the customer never sees a broken page.

**Architecture:** `result.html` calls `kwSchedule.generate(state)` (now async) → POST `/api/schedule` (existing serverless fn, evolved) → Claude composes an *enriched* day-by-day plan of exactly N days (N derived from the funnel trip dates). result.html renders day-cards, the calendar grid, and the cost estimate from that data. Any failure falls back to an upgraded local template. A `gatherContributions()` seam and an empty `places` table are added so future F&B/culture specialists plug in without a rewrite.

**Tech Stack:** Vercel serverless (ESM, `@anthropic-ai/sdk`), Supabase, vanilla browser JS (IIFE in `js/schedule.js`, inline `<script>` in result.html), `node --test` for pure-function unit tests.

**Reference spec:** `docs/superpowers/specs/2026-05-29-itinerary-specialist-design.md`

**Enriched output contract (used by every task):**
```
days: [ {
  day:   number,
  type:  'medical'|'culture'|'cuisine'|'rest'|'travel'|'mixed',
  title: string,
  items: [ { time: string, type: 'medical'|'culture'|'cuisine'|'rest'|'travel',
             name: string, desc: string, tip?: string } ]
} ]
```

---

## Phase A — Backend: variable length + enriched output

### Task A1: Pure trip-length function (TDD)

**Files:**
- Create: `api/_lib/trip-length.js`
- Test: `test/trip-length.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// test/trip-length.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tripDayCount } from '../api/_lib/trip-length.js';

test('specific dates: nights + 1', () => {
  assert.equal(tripDayCount({ trip: { nights: 6 } }), 7);
  assert.equal(tripDayCount({ trip: { nights: 9 } }), 10);
});

test('flexible / missing → default 7', () => {
  assert.equal(tripDayCount({ trip: { dateMode: 'flexible', nights: 0 } }), 7);
  assert.equal(tripDayCount({}), 7);
  assert.equal(tripDayCount(null), 7);
});

test('derives span from start/end when nights absent', () => {
  assert.equal(tripDayCount({ trip: { startDate: '2026-5-1', endDate: '2026-5-8' } }), 8);
});

test('clamps to [3, 21]', () => {
  assert.equal(tripDayCount({ trip: { nights: 1 } }), 3);   // 2 → 3
  assert.equal(tripDayCount({ trip: { nights: 40 } }), 21); // 41 → 21
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/trip-length.test.mjs`
Expected: FAIL — cannot find module `../api/_lib/trip-length.js`.

- [ ] **Step 3: Write minimal implementation**

```js
// api/_lib/trip-length.js
// Pure: derive the number of itinerary days from funnel trip state.
// No I/O — unit tested in test/trip-length.test.mjs.

const MIN_DAYS = 3;
const MAX_DAYS = 21;
const DEFAULT_DAYS = 7; // flexible / unknown dates

export function tripDayCount(state) {
  const trip = (state && state.trip) || {};
  const nights = Number(trip.nights);
  if (Number.isFinite(nights) && nights > 0) {
    return clamp(Math.round(nights) + 1);
  }
  const span = daySpan(trip.startDate, trip.endDate);
  if (span > 0) return clamp(span + 1);
  return DEFAULT_DAYS;
}

function daySpan(start, end) {
  const a = parseYmd(start);
  const b = parseYmd(end);
  if (a == null || b == null) return 0;
  const ms = b - a;
  return ms > 0 ? Math.round(ms / 86400000) : 0;
}

function parseYmd(s) {
  if (typeof s !== 'string') return null;
  const p = s.split('-').map(Number);
  if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) return null;
  return Date.UTC(p[0], p[1] - 1, p[2]);
}

function clamp(n) {
  return Math.max(MIN_DAYS, Math.min(MAX_DAYS, n));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/trip-length.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/trip-length.js test/trip-length.test.mjs
git commit -m "feat(api): pure tripDayCount for variable itinerary length"
```

---

### Task A2: Evolve `api/schedule.js` — model env var, variable length, enriched schema, seam

**Files:**
- Modify: `api/schedule.js`

- [ ] **Step 1: Add import + model env var**

At the top of the file, replace:
```js
const MODEL = 'claude-sonnet-4-6';
```
with:
```js
import { tripDayCount } from './_lib/trip-length.js';

const MODEL = process.env.SCHEDULE_MODEL || 'claude-sonnet-4-6';
```
(keep the existing `import Anthropic` line above it.)

- [ ] **Step 2: Replace the SYSTEM_PROMPT** with a length-agnostic, enriched-output version

Replace the entire `const SYSTEM_PROMPT = \`...\`;` block with:

```js
const SYSTEM_PROMPT = `You are the AI itinerary specialist for Mosim, a high-end Korean medical-wellness tourism service for senior international guests (mostly 55-80, often traveling with adult children). You compose a personalized, paced day-by-day itinerary in Korea — Seoul-centered with select day trips — from the guest's intake selections.

# Input
The user message states the exact number of days to produce, then gives a JSON object with up to five sections:
- contact: { name, email, from, when, interest, note }
- trip: dates, party composition, hotel tier, party type, travel class
- medical / culture / cuisine: selected codes (mapped below); cuisine also has allergens, diets, spice

Any section may be missing or partial. Be resilient.

# Selection code → activity (label maps)
Medical/wellness: dermatology→Skin conditioning & IV nutrient drip · aesthetic→Aesthetic procedure consultation · oriental→Hanbang pulse reading & herbal prescription · wellness→Wellness restoration program · checkup→Comprehensive health screening · spa→Premium spa treatment · mental→Meditation & mental restoration
Culture: heritage→Gyeongbokgung/Changdeokgung hanbok walk · crafts→Traditional craft class (hanji/ceramics) · modern→Han River night view & K-pop live · tea→Traditional tea ceremony · temple→Templestay (one night) · royal→Royal court ritual viewing · performance→Nanta/Jeongdong Theatre
Cuisine: hansik→Royal-court hanjeongsik · street→Gwangjang Market night-food tour · grill→Premium hanwoo omakase · finedining→Michelin-starred Korean fine dining · drinks→Traditional liquor & yakju pairing · packages→Curated dining package

# Planning rules
1. Produce EXACTLY the number of days requested. Day 1 is arrival logistics; the final day is departure logistics with no medical procedures.
2. Personalize: incorporate every selected item somewhere if reasonable; do not silently drop choices.
3. Honor the note field (mobility, language, low energy, allergies, religion, children).
4. Pace for seniors: at most two demanding activities per day, rest gaps, no back-to-back early mornings. Insert dedicated rest days on longer trips.
5. Respect allergens/diets; if diets include vegetarian or halal, adjust cuisine. Spice: if mild/unset avoid signature spicy dishes; if spicy, highlight them.
6. Vary cuisine across the week; do not repeat a dining style on consecutive days.
7. Be concrete: name plausible real Seoul venues/neighborhoods (no exact addresses needed).
8. Each day has a clear theme reflected in its title and 'type'.

# Output — return ONLY a JSON object of this exact shape:
{ "days": [ {
    "day": <integer, 1-based, in order>,
    "type": "medical|culture|cuisine|rest|travel|mixed",
    "title": "<e.g. 'Day 3 — Gyeongbokgung & Bukchon', max 60 chars>",
    "items": [ {
      "time": "<'09:00' | 'Morning' | 'All day'>",
      "type": "medical|culture|cuisine|rest|travel",
      "name": "<venue or activity, max 50 chars>",
      "desc": "<one-line detail, max 90 chars>",
      "tip": "<optional senior/accessibility note>"
    } ]
} ] }

- 3 to 5 items per day. 'type' on each item drives a color dot; 'type' on the day drives the card color (use 'mixed' when a day blends medical with leisure, 'travel' for arrival/departure/day-trips, 'rest' for recovery days).
- All output in English. No markdown, prose, emojis, or fields other than those shown.

# Tone
Writing for a concierge to read aloud: calm, precise, dignified. Avoid superlatives and filler. Each line reads as an instruction or a venue.`;
```

- [ ] **Step 3: Replace SCHEDULE_SCHEMA** with the enriched schema

Replace the entire `const SCHEDULE_SCHEMA = {...};` block with:

```js
const DAY_TYPES = ['medical', 'culture', 'cuisine', 'rest', 'travel', 'mixed'];
const SLOT_TYPES = ['medical', 'culture', 'cuisine', 'rest', 'travel'];

const SCHEDULE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'type', 'title', 'items'],
        properties: {
          day: { type: 'integer' },
          type: { type: 'string', enum: DAY_TYPES },
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['time', 'type', 'name', 'desc'],
              properties: {
                time: { type: 'string' },
                type: { type: 'string', enum: SLOT_TYPES },
                name: { type: 'string' },
                desc: { type: 'string' },
                tip: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};
```

- [ ] **Step 4: Add the collaboration seam** — insert this function just above `export default async function handler`:

```js
// Collaboration seam (Slice 1: no separate specialists yet).
// Future food/culture/medical specialists each return a Contribution:
//   { specialist, items: [{ category, label, fitsWhen?, constraints?, placeRef?, rationale?, priority? }] }
// The composer (the Claude call below) weaves them into the day-by-day plan.
async function gatherContributions(_state) {
  return []; // none yet — composer generates from its own knowledge
}
```

- [ ] **Step 5: Wire length + contributions into the user message**

Inside `handler`, after `const userJson = JSON.stringify(state);` and the size guard, replace the `client.messages.create({...})` `messages` field. Specifically, before the `try {`, add:

```js
  const days = tripDayCount(state);
  const contributions = await gatherContributions(state);
  const userContent =
    `Produce EXACTLY ${days} day(s), numbered 1..${days}. ` +
    `Day 1 is arrival; day ${days} is departure.\n` +
    (contributions.length
      ? `Specialist contributions to incorporate:\n${JSON.stringify(contributions)}\n`
      : '') +
    `Guest selections (JSON):\n${userJson}`;
```

Then change the `messages` array in `client.messages.create` from:
```js
      messages: [
        { role: 'user', content: 'Guest selections (JSON):\n' + userJson }
      ]
```
to:
```js
      messages: [
        { role: 'user', content: userContent }
      ]
```
(Leave `system` with its `cache_control` unchanged — the variable day count lives in the user message, so the cached system prompt stays identical across trip lengths.)

- [ ] **Step 6: Run the unit tests (nothing should break)**

Run: `npm test`
Expected: PASS (existing `amount` tests + the new `trip-length` tests). `api/schedule.js` has no unit test; it is verified end-to-end in Phase E.

- [ ] **Step 7: Commit**

```bash
git add api/schedule.js
git commit -m "feat(api): variable-length + enriched itinerary, SCHEDULE_MODEL env, contributions seam"
```

---

## Phase B — Client: async generate + fallback + enriched template

### Task B1: Rewrite `js/schedule.js` to call the API with a template fallback

**Files:**
- Modify: `js/schedule.js`

- [ ] **Step 1: Replace the whole IIFE body** with an async generator + an enriched, variable-length template fallback.

Replace the entire file with:

```js
/*
 * Mosim — itinerary generator (client entry point).
 *
 * kwSchedule.generate(state) is now ASYNC: it POSTs to /api/schedule and
 * returns the AI-composed plan. On ANY failure it returns a deterministic
 * local template so the result page never breaks. Output shape (enriched):
 *   { ...metadata, days: [{ day, type, title, items:[{time,type,name,desc,tip?}] }] }
 */
(function (global) {
  'use strict';

  var MED_LABELS = {
    dermatology: 'Skin conditioning & IV nutrient drip',
    aesthetic: 'Aesthetic procedure consultation',
    oriental: 'Hanbang pulse reading & prescription',
    wellness: 'Wellness restoration program',
    checkup: 'Comprehensive health screening',
    spa: 'Premium spa treatment',
    mental: 'Meditation & mental restoration'
  };
  var CULTURE_LABELS = {
    heritage: 'Gyeongbokgung / Changdeokgung hanbok walk',
    crafts: 'Traditional craft class (hanji · ceramics)',
    modern: 'Han River night view & K-pop live',
    tea: 'Traditional tea ceremony',
    temple: 'Templestay (one night)',
    royal: 'Royal court ritual viewing',
    performance: 'Nanta / Jeongdong Theatre performance'
  };
  var CUISINE_LABELS = {
    hansik: 'Royal-court hanjeongsik tasting (Seoul)',
    street: 'Gwangjang Market night-food tour',
    grill: 'Premium hanwoo omakase',
    finedining: 'Michelin-starred Korean fine dining',
    drinks: 'Traditional liquor & yakju pairing',
    packages: 'Curated dining package'
  };

  // ── Public async entry point ───────────────────────────────────
  async function generateSchedule(state) {
    state = state || {};
    try {
      var res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (!res.ok) throw new Error('api ' + res.status);
      var body = await res.json();
      if (!body || !body.schedule || !Array.isArray(body.schedule.days) || !body.schedule.days.length) {
        throw new Error('bad shape');
      }
      return body.schedule;
    } catch (e) {
      console.warn('[kwSchedule] AI path failed, using template:', e && e.message);
      return generateScheduleTemplate(state);
    }
  }

  // ── Deterministic fallback (enriched shape, variable length) ───
  function generateScheduleTemplate(state) {
    state = state || {};
    var contact = state.contact || {};
    var trip = state.trip || {};
    var cuisine = state.cuisine || {};

    var n = clientDayCount(state);
    var med = collect(state.medical, MED_LABELS);
    var cul = collect(state.culture, CULTURE_LABELS, ['Gyeongbokgung hanbok walk', 'Bukchon Hanok Village']);
    var cui = collect(state.cuisine, CUISINE_LABELS, ['Royal-court hanjeongsik', 'Gwangjang Market food tour'], ['allergens', 'diets', 'spice']);

    var days = [];
    for (var i = 1; i <= n; i++) days.push(buildDay(i, n, med, cul, cui, trip));

    return {
      guestName: contact.name ? String(contact.name).split(' ')[0] : 'Guest',
      arrival: trip.dates || contact.when || 'TBD',
      hotel: trip['hotel-tier'] || trip.hotel || 'Heritage hanok',
      origin: trip.origin || contact.from || '',
      interest: contact.interest || '',
      note: contact.note || trip.note || '',
      adults: trip.adults || '',
      children: trip.children || '',
      partyType: trip.partyType || trip['party-type'] || '',
      travelClass: trip['travel-class'] || '',
      hotelTier: trip['hotel-tier'] || '',
      medicalSelections: med,
      cultureSelections: cul,
      cuisineSelections: cui,
      allergens: arrayify(cuisine.allergens),
      diets: arrayify(cuisine.diets),
      spice: cuisine.spice || '',
      days: days
    };
  }

  function buildDay(i, n, med, cul, cui, trip) {
    var hotel = trip['hotel-tier'] || trip.hotel || 'the hotel';
    if (i === 1) {
      return day(i, 'travel', 'Arrival & Welcome', [
        slot('14:00', 'travel', 'Incheon Airport pickup', 'Private vehicle to ' + hotel + '.', 'Wheelchair-accessible vehicle on request'),
        slot('16:00', 'rest', 'Check-in & welcome tea', 'Settle in; light orientation.'),
        slot('19:00', 'cuisine', cui[0] || 'Welcome dinner', 'Mild Korean course to start.')
      ]);
    }
    if (i === n) {
      return day(i, 'travel', 'Closing & Departure', [
        slot('10:00', 'rest', 'Closing consultation', 'Aftercare plan handoff.'),
        slot('12:00', 'rest', 'Hotel checkout', 'Concierge assists with luggage.'),
        slot('14:00', 'travel', 'Send-off to Incheon Airport', 'Private vehicle.', 'Allow 3 hours before flight')
      ]);
    }
    var cycle = (i - 2) % 3;
    if (cycle === 0 && med.length) {
      return day(i, 'medical', 'Diagnostics & Consultation', [
        slot('09:00', 'medical', med[0] || 'Physician consultation', 'Lead physician; constitution review.', 'Fast from midnight if bloodwork'),
        slot('13:00', 'cuisine', cui[1] || 'Restorative lunch', 'Light, balanced.'),
        slot('16:00', 'rest', 'Rest at hotel', 'Free evening.')
      ]);
    }
    if (cycle === 1) {
      return day(i, 'culture', 'Cultural Immersion', [
        slot('10:00', 'culture', cul[0] || 'Gyeongbokgung hanbok walk', 'Private guide; flat route.'),
        slot('13:00', 'cuisine', cui[(i % cui.length)] || 'Local lunch', 'Neighborhood specialty.'),
        slot('15:30', 'culture', cul[1] || 'Bukchon Hanok Village', 'Gentle pace.')
      ]);
    }
    return day(i, 'rest', 'Restoration & Wellness', [
      slot('10:00', 'rest', med[1] || 'Premium spa treatment', 'Recovery and relaxation.'),
      slot('15:00', 'culture', 'Han River garden stroll', 'Light walk and meditation.'),
      slot('19:00', 'cuisine', cui[(i + 1) % Math.max(1, cui.length)] || 'In-room dining', 'Restorative menu.')
    ]);
  }

  // ── helpers ────────────────────────────────────────────────────
  function day(d, type, title, items) {
    return { day: d, type: type, title: 'Day ' + d + ' — ' + title, items: items };
  }
  function slot(time, type, name, desc, tip) {
    var s = { time: time, type: type, name: name, desc: desc || '' };
    if (tip) s.tip = tip;
    return s;
  }
  function clientDayCount(state) {
    var trip = (state && state.trip) || {};
    var nights = Number(trip.nights);
    if (isFinite(nights) && nights > 0) return clamp(Math.round(nights) + 1);
    return 7;
  }
  function clamp(x) { return Math.max(3, Math.min(21, x)); }
  function collect(stepData, labels, fallback, skip) {
    fallback = fallback || [];
    skip = skip || [];
    if (!stepData || typeof stepData !== 'object') return fallback.slice();
    var out = [];
    Object.keys(stepData).forEach(function (k) {
      if (skip.indexOf(k) !== -1) return;
      var v = stepData[k];
      if (Array.isArray(v)) v.forEach(function (x) { out.push(labels[x] || prettify(x)); });
      else if (typeof v === 'string' && v) out.push(labels[v] || prettify(v));
    });
    return out.length ? out : fallback.slice();
  }
  function arrayify(v) { return !v ? [] : (Array.isArray(v) ? v : [v]); }
  function prettify(s) {
    return !s ? '' : String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  global.kwSchedule = { generate: generateSchedule, template: generateScheduleTemplate };
})(window);
```

- [ ] **Step 2: Update the save path in result.html to await generate**

In `result.html`, in `doSave()` (around line 752), change:
```js
    const schedule = (window.kwSchedule && window.kwSchedule.generate) ? window.kwSchedule.generate(state) : { days: [] };
```
to:
```js
    const schedule = (window.kwSchedule && window.kwSchedule.generate) ? await window.kwSchedule.generate(state) : { days: [] };
```
(`doSave` is already `async`, so `await` is valid.)

- [ ] **Step 3: Commit**

```bash
git add js/schedule.js result.html
git commit -m "feat(client): async kwSchedule.generate with enriched template fallback"
```

---

## Phase C — result.html: data-driven cards, calendar, cost

> These tasks are UI; they are verified in a browser in Phase E, not by unit tests. After Phase C, run a quick local check (Task E1) before considering them done.

### Task C1: Render day-cards and the detail panel from `schedule.days`

**Files:**
- Modify: `result.html` (replace the hardcoded `DAYS` object and `buildSched`/`openDet`)

- [ ] **Step 1: Confirm the color map exists.** Search result.html for `var COL` / `COL=`. If `COL` is **not** defined, add this near the top of the first inline `<script>` (line ~470):

```js
var COL = { medical:'#B21464', culture:'#30b87a', cuisine:'#f07020', rest:'#c0c0c0', travel:'#9060d0' };
```

- [ ] **Step 2: Add a module-level holder + replace `buildSched()` with `renderDayCards()`.**

Replace the entire `function buildSched(){ ... }` (lines ~563-587) with:

```js
var SCHED = null;

function renderDayCards(sched){
  var el = document.getElementById('schedList');
  var themeMap = { medical:'Medical day', culture:'Culture day', cuisine:'Dining day', rest:'Rest day', travel:'Travel', mixed:'Medical +' };
  el.innerHTML = sched.days.map(function(info, i){
    var med = (info.type === 'medical' || info.type === 'mixed');
    var slots = (info.items || []).map(slotHtml).join('');
    return '<div class="day-card"><div class="day-hdr" onclick="toggleDay(this)">' +
      '<div class="d-badge ' + (med ? 'med' : '') + '">Day ' + (i + 1) + '</div>' +
      '<div class="d-title">' + esc(info.title) + '</div>' +
      '<div class="d-tag ' + (med ? 'med' : '') + '">' + (themeMap[info.type] || '') + '</div>' +
      '<div class="d-chev' + (i === 0 ? ' open' : '') + '">▼</div></div>' +
      '<div class="day-body' + (i === 0 ? ' open' : '') + '">' + slots + '</div></div>';
  }).join('');
}

function slotHtml(s){
  return '<div class="dslot"><div class="dslot-t">' + esc(s.time) + '</div>' +
    '<div class="dslot-pip" style="background:' + (COL[s.type] || '#aaa') + '"></div>' +
    '<div class="dslot-b"><div class="dslot-n">' + esc(s.name) + '</div>' +
    '<div class="dslot-d">' + esc(s.desc || '') + '</div>' +
    (s.tip ? '<div class="dslot-tip">💡 ' + esc(s.tip) + '</div>' : '') +
    '</div></div>';
}

function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"]/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
  });
}
```

- [ ] **Step 3: Replace `openDet()`** (lines ~537-556) to read from `SCHED.days[idx]`:

```js
function openDet(idx, cell){
  var info = SCHED && SCHED.days[idx];
  if(!info) return;
  document.querySelectorAll('.c-day').forEach(function(c){ c.classList.remove('sel'); });
  if(cell) cell.classList.add('sel');
  document.getElementById('detDate').textContent = info.title;
  document.getElementById('detTitle').textContent = info.title;
  document.getElementById('detSlots').innerHTML = (info.items || []).map(slotHtml).join('');
  var p = document.getElementById('detPanel');
  p.classList.add('open');
  p.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
```

- [ ] **Step 4: Delete the now-dead `const DAYS = {...}`** object (lines ~471-485). It is fully replaced by `schedule.days`.

- [ ] **Step 5: Commit**

```bash
git add result.html
git commit -m "feat(result): render day-cards + detail panel from schedule data"
```

---

### Task C2: Generate the calendar grid from real trip dates

**Files:**
- Modify: `result.html` (replace `weekData` + `buildCal`)

- [ ] **Step 1: Replace `const weekData = [...]` and `function buildCal()`** (lines ~487-535) with a date-driven builder:

```js
function buildCalFromSchedule(sched){
  var body = document.getElementById('calBody');
  body.innerHTML = '';
  var trip = (window.kwState && window.kwState.loadAll().trip) || {};
  var n = sched.days.length;
  var MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Day 1 anchor: real start date if present, else ~2 weeks out (flexible).
  var anchor = ymdToDate(trip.startDate);
  if(!anchor){ anchor = new Date(); anchor.setDate(anchor.getDate() + 14); }
  anchor.setHours(0,0,0,0);

  // Grid spans full Sun–Sat weeks covering the trip.
  var gridStart = new Date(anchor); gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  var tripEnd = new Date(anchor); tripEnd.setDate(tripEnd.getDate() + n - 1);
  var gridEnd = new Date(tripEnd); gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  var cur = new Date(gridStart);
  while(cur <= gridEnd){
    var row = document.createElement('div'); row.className = 'week-row';
    for(var i=0;i<7;i++){
      var cell = document.createElement('div');
      var idx = Math.round((cur - anchor) / 86400000); // 0-based trip day
      var info = (idx >= 0 && idx < n) ? sched.days[idx] : null;
      var dateLbl = '<div class="c-day-num">' + cur.getDate() + '<span class="c-mo"> ' + MO[cur.getMonth()] + '</span></div>';
      if(info){
        cell.className = 'c-day t-' + (info.type || 'mixed');
        (function(k, c){ cell.onclick = function(){ openDet(k, c); }; })(idx, cell);
        var first = (info.items && info.items[0]) || {};
        var act = '<div class="c-act"><div class="a-dot" style="background:' + (COL[first.type] || '#aaa') + '"></div>' + esc(first.name || '') + '</div>';
        cell.innerHTML = dateLbl + '<div class="c-badge">Day ' + (idx + 1) + '</div><div class="c-acts">' + act + '</div>';
      } else {
        cell.className = 'c-day inactive';
        cell.innerHTML = dateLbl;
      }
      row.appendChild(cell);
      cur.setDate(cur.getDate() + 1);
    }
    body.appendChild(row);
  }
}

function ymdToDate(s){
  if(typeof s !== 'string') return null;
  var p = s.split('-').map(Number);
  if(p.length !== 3 || p.some(isNaN)) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
```

> Note: this drops the static "🏠 Week before departure" label and the fixed Sep/Oct framing. The `.c-badge` color classes (`bm/bc/...`) are replaced by a neutral badge; the day color comes from `c-day t-<type>` which already has CSS (lines 86-91).

- [ ] **Step 2: Commit**

```bash
git add result.html
git commit -m "feat(result): build calendar grid from real trip dates, variable length"
```

---

### Task C3: Drive the cost estimator from party size + trip length

**Files:**
- Modify: `result.html` (cost calc init + tiers as functions)

- [ ] **Step 1: Replace the fixed tier tables** (line ~598 `var cpp={...}, dm={...}, cg=4, cd=10;`) with functions + state-derived defaults:

```js
var cg = 4, cd = 10; // overwritten by initCostFromState()
function conciergePerPerson(g){ return g <= 1 ? 2200 : g === 2 ? 1800 : g === 3 ? 1500 : 1200; }
function durMult(d){ return 1 + Math.max(0, d - 10) * 0.04; } // 10 days → 1.0, 14 → ~1.16
```

- [ ] **Step 2: Update `updateCost()`** to use the functions. Change the first line of `updateCost()`:
```js
  var ppu=cpp[cg], mult=dm[cd], conc=Math.round(ppu*cg*mult);
```
to:
```js
  var ppu=conciergePerPerson(cg), mult=durMult(cd), conc=Math.round(ppu*cg*mult);
```

- [ ] **Step 3: Add `initCostFromState(sched)`** just below `updateCost()`:

```js
function initCostFromState(sched){
  var trip = (window.kwState && window.kwState.loadAll().trip) || {};
  var people = (parseInt(trip.adults,10)||0) + (parseInt(trip.children,10)||0);
  cg = Math.max(1, people || 4);
  cd = sched.days.length;
  // Manual group/duration tabs no longer reflect arbitrary values — hide them.
  document.querySelectorAll('.g-tab, .dur-tab').forEach(function(t){ t.style.display='none'; });
  updateCost();
}
```

- [ ] **Step 4: Commit**

```bash
git add result.html
git commit -m "feat(result): cost estimator driven by party size and trip length"
```

---

### Task C4: Orchestrate load — fetch, loading state, render

**Files:**
- Modify: `result.html` (the page-init script)

- [ ] **Step 1: Find the current init.** Search result.html for where `buildCal()` / `buildSched()` / `bindHeroFromState()` are called on load (inside the first inline `<script>`, likely an init block or `DOMContentLoaded`). Replace those direct calls with a single async loader.

Add this near the end of the first inline `<script>` (after the functions are defined), and remove any existing `buildCal();` / `buildSched();` invocation:

```js
async function loadItinerary(){
  bindHeroFromState();
  var list = document.getElementById('schedList');
  if(list) list.innerHTML = '<div style="padding:28px;text-align:center;color:#86868b;font-size:19px;">Composing your itinerary…</div>';
  var state = (window.kwState && window.kwState.loadAll) ? window.kwState.loadAll() : {};
  var sched;
  try {
    sched = await window.kwSchedule.generate(state);
  } catch(e){
    sched = window.kwSchedule.template(state);
  }
  SCHED = sched;
  renderDayCards(sched);
  buildCalFromSchedule(sched);
  initCostFromState(sched);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', loadItinerary);
} else {
  loadItinerary();
}
```

> If a saved-itinerary view path exists (`loadSavedItinerary` at ~674) that should display a stored schedule instead of generating, ensure it sets `SCHED` and calls `renderDayCards`/`buildCalFromSchedule`/`initCostFromState` with the saved schedule rather than calling `loadItinerary`. Confirm during Task E1 and wire if needed.

- [ ] **Step 2: Commit**

```bash
git add result.html
git commit -m "feat(result): async load with composing state, then render itinerary"
```

---

## Phase D — Supabase `places` table (structure only)

### Task D1: Create the empty vetted-places table with RLS

**Files:**
- Reference only (run via Supabase SQL editor / Management API per `mosim-backend-conventions`).

- [ ] **Step 1: Apply this DDL** (Supabase SQL Editor):

```sql
create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  category    text not null check (category in ('medical','culture','cuisine','rest','travel','lodging')),
  name        text not null,
  area        text,                       -- neighborhood / city
  desc        text,
  tags        text[] default '{}',        -- e.g. {wheelchair, halal, vegetarian, mild}
  constraints text[] default '{}',
  active      boolean not null default true,
  notes       text
);
alter table public.places enable row level security;
-- No anon/auth policies: only the service role (server) reads this. Seeded later.
```

- [ ] **Step 2: Note** in the spec's §9 that the table exists but is unread until Slice 2 wires `gatherContributions` to query it. No code change this slice. (No commit — DB-only.)

---

## Phase E — Verification

### Task E1: Local end-to-end + fallback check

**Files:** none (manual/Playwright per `mosim-visual-verify`)

- [ ] **Step 1: Build + serve.**
```bash
npm install && npm run build
python3 -m http.server 8000
```
> Note: `/api/schedule` does not run under `http.server`. For the AI path use `vercel dev` (needs `ANTHROPIC_API_KEY` locally) OR test the AI path on a Vercel preview deploy. The **fallback path** is fully testable on `http.server` (the fetch fails → template renders).

- [ ] **Step 2: Fallback render check (http.server).** Drive the funnel (or seed `sessionStorage['kw.state.v1']`) with a trip of `nights: 5`, then open `/result.html`. Confirm:
  - "Composing your itinerary…" shows briefly, then **6 day-cards** render (5 nights + 1).
  - Calendar grid shows 6 active day cells starting from the trip's start date.
  - Cost block shows the entered party size and 6-day trip with no `NaN`.
  - No console errors.

- [ ] **Step 3: Variable-length check.** Repeat with `nights: 9` → **10 day-cards**; with flexible/no dates → **7 day-cards**.

- [ ] **Step 4: AI path check (vercel dev or preview).** With `ANTHROPIC_API_KEY` + `SCHEDULE_MODEL=claude-sonnet-4-6` set, run the funnel end-to-end. Confirm the rendered plan reflects the guest's actual selections (e.g. selected `checkup` appears on a medical day; allergens respected in dining lines), day count matches dates, and rich cards show name/desc/tip.

- [ ] **Step 5: Use the `mosim-visual-verify` script** to screenshot desktop + mobile of `/result.html` and assert: `#schedList .day-card` count === expected N; no console errors; `/api/schedule` (when live) response `.schedule.days` shape matches what `renderDayCards` consumes.

- [ ] **Step 6: Commit any fixes**, then this slice is complete.

---

## Self-Review notes (author)

- **Spec coverage:** §2 collaboration seam → A2 Step 4 (`gatherContributions`) + D1 table. §4 enriched contract → A2 (schema/prompt), B1 (template emits it), C1 (renders it). §5 variable length → A1+A2 (server), B1 `clientDayCount` (fallback), C2 (calendar), C3 (cost). §6 fallback → B1. §7 cost/model → A2 `SCHEDULE_MODEL`.
- **Known duplication (accepted):** day-count logic exists twice — `api/_lib/trip-length.js` (authoritative, server) and `clientDayCount` in `js/schedule.js` (fallback only, browser IIFE can't import the ESM lib). Kept minimal and documented.
- **Highest-risk task:** C2 (calendar from arbitrary dates) and C4 (saved-itinerary path interaction) — both gated by the Phase E browser checks.
- **Deferred (not this slice):** seeding `places`, querying it in `gatherContributions`, feedback/eval loop, founder-only cockpit gating (tracked separately).
