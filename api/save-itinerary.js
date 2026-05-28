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

  const { state, schedule, title } = req.body || {};
  if (!state || !schedule) return res.status(400).json({ error: 'state and schedule are required' });

  const { data, error } = await admin
    .from('itineraries')
    .insert({
      user_id: user.id,
      title: (title || '').slice(0, 120) || null,
      state,
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
