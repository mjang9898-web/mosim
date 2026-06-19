// Promotes an anonymous stashed plan (public.pending_itineraries) into the
// authenticated user's public.itineraries, then deletes the pending row.
// Closes the email-confirmation signup gap: the user stashed a claim_token
// pre-signup, confirmed email, and now lands authenticated to claim it.
//
// POST + Bearer JWT (required). Body: { claim_token }.
// Graceful when the token is unknown / already claimed / expired → { ok:false }.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { claim_token } = req.body || {};
  if (!claim_token || typeof claim_token !== 'string') {
    return res.status(400).json({ error: 'claim_token is required' });
  }

  // Fetch the pending row. Unknown / already-claimed → graceful 404 { ok:false }.
  const { data: pending, error: fetchErr } = await admin
    .from('pending_itineraries')
    .select('claim_token, state, schedule, title, expires_at')
    .eq('claim_token', claim_token)
    .maybeSingle();

  if (fetchErr) {
    console.error('[claim-itinerary] lookup failed', fetchErr);
    return res.status(500).json({ error: 'lookup_failed' });
  }
  if (!pending) {
    // Already claimed in a prior call, or token never existed.
    return res.status(404).json({ ok: false, error: 'not_found' });
  }

  // Expired → drop it and report gone.
  if (pending.expires_at && new Date(pending.expires_at).getTime() <= Date.now()) {
    await admin.from('pending_itineraries').delete().eq('claim_token', claim_token);
    return res.status(410).json({ ok: false, error: 'expired' });
  }

  // Defense-in-depth: re-strip care.note before persisting to itineraries.
  let safeState = pending.state || {};
  try {
    safeState = JSON.parse(JSON.stringify(pending.state || {}));
    if (safeState && safeState.care && typeof safeState.care === 'object') delete safeState.care.note;
  } catch (e) { safeState = pending.state || {}; }

  const { data: inserted, error: insErr } = await admin
    .from('itineraries')
    .insert({
      user_id: user.id,
      title: (pending.title || '').slice(0, 120) || null,
      state: safeState,
      schedule: pending.schedule,
      status: 'new'
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    console.error('[claim-itinerary] insert failed', insErr);
    return res.status(500).json({ error: 'Failed to claim itinerary' });
  }

  // Best-effort cleanup; the row is single-use. Failure here is non-fatal
  // (expiry sweep / re-claim guard still apply), so we don't roll back the insert.
  const { error: delErr } = await admin
    .from('pending_itineraries')
    .delete()
    .eq('claim_token', claim_token);
  if (delErr) console.error('[claim-itinerary] pending delete failed (non-fatal)', delErr);

  return res.status(200).json({ ok: true, id: inserted.id });
}
