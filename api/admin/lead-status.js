// POST /api/admin/lead-status — admin only. Updates a lead's triage status.
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const STATUSES = ['new', 'contacted', 'quoted', 'booked', 'lost'];

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  const { id, status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'bad status' });

  try {
    const { error } = await admin
      .from('leads')
      .update({ status })
      .eq('id', id);
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[admin/lead-status] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to update status' });
  }
}
