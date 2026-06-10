# Pricing page — answer the #1 question up front

**Date:** 2026-06-10
**Status:** Approved (design)

## Goal

Add a dedicated, nav-accessible **`pricing.html`** that answers a prospective
customer's first and biggest question — *"how much will this cost?"* — clearly and
*before* they commit to the funnel. Today the actual concierge fee ($1,200) is only
visible after completing the whole funnel (`result.html`) or buried in `terms.html`
(footer). Surfacing it up front directly serves the North Star: the real enemy is the
psychological barrier, and price opacity is its #1 form for medical travel.

The page **centralizes existing pricing truth** that is currently scattered across
`result.html`, `terms.html`, and `faq.html`. It does **not invent new numbers** —
it reuses the canonical figures already shipped.

## Constraints

- CLAUDE.md forbids new pages "outside the PRD funnel" without updating PRD first.
  PRD does not enumerate a closed page set (faq/terms/medical/etc. already exist
  outside the funnel list) and does not forbid this — but we **update PRD anyway**
  to record the page, per the rule's intent.
- Design = Warm Trust (ivory/navy/gold, Lora serif + Inter, body ≥19px senior-readable).
- Static page, **no JS** (no dynamic calculator — `/pay` owns transactions).

## Page sections (top → bottom)

1. **Hero** — headline answering the question directly, e.g. *"What it costs — clearly,
   before you decide."* + one line: one fee, no markup.
2. **The Mosim concierge fee** — large **$1,200** · per traveler · one-week (7-day) trip ·
   prorated to actual dates (~$170/day). "What's included" list (reuse `result.html`'s 6:
   planning & itinerary, private car & driver, personal interpreter, everyday meals,
   concierge beside you, 24/7 support). "This is everything Mosim charges."
3. **What you pay directly (no markup)** — medical care (hospital), hotel, flights are
   billed to you directly by those providers; Mosim never marks up, never takes a cut.
   (Reuse `terms.html` / `result.html` wording.)
4. **An honest example** — Korea ~$12,800 vs typical U.S. ~$37,500 ("about a third"),
   with the existing caveat: *example estimates only — your hospital confirms the final
   quote before anything is decided.* Link to **Medical** page for per-procedure prices.
5. **CTA** — "Plan my trip" + reassurance ("you only pay when you decide to begin").

**Explicitly NOT included** (user decision): a refund/cancellation summary section.
Refund terms stay in `terms.html`; the pricing page does not duplicate them. (No link
section for refunds either — keep the page focused on cost, not policy.)

## Numbers — single source of truth (do not invent)

| Figure | Value | Current source |
|---|---|---|
| Concierge fee | $1,200 / traveler / 7-day, prorated (~$170/day) | terms.html:123, result.html:162 |
| Included (6 items) | planning · car+driver · interpreter · meals · concierge · 24/7 | result.html:164–172 |
| Korea medical (example) | ~$12,800 | result.html:179 |
| U.S. medical (example) | ~$37,500 ("about a third") | result.html:183–186 |
| Pay-direct / no-markup | medical, hotel, flights billed direct, no cut | terms.html:129, result.html:177–192 |

If any of these are reworded, keep them consistent with terms.html (the canonical
fee document).

## Architecture

- New static **`pricing.html`**, mirroring the existing content-page chrome
  (`index.html` / `faq.html` / `medical.html`): same `<head>` (Warm Trust `:root`
  tokens, Lora+Inter Google Fonts), same nav, same footer, same `nav-auth` My-Page
  swap script. No new JS file.
- **Nav + footer link added on every content page** — insert **"Pricing" next to
  "FAQ"** in the main `navlinks` and in `foot-links`, across:
  `index.html, faq.html, medical.html, experience.html, our-story.html` (and
  `pricing.html` itself, with Pricing marked `active`). Keep the existing order
  otherwise; do not disturb other links. (pay.html's stripped nav stays as-is.)
- Clean-URL aware: link as `pricing.html` (Vercel `cleanUrls` serves `/pricing`).

## PRD update

- Record `pricing.html` in PRD.md as an informational page.
- Reconcile the fee description: PRD currently says "$1,200 × group size" without the
  **per-7-day proration**; the customer-facing canonical (terms/result/this page) uses
  per-traveler / 7-day / prorated. Update PRD's wording to include proration so docs
  and shipped copy agree.

## Execution (orchestrator team)

1. **content-designer** — write/refine the senior-readable copy in Warm Trust voice
   for all 5 sections, reusing the canonical numbers; deliver copy + microcopy.
2. **frontend-builder** — build `pricing.html` from the content-page template, wire
   the copy, add the "Pricing" nav/footer link across the listed pages, update PRD.md.
3. **visual-qa** — verify (see below).

## Testing / verification

- Desktop + mobile screenshots of `pricing.html`.
- The big $1,200 + included list + Korea/U.S. example + CTA all render correctly.
- "Pricing" link appears in the nav and footer on every content page and routes to the
  page; the page's own nav marks Pricing active. Medical link from §4 works.
- Warm Trust intact (ivory bg, Lora headings, no magenta), body ≥19px.
- No console errors. Build (`npm run build`) unaffected (static page; post-build may
  stamp it if it references hashed assets — none expected).

## Addendum (2026-06-10) — customer-journey infographic + verbosity pass

Two follow-ups after the founder reviewed the first build:

**A. Verbosity pass (done).** Founder: "too wordy." Halved the copy: removed the
duplicate "Everything Mosim charges" + duplicate proration paragraph + the example
intro; shortened the 6 included glosses to fragments; converted the "Paid directly"
prose into a 3-item visual block. See [[feedback-minimal-visual]].

**B. Customer-journey infographic (new).** Seniors are the core audience, so show the
end-to-end service flow as a visual **vertical timeline** below the fee section
(price first, then the journey). Approved decisions: **remove** the "Paid directly"
3-card block (the journey covers both payment moments — no duplication); **vertical
timeline** format (big serif numerals + simple inline-SVG icon + short label + one
line each); the **two payment steps (4 & 6) accented in gold** so "one fee to Mosim,
the rest paid directly to vendors, no markup" reads at a glance.

Labels are corrected to the REAL product flow (verified against PRD + code; statuses
`new→reserved→reviewing→quoted→booked`):
1. **Plan your trip** — Pick your care, trip, experiences, and food; our AI shapes a 7-day plan.
2. **Reserve** — Free, no commitment — just tell us you're interested.
3. **Mosim confirms** — We line up your hospital and dates, then confirm it's ready.
4. **Pay the concierge fee** *(gold)* — $1,200 per traveler. The one thing Mosim charges.
5. **Get your travel links** — We send hand-picked flight and hotel links.
6. **Book them directly** *(gold)* — You pay the airline and hotel yourself. No markup.
7. **We're beside you in Korea** — Interpreter, transport, and company — every day.
8. **Home again** — With you from landing to your flight home.

New page order: Hero → $1,200 fee + included → **Journey timeline** → Honest example
(bars) → CTA.

Note (out of scope, flag only): index.html `#how` step 02 says "we book every flight
and hotel," which contradicts the real customer-pays-vendors-directly model. Worth a
separate copy fix so the simplified landing flow doesn't contradict this page.

## Risks / notes

- Keep numbers in sync with terms.html — if the fee ever changes, both must update.
  (Future option: a shared snippet; out of scope now — YAGNI.)
- This page makes the previously-gated price public; that is the intended effect
  (lower the barrier), consistent with result.html already showing it.
