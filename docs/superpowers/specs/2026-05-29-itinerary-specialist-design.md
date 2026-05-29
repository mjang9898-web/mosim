# Itinerary Specialist — Design Spec (Slice 1)

**Date:** 2026-05-29
**Status:** Approved design → ready for implementation plan
**Scope:** First runtime "expert agent". Replaces the template-based schedule generator
with a real AI itinerary specialist, built so future domain specialists (F&B, culture
tour, medical coordinator) can collaborate without an architectural rewrite.

---

## 1. Goal & Context

When a customer completes the 5-step funnel and requests their plan, the result page
currently renders a **deterministic template** (`js/schedule.js` →
`kwSchedule.generate`). This produces a fixed 7-day skeleton regardless of how well it
actually fits the customer.

We are replacing that with the first **runtime expert agent**: an *itinerary
specialist* that reads the customer's actual inputs and composes a genuinely tailored
plan via the Claude API.

Two founder requirements shape this design:

1. **Variable length** — the plan must be as long as the trip actually is (could be
   3 days, could be 10), derived from the customer's travel dates. Not hardcoded to 7.
2. **Built for collaboration** — the best plan is *not* made by an itinerary agent
   alone. Future agents (food & beverage, culture tour, etc.) must be able to
   contribute. Slice 1 must leave clean seams for them.

This is the first feature to incur **real Claude API cost** (the project's deferred
build-phase cost). See §7.

### Non-goals (deferred to later slices)
- Seeding the vetted places database with real content.
- Plan feedback / evaluation / human-review loop ("the develop-over-time loop").
- Additional specialist agents (food, culture) — only their *seam* is built now.

---

## 2. Collaboration Architecture (the part that must not be rebuilt later)

The single most important design decision: how specialists will eventually work
together. We commit to it now so Slice 1 fits it.

### Roles

- **Orchestrator** (`/api/schedule`) — thin coordinator. Receives the customer state,
  decides which specialists to run, runs them, collects their outputs, hands everything
  to the composer, returns the final plan. Today it runs exactly one specialist; later
  it runs several (in parallel where independent).

- **Specialist** — a domain expert module with a *standard contract*. Input: the
  relevant slice of customer state + shared trip context. Output: a structured
  **`Contribution`** (a list of recommended items with metadata — category, when it
  fits, constraints honored, optional vetted-place reference, rationale/priority). A
  specialist proposes *candidates with reasoning*; it does not decide final placement.

- **Composer** — a special role held (for now) by the **itinerary specialist**. It
  takes all `Contribution`s plus the shared trip context and resolves them into the
  final day-by-day schedule: sequencing, geography/travel-time, pacing, and
  senior-appropriate rest. It owns the final output shape.

### How Slice 1 fits this

In Slice 1 there is only one specialist, and it *is* the composer — so it both
generates content and assembles it. But we build the seam:

- The orchestrator already has a "gather contributions → pass to composer" step; in
  Slice 1 the contributions list is empty (or self-supplied), so the composer generates
  freely.
- The `Contribution` interface is defined (§4) even though only the composer consumes
  it now.

**Adding F&B later** therefore = (1) write `specialists/food.js` returning a
`Contribution`, (2) register it in the orchestrator, (3) done — the composer already
knows how to weave contributions in. No rewrite of the orchestrator's flow or the
output contract.

### Deliberate extension point (not built now)
A future "request more" round, where the composer can ask a specialist for additional
candidates (e.g. "2 more senior-friendly dinners near Bukchon"). Slice 1 is one-shot:
gather → compose. The interface should not preclude adding this later.

---

## 3. Components & Data Flow

```
[result.html]
   └─ kwSchedule.generate(state)            ← stays the public entry point (now async)
         └─ fetch POST /api/schedule         ← orchestrator (NEW serverless fn)
               ├─ derive trip context (incl. day count from dates)   §5
               ├─ run specialists  → Contribution[]  (Slice 1: itinerary/composer only)
               ├─ compose: Claude (Sonnet) → final schedule JSON      §4, §6
               │     (system prompt + label maps prompt-cached)
               └─ validate shape → return
         └─ on any failure → fall back to existing template generator §6
   └─ renderSchedule(schedule)               ← UNCHANGED (same output shape)
```

### Files
- **`api/schedule.js`** (new) — orchestrator + composer call. Reads
  `SUPABASE_*`, `ANTHROPIC_API_KEY`, `SCHEDULE_MODEL` env vars.
- **`js/schedule.js`** (edit) — `generateSchedule` becomes `async`, fetches
  `/api/schedule`; the current template body is *kept* as `generateScheduleTemplate`
  (renamed) and used as the fallback. Public `kwSchedule.generate` signature preserved.
- **`result.html`** (minimal edit) — `await` the now-async generate; show a brief
  loading state while the API runs. No change to `renderSchedule` or markup.
- **Supabase `places` table** (new, structure only) — vetted-place schema, empty for
  now. Wired into the orchestrator as an optional lookup that injects matched vetted
  places into the composer prompt. With an empty table the composer simply proceeds on
  its own knowledge (hybrid behavior, degrades gracefully).

---

## 4. Output Contract (the frontend's safety contract)

The composer MUST return JSON in the **same shape** `result.html` already renders, so
the frontend is not touched. Reference shape (from current `kwSchedule.generate`):

```
{
  guestName, arrival, hotel, origin, interest, note,
  adults, children, partyType, travelClass, hotelTier,
  medicalSelections: string[], cultureSelections: string[], cuisineSelections: string[],
  allergens: string[], diets: string[], spice,
  days: [ { day: number, title: string, items: [ { time: string, label: string } ] } ]
}
```

- `days.length` = computed trip length (§5), not fixed at 7.
- Validation in the orchestrator checks this shape before returning; malformed →
  fallback (§6).

### `Contribution` interface (defined now, consumed by composer)
```
{
  specialist: 'itinerary' | 'food' | 'culture' | ...,
  items: [ {
     category: string,        // e.g. 'meal', 'tour', 'treatment'
     label: string,           // human-facing line
     fitsWhen?: string,       // 'lunch' | 'evening' | day hint
     constraints?: string[],  // e.g. ['halal','wheelchair']
     placeRef?: string,       // FK into vetted places table, if any
     rationale?: string,      // why recommended (for composer, not shown raw)
     priority?: number
  } ]
}
```
In Slice 1 the composer receives an empty/self list and generates directly; the field
set is fixed now so future specialists target a stable contract.

---

## 5. Variable Trip Length

- Source: `state.trip.dates` (and/or `contact.when`). Parse into a day count.
- If a clear range/duration is present → use it.
- If ambiguous or missing → default (e.g. 5 days) and note the assumption; never crash.
- The composer is instructed to produce **exactly N days**, day 1 = arrival,
  day N = departure, with senior-appropriate pacing in between.

---

## 6. Error Handling — customer never sees a broken result

- The existing deterministic template generator is **kept** (renamed
  `generateScheduleTemplate`) and used as the fallback.
- Fallback triggers on: API/network error, non-2xx, timeout, invalid JSON, or output
  failing the §4 shape validation.
- `js/schedule.js` wraps the fetch in try/catch → returns the template result on any
  failure, so `renderSchedule` always gets a valid object.
- Log failures server-side (and a console warning client-side) so we can see when the
  AI path is failing without the customer ever seeing an empty page.

---

## 7. Cost (build-phase flag)

This is the project's **first real recurring cost** (Claude API), previously deferred
under the zero-cost build phase.

- **Model:** Sonnet 4.6, set via `SCHEDULE_MODEL` env var so it can be switched to Opus
  later with no code change.
- **Per plan:** ~1–3 cents (a few thousand tokens in/out). System prompt + label maps
  are **prompt-cached**.
- **When charged:** only when a customer generates a result — scales with traffic, not
  idle time.
- Cost was flagged to and accepted by the founder before building.

---

## 8. Testing & Verification

Per `mosim-visual-verify`, after build:
- Run the full funnel end-to-end under Playwright.
- Confirm the result page renders a real AI-generated plan (not the template), with no
  console errors.
- Confirm `days.length` matches the trip dates entered (variable-length check).
- Force the fallback (e.g. bad API key locally) and confirm the template still renders —
  no empty/broken page.
- API↔frontend shape check: `/api/schedule` response matches what `renderSchedule`
  consumes (§4).

---

## 9. Open Questions / Future Slices

- **Slice 2:** seed the `places` table with real vetted content; confirm hybrid
  injection visibly improves plans.
- **Slice 3:** add the food specialist as the first *separate* `Contribution` producer —
  validates the collaboration seam for real.
- **Later:** plan feedback/evaluation loop (the "develop the employee over time"
  mechanism); composer↔specialist "request more" round.
