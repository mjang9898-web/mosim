// POST /api/schedule  — body: the planner state (care/trip/experiences/cuisine)
// → { schedule: [ { day, title, cat, slots:[{t,place}] } ] }   cat ∈ care|rest|explore|travel
import Anthropic from '@anthropic-ai/sdk';
// The system prompt is COMPILED from the human-edited training notes in training/*.md
// by scripts/build-itinerary-prompt.mjs (runs in `npm run build`). To train the
// planner, edit training/*.md — not this file.
import { SYSTEM_PROMPT } from './_lib/itinerary-prompt.generated.js';
import { buildTravelerBrief } from './_lib/traveler-brief.js';
import { enforceRateLimit } from './_lib/rate-limit.js';

// Itinerary generation runs ~28s for rich multi-city plans; allow headroom so
// Vercel doesn't kill the function before the model finishes (Hobby max = 60s).
export const config = { maxDuration: 60 };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const MODEL = 'claude-sonnet-4-6';
const CATS = ['care', 'rest', 'explore', 'travel'];

function safePayload(state) {
  // care.note INTENTIONALLY KEPT here: it is sent to the model to inform schedule
  // generation (it can carry real planning context, e.g. "knee replacement in
  // March, needs PT"). This endpoint does NOT persist anything — care.note never
  // reaches the DB. The DB save path (api/save-itinerary.js) strips it. See PLAN.md.
  let s = {};
  try { s = JSON.parse(JSON.stringify(state || {})); } catch (e) { s = {}; }
  return s;
}

// If the traveler picked explicit dates, derive an exact day count so the
// itinerary length matches the result-page calendar (Day N → real dates).
// Defensive: any parse issue → returns '' (instruction simply omitted).
function tripDaysInstruction(state) {
  try {
    const when = state && state.trip && state.trip.when;
    if (!when || when.mode !== 'dates') return '';
    const start = when.dates && when.dates.start;
    const end = when.dates && when.dates.end;
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    if (!ISO.test(start) || !ISO.test(end)) return '';
    const s = Date.parse(start + 'T00:00:00Z');
    const e = Date.parse(end + 'T00:00:00Z');
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return '';
    let n = Math.round((e - s) / 86400000) + 1; // inclusive day count
    if (!Number.isFinite(n) || n < 3 || n > 21) return ''; // clamp to sane range
    return `This trip is exactly ${n} days (arriving ${start}, departing ${end}). Return exactly ${n} day objects in "days", Day 1 = arrival day, Day ${n} = departure day.`;
  } catch (e) {
    return '';
  }
}

function extractJSON(text) {
  let t = String(text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

// Coerce the model output into the exact shape result.html expects.
function normalize(parsed) {
  const days = Array.isArray(parsed?.days) ? parsed.days : [];
  return days.map((d, i) => {
    const cat = CATS.includes(d?.cat) ? d.cat : 'explore';
    const slots = Array.isArray(d?.slots) ? d.slots
      .filter((s) => s && (s.place || s.t))
      .map((s) => ({ t: String(s.t || '').slice(0, 40), place: String(s.place || '').slice(0, 400) }))
      : [];
    return {
      day: String(d?.day || ('Day ' + (i + 1))).slice(0, 24),
      title: String(d?.title || 'Your day in Korea').slice(0, 120),
      cat,
      slots: slots.length ? slots : [{ t: '', place: 'A gentle day, planned with you' }]
    };
  }).filter((d) => d.title);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Paid Claude call — throttle hardest. A normal funnel run hits this 1–2 times,
  // so 5 / 5min per IP leaves generous headroom while blunting rapid hammering.
  if (enforceRateLimit(req, res, { key: 'schedule', limit: 5, windowMs: 5 * 60 * 1000 })) return;
  if (!client) {
    console.error('[api/schedule] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const state = safePayload(req.body);
  if (JSON.stringify(state).length > 8000) {
    return res.status(413).json({ error: 'State payload too large' });
  }

  const daysHint = tripDaysInstruction(state);
  // Send a human-readable brief (every code translated to plain English),
  // NOT raw JSON codes — so the model recognizes every input, including all
  // experiences and Beyond-Seoul destinations like Jeju.
  const brief = buildTravelerBrief(state);
  const userContent =
    'Here is the traveler’s plan. Generate their itinerary as the JSON object described.\n\n'
    + brief
    + (daysHint ? '\n\n' + daysHint : '');

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      messages: [
        { role: 'user', content: userContent }
      ]
    });

    const textBlock = (response.content || []).find((b) => b.type === 'text');
    if (!textBlock) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    let parsed;
    try {
      parsed = extractJSON(textBlock.text);
    } catch (e) {
      console.error('[api/schedule] JSON parse failed:', String(textBlock.text).slice(0, 600));
      return res.status(502).json({ error: 'Model returned invalid JSON' });
    }

    const days = normalize(parsed);
    if (!days.length) {
      return res.status(502).json({ error: 'Model response had no days' });
    }

    return res.status(200).json({ schedule: days });
  } catch (e) {
    const status = e?.status;
    if (status === 429) return res.status(429).json({ error: 'Rate limited, retry shortly' });
    console.error('[api/schedule] generation failed:', e?.message || e);
    return res.status(502).json({ error: 'Schedule generation failed' });
  }
}
