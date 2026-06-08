// POST /api/admin/trip-status  { itinerary_id, status }  — admin only.
// Advances a trip's concierge status (the customer sees it in My Page).
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const ALLOWED = ['new', 'reserved', 'reviewing', 'quoted', 'booked', 'archived'];
const BOOKING = ['none', 'pending', 'booked'];   // flight_status / stay_status

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  const { itinerary_id, status, flight_status, stay_status } = req.body || {};
  if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

  const update = {};
  if (status !== undefined) {
    if (!ALLOWED.includes(status)) return res.status(400).json({ error: 'invalid status' });
    update.status = status;
  }
  if (flight_status !== undefined) {
    if (!BOOKING.includes(flight_status)) return res.status(400).json({ error: 'invalid flight_status' });
    update.flight_status = flight_status;
  }
  if (stay_status !== undefined) {
    if (!BOOKING.includes(stay_status)) return res.status(400).json({ error: 'invalid stay_status' });
    update.stay_status = stay_status;
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'no valid fields to update' });

  const { error } = await admin.from('itineraries').update(update).eq('id', itinerary_id);
  if (error) {
    console.error('[admin/trip-status] update failed', error);
    return res.status(500).json({ error: 'Failed to update' });
  }
  return res.status(200).json({ ok: true, ...update });
}
