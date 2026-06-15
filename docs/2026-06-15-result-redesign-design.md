# Result page redesign — conversion-focused (2026-06-15)

> Brainstormed + founder-approved via interactive mockup (`_workspace/result-redesign-mockup.html`, the visual source of truth). Goal: turn `result.html` from a weak "now what?" page into a clear, FAMILIAR, conversion-driving endpoint (funnel → result → **reserve → purchase**).

## Decisions (all founder-chosen)

1. **Familiar pattern = a "How this works" steps timeline** ("you are here"), orienting the first-time senior so they're never lost.
2. **Price = 3-way transparent "What you pay"** (To Mosim / To the hospital / Hotel+flights), not a package reframe.
3. **Primary action = "Reserve this trip"** (free, no commitment; pay the fee later).
4. **Reserve = account creation in one** — replaces the weak "Save your plan" framing.
5. **Page order: Orient → Plan → Price → Reserve** (steps first, itinerary as proof, price, reserve).

## Page structure (top → bottom)

1. **Head** (keep, simplify): "Your plan / Here's your Korea." + one-line subtext + recap chips. Drop the standalone grey `preview-note` (its reassurance is absorbed by the steps section).

2. **🆕 "How this works" — 5-step stepper.** Desktop = horizontal 5-col; mobile = vertical stack. Step ① highlighted (navy circle + "YOU'RE HERE" gold pill).
   - ① **See your plan** — "Your week, drafted around your care." (you're here)
   - ② **Reserve** — "Free, no commitment." + **one primary button "Create account"** with a small "Already a member? Sign in" link beneath (inline conversion CTA in the journey).
   - ③ **We confirm** — "Your care & dates with the hospital."
   - ④ **Pay your fee** — "Only once everything's confirmed."
   - ⑤ **We handle it** — "Beside you, the whole trip."

3. **Itinerary "Your days"** (KEEP AS-IS): legend + week calendar + day-by-day accordion + "concierge fine-tunes" note. This is the proof/wow — no change to its JS rendering.

4. **🆕 "What you pay" — one card** (replaces the current fee-block + KR/US compare + "also handled"):
   - **To Mosim — $X** (dynamic: $1,200 × travelers, existing fee logic) · subtext "Your concierge — private car & driver, interpreter-guide, every meal, 24/7 support."
   - **To the hospital — "paid direct"** (right column). Left subtext = small **ESTIMATE breakdown** keyed to the chosen care needs, e.g. "Health screening ~$1,600 · Dental (implants) ~$3,000", then "Your hospital confirms the final price." The word **ESTIMATE** is emphasized (gold, uppercase, small). NO "a third of U.S. prices" comparison (removed per founder).
   - **Hotel + flights — "paid direct"** · subtext "We arrange every option; you pay the provider directly, no markup."
   - Foot line (one line, full card width): "**Reserve free today** — you pay your Mosim fee later, only once we confirm your care & dates."
   - Card is widened (~900px) so the foot line stays one line.

5. **🆕 Reserve close** (replaces the "Save your plan" invite): "Ready to make this real?" + full-width one/two-line paragraph + big **"Reserve this trip →"** button + fine print ("$0 today · cancel anytime before we begin"). For signed-in members, show the confirmed/"reserved" state instead (reuse existing member-CTA logic).

6. **Sticky bar** (repurpose existing `#resultBar`): label "Ready when you are. Reserve free — pay later." + button **"Reserve this trip →"** (was "Save my plan").

7. Footer — keep.

## Conversion mechanic — Reserve = account

- **Not signed in:** "Reserve this trip" / "Create account" → signup (email/password or Google), framed as securing the reservation. Carry `?next=result&save=1&reserve=1`. On return: save the itinerary (existing `save=1` path) **then** call `/api/reserve` to set status `reserved`. Show the reserved confirmation state.
- **Signed in:** clicking Reserve → save (if not already) + `/api/reserve` directly → reserved state.
- Backend: `/api/reserve` already exists (sets itinerary status `new → reserved`). Work = chaining save→reserve in the post-auth flow + extending the signup/signin redirect handling to honor `reserve=1`.

## Dynamic data

- **Mosim fee:** reuse existing per-traveler × party-size computation (the current `$1,200 · prorated` logic / `computeTotal`). Show the party total (e.g. $2,400 for 2).
- **Care breakdown:** new — a per-care-need estimate map keyed to `state.care.needs` (screening / knees / dental / eyes). Source the ranges from the per-procedure prices already surfaced on `medical.html` (pricing.html links to them); define a small map in result.html if no reusable source. Always labelled ESTIMATE + "hospital confirms". Only show line items for the needs the traveler actually chose.

## Kept / Cut

- **Kept (do not rebuild):** itinerary calendar + accordion rendering, fee computation, reserve/save endpoints, Warm Trust tokens.
- **Cut:** standalone grey `preview-note`; the weak "Save your plan / Create a free account" invite section; the scattered 3 pricing sub-blocks (folded into "What you pay"); the KR-vs-US comparison bars (replaced by the per-procedure ESTIMATE breakdown).

## Constraints

Senior-readable, minimal/not-wordy (founder's strong preference); body ≥19px; Warm Trust (ivory/navy/gold, Lora headings); mobile must reflow with zero horizontal overflow (stepper → vertical, pay rows → stacked). Mobile polish can ride the pending mobile batch but must not overflow.

## Files (expected)

- `result.html` — the bulk (new steps section, "What you pay" card + care breakdown JS, reserve close, sticky-bar label, inline create-account CTA).
- Post-auth flow: `result.html` save handler + `signup.html`/`signin.html` redirect handling to support `reserve=1`.
- `/api/reserve.js` — likely unchanged (verify it works when called right after save).

## Verification

visual-qa: desktop + mobile screenshots of all sections; ≥19px; stepper + pay-card reflow; no overflow; the reserve=account flow e2e (create account → saved + reserved → confirmed state). Match the approved mockup.
