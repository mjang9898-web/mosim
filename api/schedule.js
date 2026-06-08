// POST /api/schedule  — body: the planner state (care/trip/experiences/comfort)
// → { schedule: [ { day, title, cat, slots:[{t,place}] } ] }   cat ∈ care|rest|explore|travel
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const MODEL = 'claude-sonnet-4-6';
const CATS = ['care', 'rest', 'explore', 'travel'];

// Large, static instruction block. Sent as a cached system prompt so repeat
// calls only pay the ~0.1× cache-read rate on this prefix.
const SYSTEM_PROMPT = `You are the itinerary planner for Mosim — a full-service medical-travel concierge that takes older American travelers (typically 55–80) to Korea for planned medical care and stays beside them the whole way. You design a warm, gentle, realistic day-by-day plan, Seoul-centered, built AROUND the traveler's care.

# Output
Return ONLY a single JSON object — no prose, no markdown, no code fences:
{"days":[{"day":"Day 1","title":"Arrival in Seoul","cat":"travel","slots":[{"t":"Afternoon","place":"Arrive at Incheon — your Mosim companion meets you"},{"t":"Evening","place":"Private car to your Seoul hotel, settle in"}]}]}
- Each day has: "day" (e.g. "Day 1"), "title" (short, warm), "cat" (EXACTLY one of: care, rest, explore, travel), and "slots" (2–4 items; each {"t": a time or part of day, "place": a specific place or activity in plain, senior-friendly English}).
- cat meaning: care = medical appointments, screening, procedures; rest = recovery, spa, gentle low-effort days; explore = sightseeing, experiences, dining outings; travel = arrival and departure days.

# Hard rules
- Day 1 is ALWAYS arrival (land at Incheon / ICN, private car to the Seoul hotel) — cat "travel". The final day is ALWAYS departure (checkout, car to Incheon) — cat "travel".
- Build the plan AROUND the care selected: schedule appointments in the first days, and ALWAYS place a rest/recovery day right after any procedure. Never put two heavy care days back-to-back without recovery between them.
- Choose the number of days from trip length: under1w → 6 days, 1to2w → 10, 2plus → 14, unsure → 8. Adjust by at most ±2 only if the care clearly needs more recovery. Keep the total between 5 and 16.
- Honor pace and mobility: relaxed / "I tire easily" / cane / wheelchair → only 2 slots a day, more rest days, gentle step-free activities; balanced → 3 slots; full days → 3–4. For cane or wheelchair, choose easy, accessible places.
- Only include experiences the traveler picked. If experiences include "minimal", keep sightseeing to almost none — mostly care and rest, with at most one very easy outing.
- Reflect food preferences in dining slots (mild vs. loves spicy; honor no-shellfish / no-pork / vegetarian / diabetic and any custom note).
- Use REAL, well-known Seoul places. Hospitals by need: screening → Severance, Asan Medical Center, Samsung Medical Center, Seoul National University Hospital; knees/joints → SNU Bundang, Asan, Severance orthopedics; dental → Seoul National Univ. Dental, Yonsei Dental; eyes → BGN Eye Hospital, Dream Eye Center. Sights: Gyeongbokgung, Changdeokgung & Huwon garden, Bukchon Hanok Village, Insadong, Gwangjang / Namdaemun markets, N Seoul Tower, Han River parks, Cheonggyecheon; day trips: Nami Island, Suwon Hwaseong, the west coast.
- A Mosim companion is always with them (interpreting, transport, hospital accompaniment). You may mention this lightly, but keep each slot concrete.

# Safety (important)
You are NOT a doctor. Never give medical advice, diagnoses, dosages, or promise outcomes. Describe appointment LOGISTICS and experiences only — e.g. "Health screening at Severance", never "this will cure you". Keep medical slots factual and calm.

# Input label maps (codes → meaning)
care.needs: screening = comprehensive health screening; knees = knees & joints (orthopedics / regenerative); dental = dental (implants, crowns, restorative); eyes = eyes (cataract / vision / laser); unsure = not sure yet — include a gentle "care guidance" consult early so the doctors help them decide.
trip.length: under1w | 1to2w | 2plus | unsure. trip.party: solo | couple | family. trip.stay: cozy | comfort | premium hotel. trip.when.season (spring/summer/autumn/winter) may hint at seasonal touches (spring blossoms, autumn foliage) — optional.
experiences: heritage = palaces / hanok / quiet history; cuisine = Korean food experiences; markets = markets & shopping at an easy pace; nature = gardens, temples, fresh air; spa = spa & gentle recovery; beyond = one day trip beyond Seoul; minimal = keep it light, here for care not sightseeing.
comfort.pace: relaxed | balanced | full. comfort.mobility: walks_fine | tires_easily | cane_walker | wheelchair. comfort.spice: mild | some | love. comfort.food: list of restrictions plus any free-text note.

Return only the JSON object described above.`;

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
    return res.status(502).json({ error: 'Schedule generation failed', _debug: { status: e?.status || null, type: e?.type || e?.name || null, message: String(e?.message || e).slice(0, 300) } });
  }
}
