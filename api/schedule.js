// POST /api/schedule  — body: the planner state (care/trip/experiences/comfort)
// → { schedule: [ { day, title, cat, slots:[{t,place}] } ] }   cat ∈ care|rest|explore|travel
import Anthropic from '@anthropic-ai/sdk';
// The system prompt is COMPILED from the human-edited training notes in training/*.md
// by scripts/build-itinerary-prompt.mjs (runs in `npm run build`). To train the
// planner, edit training/*.md — not this file.
import { SYSTEM_PROMPT } from './_lib/itinerary-prompt.generated.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const MODEL = 'claude-sonnet-4-6';
const CATS = ['care', 'rest', 'explore', 'travel'];

function safePayload(state) {
  // Privacy: the free-text care note is client-only — never send it onward.
  let s = {};
  try { s = JSON.parse(JSON.stringify(state || {})); } catch (e) { s = {}; }
  if (s.care && typeof s.care === 'object') delete s.care.note;
  return s;
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
      .map((s) => ({ t: String(s.t || '').slice(0, 40), place: String(s.place || '').slice(0, 160) }))
      : [];
    return {
      day: String(d?.day || ('Day ' + (i + 1))).slice(0, 24),
      title: String(d?.title || 'Your day in Korea').slice(0, 80),
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
  if (!client) {
    console.error('[api/schedule] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const state = safePayload(req.body);
  if (JSON.stringify(state).length > 8000) {
    return res.status(413).json({ error: 'State payload too large' });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      messages: [
        { role: 'user', content: 'Here is the traveler’s plan. Generate their itinerary as the JSON object described.\n\n' + JSON.stringify(state) }
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
