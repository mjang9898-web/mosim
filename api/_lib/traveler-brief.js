// Turns the raw funnel state into a clear, human-readable "traveler brief" for
// the itinerary planner. We do NOT send raw codes to the model anymore — codes
// like "jeju" or "tires_easily" are opaque and silently dropped. Every input is
// translated to plain English here so the AI can honor all of it.
//
// Label sources are GENERATED from the same funnel literals the website renders
// (api/_lib/experience-labels.generated.js, built from js/step3-culture.jsx +
// js/step4-cuisine.jsx) so the brief vocabulary can never drift from the funnel.
//
// Unknown / unmapped codes are passed through with a best-effort label
// (humanized code) — never silently dropped.
import {
  EXPERIENCE_LABELS,
  ALLERGEN_LABELS,
  DIET_LABELS,
  CUISINE_LABELS,
} from './experience-labels.generated.js';

// ── small label tables for the inputs that have fixed funnel vocabularies ──
const CARE_LABELS = {
  screening: 'comprehensive health checkup',
  knees: 'knees & joints (orthopedics / regenerative)',
  dental: 'dental (implants, crowns, restorative)',
  eyes: 'vision care (cataract / laser correction)',
  derm: 'dermatology & skin treatments (laser, pigmentation, K-skin)',
  hanbang: 'Korean traditional medicine (hanbang) — acupuncture, herbal care',
  hair: 'hair restoration (PRP / FUE transplant)',
  iv: 'IV nutrient therapy (wellness drips)',
  aesthetic: 'aesthetic medicine (Botox, filler, skin boosters)',
  plastic: 'plastic / cosmetic surgery (consult + procedure)',
  stemcell: 'stem-cell & regenerative treatment (joints, longevity)',
  unsure: 'not sure yet — wants a gentle care-guidance consult early',
};

const LENGTH_LABELS = {
  under1w: 'under 1 week',
  '1to2w': '1 to 2 weeks',
  '2plus': '2 weeks or more',
  unsure: 'length not decided',
};

const PARTY_LABELS = {
  solo: 'travelling solo',
  couple: 'a couple',
  family: 'a family',
};

const STAY_LABELS = {
  cozy: 'cozy / budget-friendly hotel',
  comfort: 'comfortable mid-range hotel',
  premium: 'premium hotel',
};

const SEASON_LABELS = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
};

const PACE_LABELS = {
  relaxed: 'relaxed (few things per day)',
  balanced: 'balanced',
  full: 'full days (wants to see a lot)',
};

const MOBILITY_LABELS = {
  walks_fine: 'walks fine',
  tires_easily: 'tires easily — keep days short with rest',
  cane_walker: 'uses a cane or walker — step-free, gentle routes only',
  wheelchair: 'uses a wheelchair — fully accessible, step-free routes only',
};

// Cuisine spice scale (SPICE_LEVELS in js/step4-cuisine.jsx) — the single,
// canonical 5-level scale. (The old 4-level comfort.spice is deprecated; see
// LEGACY_SPICE_MAP below for one-time backward-compat of old saved itineraries.)
const CUISINE_SPICE_LABELS = {
  none: 'no spice — hold the gochugaru',
  mild: 'mild — a whisper of warmth',
  medium: 'Korean medium — how locals eat',
  spicy: 'spicy',
  extra: 'maximum heat — bring it on',
};

// Backward-compat ONLY: old saved state carried the coarse 4-level comfort.spice
// (none|mild|some|love). Map it onto the canonical 5-level cuisine scale so an
// old itinerary's spice preference still reaches the planner. New funnel state
// never sets comfort.spice — it writes cuisine.spice directly.
const LEGACY_SPICE_MAP = {
  none: 'none',
  mild: 'mild',
  some: 'medium',
  love: 'spicy',
};

// Humanize an unknown code into a readable best-effort label.
function humanize(code) {
  return String(code || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'an unspecified preference';
}

function labelExperience(code) {
  const known = EXPERIENCE_LABELS[code];
  if (known) return known;
  // Unknown experience code: pass through, best-effort, flagged seoul by default.
  return { name: humanize(code), group: 'Other', region: 'seoul', meta: '' };
}

// "Signature Golf Course Round (Full day · 18 holes)" — name plus its duration/
// intensity tag so the planner can respect how long & how heavy each outing is.
function expWithMeta(e) {
  const meta = (e.meta || '').trim();
  return meta ? `${e.name} (${meta})` : e.name;
}

function labelFood(code) {
  return DIET_LABELS[code] || ALLERGEN_LABELS[code] || humanize(code);
}

// state -> a plain-English brief string covering EVERY input.
export function buildTravelerBrief(state) {
  const s = state || {};
  const lines = [];

  // ── Care ──
  const care = s.care || {};
  const needs = Array.isArray(care.needs) ? care.needs : [];
  if (needs.length) {
    lines.push('CARE NEEDS: ' + needs.map((c) => CARE_LABELS[c] || humanize(c)).join('; ') + '.');
  } else {
    lines.push('CARE NEEDS: none specified.');
  }
  // care.note goes to the MODEL for planning only — it is NEVER persisted to the
  // DB (the save path in api/save-itinerary.js strips it). See PLAN.md.
  if (care.note && String(care.note).trim()) {
    lines.push('CARE NOTE (in their own words): "' + String(care.note).trim() + '"');
  }

  // ── Trip ──
  const trip = s.trip || {};
  const tripBits = [];
  const when = trip.when || {};
  if (when.mode === 'dates' && when.dates && when.dates.start && when.dates.end) {
    tripBits.push('travelling ' + when.dates.start + ' to ' + when.dates.end);
  } else {
    tripBits.push('dates flexible');
  }
  if (trip.length) tripBits.push('expected length: ' + (LENGTH_LABELS[trip.length] || humanize(trip.length)));
  if (when.season) tripBits.push('season: ' + (SEASON_LABELS[when.season] || humanize(when.season)));
  if (trip.party) tripBits.push(PARTY_LABELS[trip.party] || humanize(trip.party));
  if (trip.partySize) tripBits.push('party size: ' + trip.partySize);
  if (trip.stay) tripBits.push('stay: ' + (STAY_LABELS[trip.stay] || humanize(trip.stay)));
  tripBits.push('arriving at Incheon (ICN)');
  lines.push('TRIP: ' + tripBits.join('; ') + '.');

  // ── Experiences (grouped Seoul vs Beyond-Seoul, by real name) ──
  const exp = Array.isArray(s.experiences) ? s.experiences : [];
  if (exp.length) {
    const labeled = exp.map(labelExperience);
    const seoul = labeled.filter((e) => e.region === 'seoul');
    const beyond = labeled.filter((e) => e.region === 'beyond_seoul');

    if (labeled.some((e) => e.name === 'minimal' || /minimal/i.test(e.name)) || exp.includes('minimal')) {
      lines.push('EXPERIENCES: minimal — here mainly for care, very little sightseeing.');
    } else {
      const parts = [];
      if (seoul.length) {
        // Each carries its duration/intensity in parentheses so the planner can
        // pace the day correctly and never stack two long/heavy outings together.
        parts.push('In/around Seoul (duration in parentheses — respect it): ' + seoul.map(expWithMeta).join('; ') + '.');
      }
      if (beyond.length) {
        parts.push(
          'BEYOND SEOUL (real excursions — each may need an internal flight and/or an overnight, not a Seoul day trip): '
          + beyond.map(expWithMeta).join('; ') + '.'
        );
      }
      lines.push('EXPERIENCES THEY CHOSE (include EVERY one): ' + parts.join(' '));
    }
  } else {
    lines.push('EXPERIENCES: none chosen.');
  }

  // ── Cuisine (single source of truth for pace, mobility, spice & food) ──
  // The funnel merged the old Comfort step into Cuisine (절충안 C). pace/mobility
  // now live on cuisine; spice & dietary restrictions are the cuisine 5-level
  // scale + allergens/diets. The deprecated state.comfort slice is read ONLY as a
  // fallback for old saved itineraries / old sessionStorage — never written anew.
  const cuisine = s.cuisine || {};
  const comfort = s.comfort || {}; // legacy fallback source only

  // pace / mobility: prefer cuisine, fall back to legacy comfort.
  const pace = cuisine.pace || comfort.pace || '';
  const mobility = cuisine.mobility || comfort.mobility || '';
  const comfortBits = [];
  if (pace) comfortBits.push('pace: ' + (PACE_LABELS[pace] || humanize(pace)));
  if (mobility) comfortBits.push('mobility: ' + (MOBILITY_LABELS[mobility] || humanize(mobility)));
  if (comfortBits.length) {
    // Strong, directive framing: the traveler's stated comfort is the FIRST base
    // the AI must build the 7-day plan around (customer input = top priority).
    lines.push(
      'COMFORT (governs how full each day is and which routes are step-free — build the whole week around this): '
      + comfortBits.join('; ') + '.'
    );
  }

  // Spice: single canonical cuisine.spice (5-level). If absent but a legacy
  // comfort.spice exists, map it once onto the 5-level scale.
  let spiceCode = cuisine.spice || '';
  if (!spiceCode && comfort.spice) spiceCode = LEGACY_SPICE_MAP[comfort.spice] || comfort.spice;
  if (spiceCode) {
    lines.push('SPICE LEVEL (match this in every meal): ' + (CUISINE_SPICE_LABELS[spiceCode] || humanize(spiceCode)) + '.');
  }

  // Dietary restrictions: cuisine.allergens + cuisine.diets are the source. If
  // BOTH are empty but a legacy comfort.food array exists, surface it as
  // free-text restrictions so an old itinerary's restrictions still reach the AI.
  const cAllergens = Array.isArray(cuisine.allergens) ? cuisine.allergens : [];
  const cDiets = Array.isArray(cuisine.diets) ? cuisine.diets : [];
  if (cAllergens.length) {
    const al = cAllergens.map((c) => ALLERGEN_LABELS[c] || humanize(c));
    lines.push('ALLERGENS (strict — never serve these, brief every kitchen): ' + al.join('; ') + '.');
  }
  if (cDiets.length) {
    const dl = cDiets.map((c) => DIET_LABELS[c] || humanize(c));
    lines.push('DIET / RELIGION (honor without exception): ' + dl.join('; ') + '.');
  }
  if (!cAllergens.length && !cDiets.length) {
    const legacyFood = Array.isArray(comfort.food) ? comfort.food : [];
    if (legacyFood.length) {
      const labeled = legacyFood.map((c) => {
        const known = DIET_LABELS[c] || ALLERGEN_LABELS[c];
        return known || String(c).trim();
      }).filter(Boolean);
      if (labeled.length) {
        lines.push('FOOD RESTRICTIONS (honor without exception — every meal must respect them): ' + labeled.join('; ') + '.');
      }
    }
  }

  // Dishes they chose: place EVERY one into a real meal slot across the week.
  const cItems = Array.isArray(cuisine.items) ? cuisine.items : [];
  if (cItems.length) {
    const dishes = cItems.map((c) => CUISINE_LABELS[c] || humanize(c));
    lines.push(
      'CUISINE — DISHES THEY WANT (work EVERY one into a real meal slot during the week): '
      + dishes.join('; ') + '.'
    );
  }
  if (cuisine.notes && String(cuisine.notes).trim()) {
    lines.push('CUISINE NOTE (in their own words): "' + String(cuisine.notes).trim() + '"');
  }

  return lines.join('\n');
}

export default buildTravelerBrief;
