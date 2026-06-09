// POST   /api/admin/booking-link  { itinerary_id, category, label, url }  → add a Mosim link
// DELETE /api/admin/booking-link  { id }                                  → remove a Mosim link
// Admin only.
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const CATS = ['flight', 'stay', 'other'];

export default async function handler(req, res) {
  if (!admin) return res.status(500).json({ error: 'Server not configured' });
  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  if (req.method === 'POST') {
    const { itinerary_id, category, label, url } = req.body || {};
    if (!itinerary_id || !CATS.includes(category) || !url) {
      return res.status(400).json({ error: 'itinerary_id, valid category, and url are required' });
    }
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'url must start with http(s)://' });
    const { data, error } = await admin.from('bookings').insert({
      itinerary_id, category, kind: 'link', created_by: 'mosim',
      label: (label || '').slice(0, 160) || null, url: String(url).slice(0, 2000), status: 'pending'
    }).select('id, category, kind, label, url, status, created_by, created_at').single();
    if (error) { console.error('[admin/booking-link] insert failed', error); return res.status(500).json({ error: 'Failed to add link' }); }
    return res.status(200).json({ ok: true, booking: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    // Only Mosim-posted links can be removed here (never a customer's upload).
    const { error } = await admin.from('bookings').delete().eq('id', id).eq('kind', 'link');
    if (error) { console.error('[admin/booking-link] delete failed', error); return res.status(500).json({ error: 'Failed to delete' }); }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
