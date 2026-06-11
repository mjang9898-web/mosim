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
} from './experience-labels.generated.js';

// ── small label tables for the inputs that have fixed funnel vocabularies ──
const CARE_LABELS = {
  screening: 'comprehensive health screening',
  knees: 'knees & joints (orthopedics / regenerative)',
  dental: 'dental (implants, crowns, restorative)',
  eyes: 'eyes (cataract / vision / laser)',
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

const SPICE_LABELS = {
  none: 'no spice',
  mild: 'mild spice only',
  some: 'some spice is fine',
  love: 'loves spicy food',
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
  return { name: humanize(code), group: 'Other', region: 'seoul' };
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
        parts.push('In/around Seoul: ' + seoul.map((e) => e.name).join('; ') + '.');
      }
      if (beyond.length) {
        parts.push(
          'BEYOND SEOUL (real excursions — each may need an internal flight and/or an overnight, not a Seoul day trip): '
          + beyond.map((e) => e.name).join('; ') + '.'
        );
      }
      lines.push('EXPERIENCES THEY CHOSE (include EVERY one): ' + parts.join(' '));
    }
  } else {
    lines.push('EXPERIENCES: none chosen.');
  }

  // ── Comfort & food ──
  const comfort = s.comfort || {};
  const comfortBits = [];
  if (comfort.pace) comfortBits.push('pace: ' + (PACE_LABELS[comfort.pace] || humanize(comfort.pace)));
  if (comfort.mobility) comfortBits.push('mobility: ' + (MOBILITY_LABELS[comfort.mobility] || humanize(comfort.mobility)));
  if (comfort.spice) comfortBits.push('spice: ' + (SPICE_LABELS[comfort.spice] || humanize(comfort.spice)));
  if (comfortBits.length) lines.push('COMFORT: ' + comfortBits.join('; ') + '.');

  const food = Array.isArray(comfort.food) ? comfort.food : [];
  // Free-text food notes may be stored among the codes (anything not a known
  // code is treated as a free-text restriction and passed through verbatim).
  if (food.length) {
    const labeled = food.map((c) => {
      const known = DIET_LABELS[c] || ALLERGEN_LABELS[c];
      return known || String(c).trim();
    }).filter(Boolean);
    if (labeled.length) lines.push('FOOD RESTRICTIONS: ' + labeled.join('; ') + '.');
  }

  return lines.join('\n');
}

export default buildTravelerBrief;
