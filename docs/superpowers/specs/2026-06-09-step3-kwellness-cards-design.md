# Step 3 — Port K-Wellness experience cards into the funnel

**Date:** 2026-06-09
**Status:** Approved (design)

## Goal

Replace the current Step 3 ("Experiences") — seven plain text tiles — with the
rich K-Wellness culture picker (image card grid + detail drawer) that currently
lives, orphaned, in `js/step3-culture.jsx` + the legacy `step3.html`. Re-skin it
to the funnel's Warm Trust design system so Step 3 matches Step 1/2/4.

## Background

- **Current `step3.html`** (Warm Trust): 7 inline text tiles, multi-select, exclusive
  "Just the essentials" tile, saves an array of category keys to
  `kwState.saveStep('experiences', [...])`. No React.
- **`js/step3-culture.jsx`** (pre-rebuild, compiled but unmounted): a ~2,358-line
  React component `Step3Culture` with 50 experiences across 5 pages
  (Heritage 18 · Shop 16 · Famous 16 · Beyond Seoul 6 + Packages), a paginated
  tab pager, a selection basket, curated PACKAGES, a "pace/immersion" sub-step,
  and a detail drawer (hero photos · YouTube · facts). Saves to
  `kwState.saveStep('culture', ...)`.
- **CSS + mount** for that component live in the **legacy `step3.html`**
  (tag `legacy-2026-06-01`): ~1,370 lines of `kw-*` styles in a `<style>` block,
  `<div id="root">`, React 18 UMD, and
  `ReactDOM.createRoot(...).render(React.createElement(Step3Culture))`.
- Legacy palette: `--kw-accent #B21464` (retired magenta), white background,
  Playfair Display / Inter / Nanum Myeongjo fonts, per-theme pastel card tints.
- **All image assets already exist** in the repo: `assets/culture-heritage`
  (110 files), `culture-shop` (98), `culture-famous` (105), `culture-beyond` (38) —
  incl. `/thumbs/` variants and detail photos.
- `js/step3-culture.jsx` is already an esbuild entry in `package.json`
  (`build` / `dev`), so it compiles to `js/step3-culture.js` today.

## Scope

### In
- 50-card grid across **4 thematic pages**: Heritage · Shop · Famous · **Beyond Seoul**.
- Detail drawer (hero photos, YouTube, facts table) for cards that have a
  `CULTURE_DETAILS` entry.
- Selection basket (add/remove, multi-select).
- All existing image assets.
- Full Warm Trust re-skin.

### Out
- **Packages** page (Page Ⅴ) and the `PACKAGES` data array — removed.
- The **pace / "Maximum immersion"** sub-step — removed.
- The legacy magenta / Playfair / white-background look — replaced by Warm Trust.
- The current "Just the essentials" exclusive tile concept — dropped.

### Behavior decisions (confirmed with user)
- **Beyond Seoul** (6 cities) is included as the 4th page.
- Cards **without** a `CULTURE_DETAILS` entry are **selectable only** — clicking the
  card body does not open a drawer (no placeholder alert). Their add/remove control
  still works. (This is a change from the legacy placeholder-alert fallthrough.)

## Architecture — 4 files

### 1. `step3.html`
- Remove the 7-tile `<div class="tiles">` block and its inline selection IIFE.
- Keep the page chrome: header/nav, the step intro copy, footer, and the
  Continue/Back action bar (must keep driving `nav.js` to Step 4 / Step 2).
- Add, mirroring `me.html`:
  - React 18 + ReactDOM UMD production scripts (unpkg).
  - `<div id="root"></div>` where the grid mounts.
  - `<script src="js/step3-culture.js" defer></script>` (content-hash query per the
    repo's post-build step).
  - A small mount script: `ReactDOM.createRoot(...).render(React.createElement(Step3Culture))`.
- Port the legacy `kw-*` CSS into Step 3 — see file 3.

### 2. `js/step3-culture.jsx`
- **Trim:** delete the `PACKAGES` array, the Packages page entry in `CULTURE_PAGES`,
  the packages render branch, and the pace/immersion sub-step and its state.
- **State key:** change persistence from `kwState.saveStep('culture', ...)` to
  `kwState.saveStep('experiences', <array of selected codes>)`, and hydrate initial
  selection from `kwState.loadStep('experiences')`.
- **Drawer gating:** only open the detail drawer when `CULTURE_DETAILS[code]` exists;
  otherwise card click toggles selection only (no alert).
- Keep `Step3Culture` defined in global scope (no imports — babel/esbuild constraint).
- Keep the 4-page pager (Heritage/Shop/Famous/Beyond Seoul).

### 3. CSS (in `step3.html`)
Port the legacy `<style>` `kw-*` rules, remapping tokens to Warm Trust:
- `--kw-accent #B21464` / `--kw-accent-deep` / `--kw-accent-soft` → gold `#C39A3F`
  (accent) + navy `#1B2A4A` (primary), with a soft gold tint for selected states.
- `--kw-bg #ffffff` / `--kw-bg-soft` / `--kw-bg-warm` → ivory `#F7F2EA` / `#FBF8F2`.
- `--kw-ink*` → funnel `--ink #54514B` / `--ink-2 #8A8479` / navy for headings.
- `--kw-line` / `--kw-rule` → `--line #E5DBC8`.
- Fonts: Playfair Display → **Fraunces** (already loaded by funnel pages) for
  headings; Inter/Nanum → the funnel's system body stack. Drop the legacy Google
  Fonts `<link>`.
- Per-theme pastel card tints (palace/temple/ocean/etc.) → a single warm-neutral
  card surface (ivory-soft) with the gold/navy accent system; keep the monogram
  numerals as a subtle navy.

### 4. `js/schedule.js`
- Expand `CULTURE_LABELS` so the new experience **codes** (e.g. `gyeongbokgung`,
  `bukchon`, `tea`, `jeju`, …) map to human labels — use each card's `name`.
- Adjust `collect()` / the `culture` read so it consumes the `experiences` **array**
  of codes (current code reads `state.culture` as an object). Result-page 7-day
  itinerary should reflect the user's real picks, with the existing sensible
  fallbacks when nothing is selected.

## Data flow

```
[step3] card selections
   → kwState.saveStep('experiences', ['gyeongbokgung','tea','jeju', ...])
        ↓
[result.html] → schedule.js maps codes → labels → 7-day itinerary
```

`sessionStorage` key unchanged (`mosim.state.v1`); only the `experiences` field’s
shape is now an array of culture codes. Update `DEFAULT_STATE` in `js/state.js` if
the current default shape conflicts.

## Build

- `npm run build` already compiles `js/step3-culture.jsx` → `js/step3-culture.js`
  and runs `scripts/post-build.mjs` (content hashing). No new build entry needed.
- Confirm the post-build hash is reflected in the `step3.html` script tag.

## Testing / verification (mosim-visual-verify recipe)

- `npm run build` succeeds; `js/step3-culture.js` regenerated.
- Playwright, desktop + mobile:
  - Step 3 renders the card grid; page tabs switch Heritage/Shop/Famous/Beyond Seoul.
  - Clicking a card **with** detail → drawer opens (hero photo, facts, video frame).
  - Clicking a card **without** detail → selection toggles, no drawer, no alert.
  - Selecting cards → basket updates → `kwState` `experiences` array persists.
  - Continue → Step 4; Back → Step 2.
  - Result page: selected experiences appear in the 7-day itinerary.
  - No console errors; no magenta / Playfair / white-bg regressions (Warm Trust only).

## Risks / notes

- Heaviest work is the **CSS port + palette remap** (~1,370 lines). Component logic
  change is mostly deletion (packages, pace) + the state-key swap + drawer gating.
- Detail drawer content exists for ~30 cards (Heritage + Shop); Famous and Beyond
  Seoul are largely selection-only by design — acceptable per scope.
- Execute via the **mosim-orchestrator** agent team (frontend-builder for HTML/CSS/JSX,
  backend touch only for `schedule.js`/state mapping, visual-qa for the Playwright pass).
