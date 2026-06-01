# Mosim AI Org — Vision (DESIGN FROZEN)

**Date:** 2026-05-29 · **Revised:** 2026-06-01 (4 → 5 departments; 3-plane framing)
**Status:** **DESIGN FROZEN.** Top-level company vision: run Mosim as a one-person company operated through **five departments** on a shared data backbone, with the founder as the connective tissue (CEO/orchestrator). Most of this is intentionally *not built yet*; this doc preserves the big picture so individual tracks can be built one at a time.
**North star:** governed by `2026-06-01-mosim-product-definition.md` — every department serves *"미국 은퇴 시니어를 위한 의료-우선 풀서비스 프라이빗 컨시어지."*

## The core insight: "AI team" means three different things

The mess came from treating all departments as the same kind of "AI team." They are not. There are **three planes**, and only two of them are genuine agent teams:

| Plane | Analogy | Where it runs | What it is | A real "agent team"? |
|-------|---------|---------------|------------|----------------------|
| **A. Build agents** | 시공팀 (builds the building, then leaves) | Founder's laptop — Claude Code (`.claude/`) | Builds/maintains the Mosim *software* | ✅ Yes |
| **B. Runtime product AI** | the machine that serves guests 24/7 | Vercel backend — Claude API (`api/`) | Auto-generates the customer's plan | ✅ Yes (but it's server code) |
| **C. Back-office ops** | 장부·서류함·계산기 + 똑똑한 비서 | Founder asks AI for help, on demand | Runs the money / people / promotion | ❌ No — data + tools + AI-assist |

**Rule:** build A and B as agent teams. Do **NOT** "agentify" C (Finance/Marketing/HR) — that is exactly the over-building trap that created the clutter. C = a **data model + tool integrations + the founder using AI as an assistant**.

## The five departments

| # | Department | Plane | What it does | Status |
|---|------------|-------|--------------|--------|
| 1 | **Development** (front/back) | **A. Build agents** (Claude Code) | Builds the site — front/back end. | ✅ **Built** — `mosim-orchestrator` + 4 agents (frontend-builder, backend-engineer, visual-qa, content-designer) in `.claude/`. Cleaned 2026-06-01 (unused vercel/React skills pruned). |
| 2 | **Itinerary** (Medical / Culture&Experience / Food&Beverage / Logistics) | **B. Runtime product AI** (Claude API) | Plans the customer's trip when they finish the funnel — the AI "before" brain. | 🧊 **Design frozen** — 6-specialist runtime team. Build cost-deferred. See `2026-05-29-runtime-specialist-team-vision.md`. |
| 3 | **Finance / Accounting** | **C. Back-office ops** (data + integrations, AI-assisted) | Recognize site payments → **per-trip P&L** → accurate bookkeeping → **USD + KRW settlement** (cost & revenue) → **balance sheet**; shares data with other departments. | 🌱 **Foundation exists** — PayPal + `payment_groups`/`payments`. **Next most grounded track.** Reuse the proven **turo-dashboard accounting pattern** (revenue recognition / deferred revenue / clearing balance): concierge fee = deferred revenue recognized on trip delivery; actuals paid by customer direct to vendors = pass-through/clearing (not Mosim revenue). |
| 4 | **Marketing** | **C. Back-office ops** (channels + content, AI-assisted) | Reach US seniors with the right promotion. Target is clear; the channels are not ours. | ⬜ **New.** First task = **research where US seniors actually are** (their media/SNS), since they differ from Korean channels. Then content + trust-building. Spend is real money → respects the $0 phase (research is free; ads are not). |
| 5 | **HR** | **C. Back-office ops** (HRIS, for **human** staff) | Onboarding, payroll, attendance — for future *human* staff (interpreters, drivers). | ⬜ **Last — premature now.** 0 human employees today. Build only when hiring begins (data model first). |

## "Organic / 유기적" — the honest version
Today's AI does **not** autonomously run a company or self-coordinate departments. The real, buildable version of "running organically":
1. **Shared data backbone** (Supabase) — every department reads/writes the same data. Customers/leads → Itinerary reads; payments → Finance reads. ~Half already exists.
2. **Cockpit dashboard** — one founder console showing all departments. (Shell built 2026-05-29; live metrics + role-gating to come.)
3. **Founder = CEO/orchestrator** — the connective tissue between departments, for now. The system is built so it *can* grow more autonomous over time, but it does not start autonomous.

## Build order (all $0-frozen until each track is unblocked)
1. **Development** — ✅ running (and now cleaned).
2. **Itinerary** — 🧊 frozen; unfreeze = first Claude API charge (Slice 1). Cost-gated.
3. **Finance** — 🌱 next: sits on payment data already live; useful as soon as real money flows. Data model (revenue/cost/payout, dual-currency) + reports + the cockpit's first live tile.
4. **Marketing** — ⬜ after a working site exists to send traffic to. Channel research is $0 and can start anytime; paid promotion waits.
5. **HR** — ⬜ last: only when human employees exist. Just a data-model placeholder until then.

> Note: the actual near-term work is the agreed rebuild plan (product definition ✅ → tool cleanup ✅ → rebuild screens). These departments are mostly **design/placeholders** until each is individually unblocked. Build one at a time; do not stand them all up at once.

## Connective layer: the Cockpit
`/cockpit.html` — founder-only internal console (NOT a customer funnel page; the "no new pages" funnel rule doesn't apply to internal tooling). Shell = department tiles with status. Live metrics (e.g., total itineraries, concierge revenue) need a founder-authenticated aggregate API (`/api/cockpit-stats`) because RLS scopes normal reads to the owner — that's a follow-up, not in the shell.

## Cross-refs
- North star: `2026-06-01-mosim-product-definition.md` / `[[project-product-definition]]`
- Itinerary dept detail: `[[runtime-specialist-team]]` / `2026-05-29-runtime-specialist-team-vision.md`
- Dev dept: the harness in `.claude/agents` + `.claude/skills/mosim-*` (CLAUDE.md 하네스 pointer)
- Finance foundation + pattern: `[[project_payment_gate]]` + the `turo-dashboard` skill (accrual/clearing ledger)
- Cost discipline: `[[zero-cost-build-phase]]` — building shells/definitions/data-models is $0; activating Claude API (Itinerary) is the first charge.
