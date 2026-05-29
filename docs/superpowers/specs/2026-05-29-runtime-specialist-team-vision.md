# Mosim Runtime Specialist Team — Vision (DESIGN FROZEN)

**Date:** 2026-05-29
**Status:** **DESIGN FROZEN — build deferred (cost-gated).** No Claude API wiring until the founder approves the first real charge. This is the umbrella vision; Slice 1 detail lives in `2026-05-29-itinerary-specialist-design.md`.

## What this is
The product-side AI team that plans a customer's trip when they finish "Plan Korea". Runs in the Vercel backend via the Claude API (`/api/schedule`) — **not** tmux / Claude Code dev agents, and **not** customer-facing chat. It replaces the current hardcoded/template itinerary with genuinely tailored plans.

## Architecture (from the Slice 1 spec)
- **Orchestrator** (`/api/schedule`) — runtime coordinator. Receives customer state, runs the needed specialists, collects their outputs, hands to the Composer, returns the final plan. (This is code, not an "agent".)
- **Specialist** — a domain expert with a *standard contract*. Input: customer state + relevant slice. Output: a `Contribution` = candidate recommendations + reasoning (it proposes, it does not place).
- **Composer** — held (for now) by the Itinerary Specialist. Takes all Contributions + customer state and weaves the day-by-day plan (variable length, pacing, senior rest, travel time, conflict resolution). Can do a "request more" round back to a specialist.

## The 6-agent roster
| # | Agent | Role | Funnel input it consumes | Its knowledge base (Supabase) |
|---|-------|------|--------------------------|-------------------------------|
| 1 | **Itinerary Specialist** (Composer) | Weaves all contributions into a variable-length day-by-day plan; owns pacing, senior rest, transitions | `trip` (dates, party, hotel, origin) | pacing/sequencing rules |
| 2 | **Medical Coordinator** | Maps medical selections → clinics/procedures, correct sequencing (screening → procedure → recovery window), JCI hospitals | `medical` | verified clinics / procedures / recovery windows |
| 3 | **Wellness & Hanbang Specialist** | Spa, oriental medicine, meditation, post-procedure recovery & rest placement (the *wellness* half of K-Wellness) | `medical` (wellness-type), pace | verified spas / hanbang / recovery courses |
| 4 | **Food & Beverage Specialist** | Meal recs honoring allergies/diet/spice + cuisine picks; senior-friendly (texture, mildness); near the day's route | `cuisine` + allergens/diets/spice | verified restaurants |
| 5 | **Culture & Experience Specialist** | Heritage/shop/famous/beyond experiences matched to interests + accessibility (wheelchair, flat routes) | `culture` | verified culture spots (existing curated content) |
| 6 | **Logistics & Concierge Specialist** | Transport (private car / KTX), airport reception, hotel tier, visa/K-ETA, 24/7, per-day timing | `trip` (origin, hotel) + overall route | transport / accommodation / timing rules |

(The Orchestrator is the runtime that runs them; it's not counted as an agent.)

## How each specialist "learns and develops over time"
**Honest constraint:** the model's weights do **not** self-update. There is no autonomous learning today. "Development" is a **compounding, human-driven loop + accumulating data** that the system reads at run time. It is real and it compounds — it is just operated, not magical. The team gets measurably better as the founder runs this loop:

1. **Knowledge-base growth (primary lever).** Each specialist queries its own Supabase table of *verified* places/rules. Adding vetted rows (a restaurant you trust, a wheelchair-friendly course, a clinic's real recovery window) directly raises quality and makes recommendations "ours" instead of generic/hallucinated. Growing these tables **is** training the employee.
2. **Captured plans + feedback.** Every generated plan is stored (extend the existing `itineraries` table or a `plan_runs` table) with a rating/notes field (founder review and/or customer thumbs). This builds a corpus of good/bad cases.
3. **Exemplars (in-context "learning").** Promote the best captured plans into each specialist's prompt as few-shot examples. The agent improves from your curated best cases without any retraining — this is the practical analogue of "learning from experience".
4. **Rules / guardrails.** An editable per-specialist list of do/don't rules ("never schedule a procedure on arrival day", "seniors get a rest day every ~3 days", "no spicy dish for spice-averse"), grown from observed mistakes.
5. **Eval set (regression guard).** A fixed set of sample customer inputs + a checklist of "good plan" criteria. Run before/after any prompt or rule change so improvements don't silently regress something else.
6. **Deferred / not now:** model fine-tuning (not worth it at this scale) and Claude's long-term memory tool (more for agentic sessions). The KB + exemplars + rules + evals loop is the path.

**Where the "development" state lives:** prompts/rules in version-controlled config per specialist; verified data + captured plans + ratings in Supabase. So growth is partly in git (rules/prompts/exemplars) and partly in the DB (verified places, plan corpus).

## Build order (slices) — all DEFERRED until cost is approved
- **Slice 1:** Itinerary Specialist alone (= Composer). Template → real AI plan, variable length. ⚠️ **First Claude API charge** (~1–3¢/plan, Sonnet 4.6, model behind an env var for easy Opus upgrade). Spec already written.
- **Slice 2:** verified-places KB tables + start seeding. Begins the development loop (lever #1).
- **Slice 3+:** add specialists one at a time (Food → Culture → Medical → Wellness → Logistics) — each is a new `Contribution` producer registered into the orchestrator; no rewrite (contract is fixed).
- **Across slices:** stand up the capture → rating → exemplar/eval loop (levers #2–5) so the team actually compounds.

## Cost gate (why frozen)
Project is in a **$0 build phase**. The Claude API is the only usage-billed piece and has no free tier. Building agent *definitions/prompts/KB schema* is free; **activating generation (Slice 1) is the first real charge** (small — coffee-money/month at low traffic, but not $0). Unfreeze when the founder is ready to start that charge. See `[[zero-cost-build-phase]]`.

## Relationship to current code
- Current `js/schedule.js` is a template generator; `result.html` renders a hardcoded `DAYS` demo (not personalized). The earlier "wire the template generator into result.html" task is therefore a **throwaway** under this vision — skip it and go straight to Slice 1 when unfrozen.
- `/api/schedule.js` (Claude backend) already exists but is unwired — it becomes the Orchestrator.
