# Mosim AI Org — Vision (DESIGN FROZEN)

**Date:** 2026-05-29
**Status:** **DESIGN FROZEN.** Top-level company vision: run Mosim as four departments on a shared data backbone, with the founder as the connective tissue (CEO/orchestrator). Most of this is intentionally *not built yet*; this doc preserves the big picture so individual tracks can be built one at a time.

## The four departments

| # | Department | Nature | What it does | Status |
|---|------------|--------|--------------|--------|
| 1 | **Development** | **AI agent team** (Claude Code) | Builds the site — front/back end. | ✅ **Built** — `mosim-orchestrator` + 4 agents (frontend-builder, backend-engineer, visual-qa, content-designer) in `.claude/`. |
| 2 | **Itinerary** (Medical / Food / Culture&Experience / Logistics) | **AI agent team** (Claude API) | Plans the customer's trip when they finish "Plan Korea". | 🧊 **Design frozen** — 6-specialist runtime team. Build cost-deferred. See `2026-05-29-runtime-specialist-team-vision.md`. |
| 3 | **Finance / Accounting** | **Business-ops system** (data + integrations, AI-assisted) | Revenue/cost tracking, payment reconciliation, invoicing, tax. | 🌱 **Foundation exists** — PayPal + `payment_groups`/`payments`. Department not started. **Next most grounded track.** |
| 4 | **HR** | **Business-ops system** (HRIS, for **human** staff) | Onboarding, payroll, attendance — for future *human* employees. | ⬜ **Not started — premature.** 0 human employees today. Build only when hiring begins (data model first). |

## Critical distinction (avoid over-building)
- **1 & 2 are genuine AI agent teams** — build them as agents (Claude Code / Claude API).
- **3 & 4 are operational systems**, not "agent teams." AI *assists inside them* (categorize transactions, summarize, draft) but the core is a **data model + tool integrations** (PayPal/accounting SW for Finance; an HRIS for HR). Do **not** "agentify" these — it wastes effort where data + integrations serve better.

## "Organic / 유기적" — the honest version
Today's AI does **not** autonomously run a company or self-coordinate departments. The real, buildable version of "running organically":
1. **Shared data backbone** (Supabase) — every department reads/writes the same data. Customers/leads → Itinerary reads; payments → Finance reads. ~Half already exists.
2. **Cockpit dashboard** — one founder console showing all four departments. (Shell built 2026-05-29; live metrics + role-gating to come.)
3. **Founder = CEO/orchestrator** — the connective tissue between departments, for now. The system is built so it *can* grow more autonomous over time, but it does not start autonomous.

## Build order (all $0-frozen until each track is unblocked)
1. **Development** — ✅ running.
2. **Itinerary** — 🧊 frozen; unfreeze = first Claude API charge (Slice 1). Cost-gated.
3. **Finance** — 🌱 next: it sits on the payment data already live and becomes useful as soon as real money flows. A data model (revenue/cost/payout) + reports + the cockpit's first live tile.
4. **HR** — ⬜ last: only when human employees exist. Just a data-model placeholder until then.

## Connective layer: the Cockpit
`/cockpit.html` — founder-only internal console (NOT a customer funnel page; the "no new pages" funnel rule doesn't apply to internal tooling). Shell = 4 department tiles with status. Live metrics (e.g., total itineraries, concierge revenue) need a founder-authenticated aggregate API (`/api/cockpit-stats`) because RLS scopes normal reads to the owner — that's a follow-up, not in the shell.

## Cross-refs
- Itinerary dept detail: `[[runtime-specialist-team]]` / `2026-05-29-runtime-specialist-team-vision.md`
- Dev dept: the harness in `.claude/agents` + `.claude/skills/mosim-*` (CLAUDE.md 하네스 pointer)
- Finance foundation: `[[project_payment_gate]]`
- Cost discipline: `[[zero-cost-build-phase]]` — building shells/definitions/data-models is $0; activating Claude API (Itinerary) is the first charge.
