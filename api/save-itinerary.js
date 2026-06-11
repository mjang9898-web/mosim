// Saves the current funnel result as an itineraries row.
// Validates: bearer token → user, payload → required fields.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  // ── Public read: GET /api/save-itinerary?t=<share_token> ──
  // No auth. Returns a published itinerary's customer-facing data only.
  // Unpublished / missing / unknown token → 404 (page renders graceful not-found).
  if (req.method === 'GET') {
    return getPublishedItinerary(req, res);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { state, schedule, title } = req.body || {};
  if (!state || !schedule) return res.status(400).json({ error: 'state and schedule are required' });

  // Privacy: the free-text care note is client-only and must never be persisted.
  let safeState = state;
  try {
    safeState = JSON.parse(JSON.stringify(state));
    if (safeState && safeState.care && typeof safeState.care === 'object') delete safeState.care.note;
  } catch (e) { safeState = state; }

  const { data, error } = await admin
    .from('itineraries')
    .insert({
      user_id: user.id,
      title: (title || '').slice(0, 120) || null,
      state: safeState,
      schedule,
      status: 'new'
    })
    .select('id')
    .single();

  if (error) {
    console.error('[save-itinerary] insert failed', error);
    return res.status(500).json({ error: 'Failed to save itinerary' });
  }
  return res.status(200).json({ ok: true, id: data.id });
}

// Public, unauthenticated read of a PUBLISHED itinerary by share token.
// Shapes the row into exactly what /itinerary.html needs to render the
// customer deliverable (cover + final{flights,hotel,contacts,days}).
async function getPublishedItinerary(req, res) {
  const token = (req.query && req.query.t ? String(req.query.t) : '').trim();
  if (!token) return res.status(404).json({ error: 'not_found' });

  const { data, error } = await admin
    .from('itineraries')
    .select('title, state, final, depart_date, published_at, share_token')
    .eq('share_token', token)
    .maybeSingle();

  if (error) {
    console.error('[save-itinerary] public read failed', error);
    return res.status(500).json({ error: 'lookup_failed' });
  }
  // Not found, or found but not yet published → graceful 404 (do not leak existence).
  if (!data || !data.published_at) {
    return res.status(404).json({ error: 'not_found' });
  }

  const state = data.state || {};
  const final = data.final || {};
  const cover = buildCover(state, data.title);

  return res.status(200).json({
    title: cover.title,                 // "Robert & Linda Anderson in Korea"
    cover,                              // { title, eyebrow, party_size, care_summary }
    depart_date: data.depart_date || null,
    final: {
      flights:  final.flights  || { outbound: null, inbound: null },
      hotel:    final.hotel    || null,
      contacts: Array.isArray(final.contacts) ? final.contacts : [],
      days:     Array.isArray(final.days) ? final.days : []
    }
  });
}

// Derives compact cover info from the saved funnel state. Tolerant of missing
// fields — the cockpit-edited `final` is the source of truth for flights/hotel/days,
// while cover identity comes from state. Falls back to title-only.
function buildCover(state, title) {
  const trip = state.trip || {};
  const care = state.care || {};
  const partySize = Number(trip.travelers || trip.party_size || trip.people) || null;
  // care.summary is a short admin/AI label (e.g. "Health screening & orthopedic care").
  const careSummary = care.summary || care.label || null;
  return {
    title: (title || '').trim() || 'Your Korea Itinerary',
    eyebrow: 'Mosim Concierge · Your Itinerary',
    party_size: partySize,
    care_summary: careSummary
  };
}
