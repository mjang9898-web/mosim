// Deletes the authenticated user's account.
// CASCADE on profiles/itineraries removes their rows automatically.
// leads.user_id is set NULL to keep historical lead records (anonymized).

import { createClient } from '@supabase/supabase-js';
import { enforceRateLimit } from './_lib/rate-limit.js';

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
  // Account deletion is a rare, confirmed action. 10 / min per IP is ample for a
  // real user (and any retry) while preventing abuse of the auth-admin delete path.
  if (enforceRateLimit(req, res, { key: 'delete-account', limit: 10, windowMs: 60 * 1000 })) return;
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data: { user }, error: getErr } = await admin.auth.getUser(token);
  if (getErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { error: leadsErr } = await admin
    .from('leads')
    .update({ user_id: null })
    .eq('user_id', user.id);
  if (leadsErr) {
    console.error('[delete-account] leads anon failed', leadsErr);
    return res.status(500).json({ error: 'Failed to anonymize leads' });
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error('[delete-account] deleteUser failed', delErr);
    return res.status(500).json({ error: 'Failed to delete account' });
  }

  return res.status(200).json({ ok: true });
}
