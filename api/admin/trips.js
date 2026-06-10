// /api/admin/trips — admin only. Multiplexes several cockpit admin actions via
// ?action= to stay under the Hobby plan's 12-serverless-function cap:
//   (default, GET) → trips list (itineraries enriched w/ customer + payment)
//   ?action=whoami      GET  → { isAdmin, email, admins }
//   ?action=leads       GET  → { leads } (newest-first, no `state` PII)
//   ?action=lead-status POST → { ok } (update a lead's triage status)
//   ?action=overview    GET  → { overview } (dashboard metrics, best-effort)
//   ?action=members     GET  → { members } (all signups + profile + trip count)
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
  if (action === 'overview') return handleOverview(req, res);
  if (action === 'members') return handleMembers(req, res);
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

// --- provider helper (auth user → 'email' | 'google' | ...) ----------------
function providerOf(u) {
  return (
    (u.app_metadata && u.app_metadata.provider) ||
    (Array.isArray(u.identities) && u.identities[0] && u.identities[0].provider) ||
    (u.app_metadata && Array.isArray(u.app_metadata.providers) && u.app_metadata.providers[0]) ||
    'email'
  );
}

// --- overview (dashboard metrics, best-effort: a failing section → zeros) --
async function handleOverview(req, res) {
  const overview = {
    members: { total: 0, newThisWeek: 0 },
    leads:   { total: 0, byStatus: { new: 0, contacted: 0, quoted: 0, booked: 0, lost: 0 } },
    trips:   { total: 0, byStage: { new: 0, reserved: 0, reviewing: 0, quoted: 0, booked: 0, archived: 0 } },
    revenue: { invoiced: 0, paid: 0, outstanding: 0 },
    recent:  { signups: [], leads: [] }
  };

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // members + recent signups (from auth)
  try {
    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = list?.users || [];
    overview.members.total = users.length;
    overview.members.newThisWeek = users.filter((u) => u.created_at && new Date(u.created_at).getTime() >= weekAgo).length;
    overview.recent.signups = [...users]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
      .map((u) => ({ email: u.email || null, created_at: u.created_at || null }));
  } catch (e) { console.error('[admin/trips?overview] members failed', e?.message || e); }

  // leads totals + by-status + recent
  try {
    const { data, error } = await admin
      .from('leads')
      .select('name, email, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data || [];
    overview.leads.total = rows.length;
    rows.forEach((r) => {
      const s = r.status || 'new';
      if (overview.leads.byStatus[s] != null) overview.leads.byStatus[s] += 1;
    });
    overview.recent.leads = rows.slice(0, 5).map((r) => ({
      name: r.name || null, email: r.email || null, created_at: r.created_at || null, status: r.status || 'new'
    }));
  } catch (e) { console.error('[admin/trips?overview] leads failed', e?.message || e); }

  // trips totals + by-stage
  try {
    const { data, error } = await admin.from('itineraries').select('status');
    if (error) throw error;
    const rows = data || [];
    overview.trips.total = rows.length;
    rows.forEach((r) => {
      const s = r.status || 'new';
      if (overview.trips.byStage[s] != null) overview.trips.byStage[s] += 1;
    });
  } catch (e) { console.error('[admin/trips?overview] trips failed', e?.message || e); }

  // revenue (payment_groups)
  try {
    const { data, error } = await admin.from('payment_groups').select('total_amount, amount_paid');
    if (error) throw error;
    let invoiced = 0, paid = 0;
    (data || []).forEach((p) => { invoiced += Number(p.total_amount) || 0; paid += Number(p.amount_paid) || 0; });
    overview.revenue.invoiced = invoiced;
    overview.revenue.paid = paid;
    overview.revenue.outstanding = invoiced - paid;
  } catch (e) { console.error('[admin/trips?overview] revenue failed', e?.message || e); }

  return res.status(200).json({ overview });
}

// --- members (all signups + profile name/phone + trip count) --------------
async function handleMembers(req, res) {
  try {
    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = list?.users || [];

    // profiles (name/phone) by id — best-effort
    const profById = {};
    try {
      const { data: profs } = await admin.from('profiles').select('id, name, phone');
      (profs || []).forEach((p) => { profById[p.id] = p; });
    } catch (e) { /* best-effort — names/phones may be blank */ }

    // trip counts per user_id (one query, tally in JS — no N+1)
    const tripsByUser = {};
    try {
      const { data: itins } = await admin.from('itineraries').select('user_id');
      (itins || []).forEach((it) => { if (it.user_id) tripsByUser[it.user_id] = (tripsByUser[it.user_id] || 0) + 1; });
    } catch (e) { /* best-effort — counts default to 0 */ }

    const members = users
      .map((u) => {
        const prof = profById[u.id] || {};
        return {
          id: u.id,
          email: u.email || null,
          name: prof.name || null,
          phone: prof.phone || null,
          provider: providerOf(u),
          created_at: u.created_at || null,
          last_sign_in_at: u.last_sign_in_at || null,
          trips: tripsByUser[u.id] || 0
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.status(200).json({ members });
  } catch (e) {
    console.error('[admin/trips?members] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to load members' });
  }
}
