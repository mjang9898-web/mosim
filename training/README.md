# Training the Mosim itinerary AI

This folder is how you **train** the AI that builds each traveler's day-by-day plan.
You write the training notes here, in plain language. When the site is deployed,
these notes are **automatically compiled into the AI's instructions** — so editing
a note here and pushing actually changes how the AI plans.

## Honest expectations (important)

- The planner runs on **Claude** (via the Anthropic API). You are **not** retraining
  the model itself — today's AI cannot autonomously learn or update its own weights.
- What you *can* do is **teach it** — and that's actually the better, controllable path.
  "Training" here = a compounding, human-driven loop:
  1. **Trusted knowledge** — give each specialist the real places, hospitals, foods,
     durations, and routes Mosim actually uses (the biggest quality lever).
  2. **Do / Don't rules** — tell each specialist what to always do and never do.
  3. **Examples** — paste an ideal plan/snippet; the AI imitates the style.
  4. **Feedback log** — after you see a generated plan, write what to change.
     Claude Code folds your feedback into the rules above.
- Nothing here implies the AI improves on its own. **You are the trainer.**

## The team (mirrors the frozen 6-agent vision)

| File | Agent | Trains… |
|---|---|---|
| `00-orchestrator.md` | **Itinerary Composer** | how the whole trip is shaped & harmonized |
| `01-medical-coordinator.md` | **Medical Coordinator** | screening, knees, dental, eyes, recovery |
| `02-wellness-hanbang.md` | **Wellness & Hanbang** | spa, rest, gentle traditional-medicine care |
| `03-food-beverage.md` | **Food & Beverage** | meals, dietary needs, spice, real spots |
| `04-culture-experience.md` | **Culture & Experience** | palaces, markets, nature, day trips |
| `05-logistics-concierge.md` | **Logistics & Concierge** | arrival/departure, hotels, transport, access |

Each specialist contributes its expertise; the **Composer (orchestra)** weaves them
into one coherent, gently-paced itinerary built around the traveler's care.

> Today all six run inside **one** Claude call (each is a clearly-labeled section of
> the AI's instructions — cheap, one call per plan). Later they can become separate
> calls that each propose their domain and the Composer merges them — the notes here
> already support that, no rewrite of your training needed.

## How to train an agent

1. Open the agent's `.md` file.
2. Edit the **Rules**, **Trusted places**, **Style**, or **Examples** sections in
   plain English.
3. Everything **above** the `## Feedback log` line is sent to the AI. The Feedback
   log is just your private changelog (the AI never sees it).
4. Deploy (push to `main`). The build recompiles the notes into the AI's instructions
   automatically — the next plan reflects your edits.

## What is fixed (and why)

The **output format** (the JSON shape the website needs), the **medical-safety
guardrail** (never give medical advice/diagnoses/guarantees), and the **input codes**
(how funnel answers map to meaning) are fixed in `scripts/build-itinerary-prompt.mjs`,
not here — so a note edit can't accidentally break the website or the safety rule.

## Files

- Notes you edit: `training/*.md`
- Compiler (don't edit unless changing the contract): `scripts/build-itinerary-prompt.mjs`
- Generated instructions (don't edit by hand): `api/_lib/itinerary-prompt.generated.js`
- The endpoint that uses it: `api/schedule.js`
