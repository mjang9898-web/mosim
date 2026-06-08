// GET /api/admin/trips  — admin only. Lists all itineraries enriched with the
// customer (name/email/phone), care/trip summary, and payment status.
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
    const { data: itins, error } = await admin
      .from('itineraries')
      .select('id, user_id, title, state, schedule, status, flight_status, stay_status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    // email map (one listUsers call) + profiles (name/phone) + payment groups
    const emailById = {};
    try {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      (list?.users || []).forEach((u) => { emailById[u.id] = u.email; });
    } catch (e) { /* best-effort — emails may be blank */ }

    const profById = {};
    const { data: profs } = await admin.from('profiles').select('id, name, phone');
    (profs || []).forEach((p) => { profById[p.id] = p; });

    const payByItin = {};
    const ids = itins.map((i) => i.id);
    if (ids.length) {
      const { data: pgs } = await admin
        .from('payment_groups')
        .select('itinerary_id, total_amount, amount_paid, status, share_token')
        .in('itinerary_id', ids);
      (pgs || []).forEach((p) => { payByItin[p.itinerary_id] = p; });
    }

    const trips = itins.map((it) => {
      const st = it.state || {};
      const prof = profById[it.user_id] || {};
      const pg = payByItin[it.id] || null;
      return {
        id: it.id,
        title: it.title,
        status: it.status,
        flight_status: it.flight_status || 'none',
        stay_status: it.stay_status || 'none',
        created_at: it.created_at,
        customer: { name: prof.name || (st.contact && st.contact.name) || null, email: emailById[it.user_id] || null, phone: prof.phone || null },
        care: (st.care && st.care.needs) || [],
        length: (st.trip && st.trip.length) || null,
        party: (st.trip && st.trip.party) || null,
        partySize: (st.trip && st.trip.partySize) || null,
        days: Array.isArray(it.schedule) ? it.schedule.length : null,
        payment: pg ? { total: Number(pg.total_amount), paid: Number(pg.amount_paid), status: pg.status, token: pg.share_token } : null
      };
    });

    return res.status(200).json({ trips });
  } catch (e) {
    console.error('[admin/trips] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to load trips' });
  }
}
