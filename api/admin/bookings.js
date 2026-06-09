// GET /api/admin/bookings?itinerary_id=...  — admin only. All bookings for a trip,
// with signed download URLs for customer uploads (so the admin can view files).
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });
  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  const itinerary_id = (req.query.itinerary_id || '').toString();
  if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

  const { data: rows, error } = await admin
    .from('bookings')
    .select('id, category, kind, label, url, file_path, status, created_by, created_at')
    .eq('itinerary_id', itinerary_id)
    .order('created_at', { ascending: true });
  if (error) { console.error('[admin/bookings] failed', error); return res.status(500).json({ error: 'Failed to load bookings' }); }

  const bookings = [];
  for (const b of rows) {
    let signed_url = null;
    if (b.kind === 'upload' && b.file_path) {
      try {
        const { data } = await admin.storage.from('bookings').createSignedUrl(b.file_path, 3600);
        signed_url = data && data.signedUrl;
      } catch (e) { /* leave null */ }
    }
    bookings.push({ ...b, signed_url });
  }
  return res.status(200).json({ bookings });
}
