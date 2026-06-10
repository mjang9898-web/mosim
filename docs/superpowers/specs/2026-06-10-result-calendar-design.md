# Result page — date-aware calendar + per-day accordion (Phase 1)

**Date:** 2026-06-10 · **Status:** Approved (Phase 1 only) · zero new cost

## Goal
Turn result.html's itinerary into a **date-aware calendar** mapped to the
customer's real selected dates, with **per-day expandable dropdowns** showing
that day's schedule + meals. Phase 1 = client-side from existing data + one
small safe backend tweak. (Phase 2 meals-via-AI and Phase 3 multi-city deferred.)

## Current data (verified)
- result.html renders `sessionStorage['mosim.schedule.v1']` = `[{day:"Day 1",
  title, cat(care|rest|explore|travel), slots:[{t,place}]}]`; fallback hardcoded
  SAMPLE. No real dates, no structured meals, no city/transport.
- Dates: `state.trip.when = { mode:'flexible'|'dates', dates:{start,end} (ISO or
  null), season }`. Real ISO dates ONLY when `mode==='dates'`. `state.trip.length`
  is a range bucket otherwise.
- The AI (`/api/schedule`, Claude Sonnet) runs on every funnel completion IF
  `ANTHROPIC_API_KEY` is set; else SAMPLE. Schedule length is AI-decided and may
  not match the date range.

## A. Frontend — result.html (the main work)
1. **Date mapping**: if `trip.when.mode==='dates'` and `start` present, Day N date
   = start + (N−1) days. Label "Day 1 · Thu, Jul 3". If flexible/no dates →
   degrade to "Day N" (+ season chip), no calendar grid (accordion still works).
2. **Week calendar (overview)**: a real weekday-grid calendar spanning from the
   week containing `start` to the week containing the last trip day. Trip days
   placed on their actual weekday cells showing date # + short title + category
   colour; non-trip days in those weeks shown muted/empty. Clicking a day cell
   opens/scrolls to its accordion item.
3. **Per-day accordion (detail)**: below the calendar, a vertical list — one
   collapsible row per day: header "Day N · {weekday, Mon D} — {title}" +
   category; expanded body = the day's `slots` (t · place) and a **Meals** group.
   Day 1 open by default. Smooth, senior-readable (≥19px), keyboard accessible
   (aria-expanded).
4. **Meals (Phase-1 heuristic, honest)**: within a day, surface slots whose
   t/place suggest a meal (breakfast/lunch/dinner/meal/market/restaurant/food
   keywords) under a "Meals" subhead. If a future `meals` field exists on the day
   object, prefer it. No fabrication — just grouping existing slots.
5. **Length reconciliation**: the calendar span follows the user's real date range
   (date mode). If `schedule.length` < range days → remaining dates render as
   gentle "Open day — your concierge tailors this." If > range → clamp to range
   (show all days but cap the grid to the range; never crash). Keep robust whether
   schedule came from AI or SAMPLE.
6. Keep existing recap chips, pricing, save/invite CTA, sticky bar, footer intact.
7. Multi-city (Busan/Jeju) logistics NOT handled here (Phase 3) — a Beyond-Seoul
   day just renders as its content.

## B. Backend — `api/schedule.js` (small, safe, free)
When `trip.when.mode==='dates'` with valid start+end, compute `N = days between
start and end inclusive` and add ONE instruction to the prompt: "This trip is
exactly N days — return exactly N day objects." Only when dates exist; otherwise
unchanged. No new call, negligible token delta. (Improves calendar↔content match
when the AI is on; harmless when off.) Do not otherwise change the contract.

## Verify
- result.html renders correctly for: (a) a date-mode trip (e.g. 2026-07-03 →
  07-14, 11 days) with a injected schedule — dates map (Jul 3…), week grid spans
  the right weeks, accordion expands per day, meals grouped; (b) a flexible-mode
  trip — graceful "Day N" + season, no crash; (c) schedule length ≠ range —
  graceful open-days/clamp. Desktop + mobile, no console errors, Warm Trust, ≥19px.
- (result.html is public/no-auth → visual-qa can inject sessionStorage state +
  schedule and verify rendering directly.)
