import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supa) {
    console.error('[api/lead] Supabase env vars not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const body = req.body || {};
    const { name, email, from, when: travelWhen, interest, note, state } = body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // If a bearer token is present, attach the user_id to the lead.
    let userId = null;
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      try {
        const { data: { user } } = await supa.auth.getUser(token);
        if (user) userId = user.id;
      } catch (e) {
        // best-effort — proceed without user_id
      }
    }

    const { data, error } = await supa
      .from('leads')
      .insert({
        name: name || null,
        email: email.trim().toLowerCase(),
        origin_from: from || null,
        travel_when: travelWhen || null,
        interest: interest || null,
        note: note || null,
        state: state || null,
        user_id: userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('[api/lead] supabase insert failed:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error('[api/lead] unexpected error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
