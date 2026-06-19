// Stashes an anonymous funnel result (state + AI plan) into public.pending_itineraries
// so it survives the email-confirmation signup gap (signup opens result.html in a
// NEW tab whose sessionStorage is empty). Returns an unguessable claim_token that
// the frontend carries into the signup URL; /api/claim-itinerary later promotes it
// into public.itineraries under the new user.
//
// Anon-allowed POST (no bearer token). Service role (RLS-bypassing) writes the row.
// Privacy: care.note is client-only and is stripped before persisting.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

// Sanity cap on the stashed payload — a real funnel state + 7-day plan is a few KB.
// Guards the free DB tier against accidental/abusive oversized writes.
const MAX_PAYLOAD_BYTES = 256 * 1024; // 256 KB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const { state, schedule, title } = req.body || {};
  if (!state || typeof state !== 'object') return res.status(400).json({ error: 'state is required' });
  if (!schedule) return res.status(400).json({ error: 'schedule is required' });

  // Privacy: the free-text care note is client-only and must never be persisted.
  let safeState = state;
  try {
    safeState = JSON.parse(JSON.stringify(state));
    if (safeState && safeState.care && typeof safeState.care === 'object') delete safeState.care.note;
  } catch (e) { safeState = state; }

  // Payload size sanity check (after stripping the note).
  try {
    const bytes = Buffer.byteLength(JSON.stringify({ state: safeState, schedule }), 'utf8');
    if (bytes > MAX_PAYLOAD_BYTES) return res.status(413).json({ error: 'Payload too large' });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { data, error } = await admin
    .from('pending_itineraries')
    .insert({
      state: safeState,
      schedule,
      title: (typeof title === 'string' ? title : '').slice(0, 120) || null
    })
    .select('claim_token')
    .single();

  if (error || !data) {
    console.error('[stash-itinerary] insert failed', error);
    return res.status(500).json({ error: 'Failed to stash itinerary' });
  }
  return res.status(200).json({ ok: true, claim_token: data.claim_token });
}
