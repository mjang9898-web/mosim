// /api/admin/trips — admin only. Multiplexes several cockpit admin actions via
// ?action= to stay under the Hobby plan's 12-serverless-function cap:
//   (default, GET) → trips list (itineraries enriched w/ customer + payment)
//   ?action=whoami      GET  → { isAdmin, email, admins }
//   ?action=leads       GET  → { leads } (newest-first, no `state` PII)
//   ?action=lead-status POST → { ok } (update a lead's triage status)
import { createClient } from '@supabase/supabase-js';
import { getAdminUser, adminEmails } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'lost'];

export default async function handler(req, res) {
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const action = (req.query && req.query.action) || '';

  // Method gate per action (default/whoami/leads = GET, lead-status = POST)
  const wantsPost = action === 'lead-status';
  const allowed = wantsPost ? 'POST' : 'GET';
  if (req.method !== allowed) { res.setHeader('Allow', allowed); return res.status(405).json({ error: 'Method not allowed' }); }

  // Same admin gate for every action.
  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  if (action === 'whoami') return handleWhoami(req, res, me);
  if (action === 'leads') return handleLeads(req, res);
  if (action === 'lead-status') return handleLeadStatus(req, res);
  return handleTrips(req, res);
}

// --- whoami ---------------------------------------------------------------
function handleWhoami(req, res, me) {
  return res.status(200).json({ isAdmin: true, email: me.email, admins: adminEmails() });
}

// --- leads (list, no `state` PII) -----------------------------------------
async function handleLeads(req, res) {
  try {
    const { data, error } = await admin
      .from('leads')
      .select('id, created_at, name, email, origin_from, travel_when, interest, note, status')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.status(200).json({ leads: data });
  } catch (e) {
    console.error('[admin/trips?leads] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to load leads' });
  }
}

// --- lead-status (triage update) ------------------------------------------
async function handleLeadStatus(req, res) {
  const { id, status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  if (!LEAD_STATUSES.includes(status)) return res.status(400).json({ error: 'bad status' });
  try {
    const { error } = await admin.from('leads').update({ status }).eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[admin/trips?lead-status] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to update status' });
  }
}

// --- trips (default) ------------------------------------------------------
async function handleTrips(req, res) {
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
        when: (st.trip && st.trip.when) || null,   // { mode, dates:{start,end}, season } — for pre-filling booking links
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
