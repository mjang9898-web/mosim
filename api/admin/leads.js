// GET /api/admin/leads — admin only. Lists contact-form leads, newest-first.
// Deliberately omits the `state` jsonb (can hold PII like care notes).
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

  try {
    const { data, error } = await admin
      .from('leads')
      .select('id, created_at, name, email, origin_from, travel_when, interest, note, status')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    return res.status(200).json({ leads: data });
  } catch (e) {
    console.error('[admin/leads] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to load leads' });
  }
}
