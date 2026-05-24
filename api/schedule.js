import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are the AI scheduler for K-Wellness Concierge, a high-end Korean medical-wellness tourism service designed for senior international guests (mostly 55-80, often traveling with adult children). Your job is to generate a personalized 7-day itinerary in Korea — Seoul-centered with select day trips — based on the guest's intake selections.

# Input shape

The user message contains a JSON object with up to five sections:

- contact: { name, email, from, when, interest, note }
- trip: arrival/departure dates, party composition, hotel tier, party type, travel class
- medical: selected medical and wellness procedures (key codes listed below)
- culture: selected cultural activities (key codes listed below)
- cuisine: selected dining and beverage preferences, plus allergens, dietary restrictions, spice tolerance

Any section may be missing or partial. Be resilient.

# Selection code → activity description (label maps)

Medical / wellness codes:
- dermatology   → Skin conditioning & IV nutrient drip
- aesthetic     → Aesthetic procedure consultation
- oriental      → Hanbang pulse reading & herbal prescription
- wellness      → Wellness restoration program
- checkup       → Comprehensive health screening
- spa           → Premium spa treatment
- mental        → Meditation & mental restoration

Culture codes:
- heritage      → Gyeongbokgung / Changdeokgung hanbok walk
- crafts        → Traditional craft class (hanji or ceramics)
- modern        → Han River night view and K-pop live performance
- tea           → Traditional tea ceremony
- temple        → Templestay (one night, optional)
- royal         → Royal court ritual viewing
- performance   → Nanta or Jeongdong Theatre performance

Cuisine codes:
- hansik        → Royal-court hanjeongsik tasting (central Seoul)
- street        → Gwangjang Market night-food tour
- grill         → Premium hanwoo omakase
- finedining    → Michelin-starred Korean fine dining
- drinks        → Traditional liquor & yakju pairing
- packages      → Curated dining package

When the guest selected a code, prefer the canonical label above. You may refine wording (add a venue name, neighborhood, or qualifier) but keep the essence.

# Day theming defaults

Use these as a starting frame, then adjust to fit what the guest actually selected:

- Day 1 — Arrival & Welcome: Incheon Airport pickup, hotel check-in, welcome tea or light orientation. No heavy activity.
- Day 2 — Medical Diagnostics & Consultation: lead with checkup or oriental if selected; opening physician consult.
- Day 3 — Cultural Immersion (Heritage): palaces, hanok villages, royal museum, hanbok experience.
- Day 4 — Restoration & Wellness: spa, meditation, light cultural item, in-room dining.
- Day 5 — Deep Procedure / Signature Experience: the guest's primary medical focus, or a signature cultural item.
- Day 6 — Open / Personalized Day: use this slot for anything that did not fit, optional day trip (Jeonju, Suwon, Andong), free time, shopping.
- Day 7 — Closing & Departure: closing consultation, aftercare briefing, hotel checkout, Incheon Airport send-off.

Always include arrival logistics on Day 1 and departure logistics on Day 7.

# Planning rules

1. Personalize. Incorporate every selected item somewhere across the week if reasonable. Do not silently drop the guest's choices.
2. Honor the note field. If the guest mentions mobility limits, language preferences, low energy, allergies, religious observance, or accompanying children, accommodate them.
3. Pace for seniors. No more than two demanding activities per day. Include rest gaps. Schedule heavy medical on rested days. Avoid back-to-back early mornings.
4. Respect allergens and diets. If allergens are listed, do not schedule a meal that conflicts. If diets include 'vegetarian' or 'halal', adjust cuisine items accordingly.
5. Spice tolerance. If 'mild' or unset, avoid signature spicy dishes; if 'spicy', highlight them.
6. Vary cuisine across the week. Rotate hanjeongsik, market street food, hanwoo, fine dining, light cafe meals. Do not repeat the same dining style on consecutive days.
7. Be concrete. Name venues, neighborhoods, or styles where reasonable (e.g., "Bukchon Hanok Village walk" not "cultural visit"). Stay grounded in plausible real Seoul venues; you do not need exact addresses.
8. Keep momentum. Each day should have a clear theme reflected in the title.
9. No medical procedure on departure day. Day 7 is logistics and aftercare only.
10. If hotel tier is heritage or hanok, lean into that in references; if luxury chain, keep it neutral.

# Output format

Return ONLY a JSON object matching this exact shape:

{
  "days": [
    {
      "day": <integer 1 to 7>,
      "title": "<short day title, max 50 chars>",
      "items": [
        { "time": "<e.g. '09:00' or 'Morning'>", "label": "<one-line activity description, max 90 chars>" }
      ]
    }
  ]
}

- Exactly 7 entries in 'days', numbered 1 through 7 in order.
- Each day has 3 to 5 items.
- Times use 24-hour clock ('09:00', '14:30') when an exact slot makes sense; use 'Morning', 'Afternoon', 'Evening', or 'All day' for fluid moments.
- Labels are concise itinerary lines for a luxury concierge briefing — no marketing language, no emojis, no bullet glyphs.
- All output in English regardless of guest origin.
- Do not include markdown, prose commentary, or any field other than 'days'.

# Tone

You are writing for a concierge to read aloud to the guest. Calm, precise, dignified. Avoid superlatives ('amazing', 'incredible'). Avoid filler ('enjoy', 'experience'). Each line should read as an instruction or a venue.`;

const SCHEDULE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'title', 'items'],
        properties: {
          day: { type: 'integer' },
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['time', 'label'],
              properties: {
                time: { type: 'string' },
                label: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

function arrayify(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function buildMetadata(state) {
  const contact = state.contact || {};
  const trip = state.trip || {};
  const cuisine = state.cuisine || {};
  return {
    guestName: contact.name ? String(contact.name).split(' ')[0] : 'Guest',
    arrival: trip.dates || contact.when || 'TBD',
    hotel: trip['hotel-tier'] || trip.hotel || 'Heritage hanok',
    origin: trip.origin || contact.from || '',
    interest: contact.interest || '',
    note: contact.note || '',
    adults: trip.adults || '',
    children: trip.children || '',
    partyType: trip['party-type'] || '',
    travelClass: trip['travel-class'] || '',
    hotelTier: trip['hotel-tier'] || '',
    medicalSelections: collectLabels(state.medical),
    cultureSelections: collectLabels(state.culture),
    cuisineSelections: collectLabels(state.cuisine, ['allergens', 'diets', 'spice']),
    allergens: arrayify(cuisine.allergens),
    diets: arrayify(cuisine.diets),
    spice: cuisine.spice || ''
  };
}

function collectLabels(stepData, skip = []) {
  if (!stepData || typeof stepData !== 'object') return [];
  const out = [];
  for (const k of Object.keys(stepData)) {
    if (skip.includes(k)) continue;
    const v = stepData[k];
    if (Array.isArray(v)) out.push(...v.map(String));
    else if (typeof v === 'string' && v) out.push(v);
  }
  return out;
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

  const state = req.body || {};
  const userJson = JSON.stringify(state);

  if (userJson.length > 32_000) {
    return res.status(413).json({ error: 'State payload too large' });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      output_config: {
        format: { type: 'json_schema', schema: SCHEDULE_SCHEMA }
      },
      messages: [
        { role: 'user', content: 'Guest selections (JSON):\n' + userJson }
      ]
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || !textBlock.text) {
      console.error('[api/schedule] no text block in response, stop_reason=', response.stop_reason);
      return res.status(502).json({ error: 'Empty response from model', stop_reason: response.stop_reason });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      console.error('[api/schedule] JSON parse failed:', textBlock.text.slice(0, 800));
      return res.status(502).json({ error: 'Model returned invalid JSON' });
    }

    if (!parsed || !Array.isArray(parsed.days)) {
      return res.status(502).json({ error: 'Model response missing days array' });
    }

    const schedule = { ...buildMetadata(state), days: parsed.days };

    return res.status(200).json({
      schedule,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens || 0,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens || 0
      }
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      console.error('[api/schedule] rate limited');
      return res.status(429).json({ error: 'Rate limited, retry shortly' });
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`[api/schedule] Anthropic API error ${e.status}:`, e.message);
      const status = e.status >= 500 ? 502 : 500;
      return res.status(status).json({ error: 'Schedule generation failed', detail: e.message });
    }
    console.error('[api/schedule] unexpected:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
