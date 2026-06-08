// POST /api/reserve  (Bearer token + { itinerary_id })  → marks the owner's
// itinerary as 'reserved' (free intent). Idempotent; only advances from 'new'.
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

  const { itinerary_id } = req.body || {};
  if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

  const { data: itin } = await admin
    .from('itineraries').select('id, user_id, status, title').eq('id', itinerary_id).single();
  if (!itin || itin.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your itinerary' });
  }

  // Idempotent: only advance from 'new'. Already past 'new' → return current status.
  if (itin.status !== 'new') {
    return res.status(200).json({ ok: true, status: itin.status });
  }

  const { error } = await admin
    .from('itineraries').update({ status: 'reserved' }).eq('id', itinerary_id);
  if (error) {
    console.error('[reserve] update failed', error);
    return res.status(500).json({ error: 'Failed to reserve' });
  }

  // The concierge picks up reserved trips. (Email alert can be added later via the
  // same Resend path used by /api/lead, once RESEND_API_KEY is set.)
  console.log('[reserve] itinerary reserved:', itinerary_id, 'by', user.email);
  return res.status(200).json({ ok: true, status: 'reserved' });
}
