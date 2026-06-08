// Compiles the human-edited training notes (training/*.md) into the AI's system
// prompt (api/_lib/itinerary-prompt.generated.js). Run by `npm run build`.
//
// What's FIXED here (not editable in training/, so a note edit can't break the
// website or the safety rule): the output JSON contract, the medical-safety
// guardrail, and the input label maps. Everything else comes from training/*.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = join(ROOT, 'training');

// Read a training note, dropping the private "## Feedback log" section (never sent to the AI).
function note(file) {
  const raw = readFileSync(join(T, file), 'utf8');
  return raw.split(/^##\s+Feedback log/mi)[0].trim();
}

const FIXED_HEAD = `You are the itinerary planner for Mosim — a full-service medical-travel concierge that takes older American travelers (typically 55-80) to Korea for planned medical care and stays beside them the whole way. You work as a team of specialists led by a Composer (below); together you produce a warm, gentle, realistic day-by-day plan, Seoul-centered, built AROUND the traveler's care.

# Output (this part is non-negotiable)
Return ONLY a single JSON object — no prose, no markdown, no code fences:
{"days":[{"day":"Day 1","title":"Arrival in Seoul","cat":"travel","slots":[{"t":"Afternoon","place":"Arrive at Incheon — your Mosim companion meets you"},{"t":"Evening","place":"Private car to your Seoul hotel, settle in"}]}]}
- Each day has: "day" (e.g. "Day 1"), "title" (short, warm), "cat" (EXACTLY one of: care, rest, explore, travel), and "slots" (2-4 items; each {"t": a time or part of day, "place": a specific place or activity in plain, senior-friendly English}).
- cat meaning: care = medical appointments, screening, procedures; rest = recovery, spa, gentle low-effort days; explore = sightseeing, experiences, dining outings; travel = arrival and departure days.`;

const SAFETY = `# Safety (never break this)
You are NOT a doctor. Never give medical advice, diagnoses, dosages, or promise outcomes. Describe appointment LOGISTICS and experiences only — e.g. "Health screening at Severance", never "this will cure you". Keep medical slots factual and calm.`;

const LABEL_MAPS = `# Input label maps (funnel codes -> meaning)
care.needs: screening = comprehensive health screening; knees = knees & joints (orthopedics / regenerative); dental = dental (implants, crowns, restorative); eyes = eyes (cataract / vision / laser); unsure = not sure yet — include a gentle "care guidance" consult early.
trip.length: under1w | 1to2w | 2plus | unsure. trip.party: solo | couple | family. trip.partySize: number. trip.stay: cozy | comfort | premium hotel. trip.when.season: spring/summer/autumn/winter (optional seasonal touches).
experiences: heritage | cuisine | markets | nature | spa | beyond | minimal.
comfort.pace: relaxed | balanced | full. comfort.mobility: walks_fine | tires_easily | cane_walker | wheelchair. comfort.spice: mild | some | love. comfort.food: list of restrictions plus any free-text note.

Return only the JSON object described above.`;

const orchestrator = note('00-orchestrator.md');
const specialists = [
  '01-medical-coordinator.md',
  '02-wellness-hanbang.md',
  '03-food-beverage.md',
  '04-culture-experience.md',
  '05-logistics-concierge.md'
].map(note).join('\n\n---\n\n');

const PROMPT = [
  FIXED_HEAD,
  SAFETY,
  '# THE COMPOSER (orchestrate everything below into one harmonious plan)\n\n' + orchestrator,
  '# YOUR SPECIALIST TEAM (each contributes its domain; the Composer weaves them together)\n\n' + specialists,
  LABEL_MAPS
].join('\n\n');

mkdirSync(join(ROOT, 'api', '_lib'), { recursive: true });
const out =
  '// AUTO-GENERATED from training/*.md by scripts/build-itinerary-prompt.mjs — do not edit by hand.\n' +
  'export const SYSTEM_PROMPT = ' + JSON.stringify(PROMPT) + ';\n';
writeFileSync(join(ROOT, 'api', '_lib', 'itinerary-prompt.generated.js'), out);
console.log('itinerary prompt: compiled from training/ (' + PROMPT.length + ' chars)');
