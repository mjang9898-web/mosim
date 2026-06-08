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

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  const { itinerary_id, status } = req.body || {};
  if (!itinerary_id || !ALLOWED.includes(status)) {
    return res.status(400).json({ error: 'itinerary_id and a valid status are required' });
  }

  const { error } = await admin.from('itineraries').update({ status }).eq('id', itinerary_id);
  if (error) {
    console.error('[admin/trip-status] update failed', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
  return res.status(200).json({ ok: true, status });
}
