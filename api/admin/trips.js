// /api/admin/trips — admin only. Multiplexes several cockpit admin actions via
// ?action= to stay under the Hobby plan's 12-serverless-function cap:
//   (default, GET) → trips list (itineraries enriched w/ customer + payment)
//   ?action=whoami      GET  → { isAdmin, email, admins }
//   ?action=leads       GET  → { leads } (newest-first, no `state` PII)
//   ?action=lead-status POST → { ok } (update a lead's triage status)
//   ?action=overview    GET  → { overview } (dashboard metrics, best-effort)
//   ?action=members     GET  → { members } (all signups + profile + trip count)
//   ?action=finance     GET  → { finance } (accounting dashboard, best-effort)
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { getAdminUser, adminEmails } from '../_lib/admin.js';
import { sendEmail, esc } from '../_lib/email.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'lost'];

// PostHog (marketing analytics — ?action=analytics). Personal key is server-side only.
const PH_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PH_HOST = 'https://us.posthog.com';
const PH_PROJECT = '463716';
// Internal/test IPs to exclude from marketing stats (comma-separated env, e.g. the founder's IP).
const PH_EXCLUDE_IPS = (process.env.POSTHOG_EXCLUDE_IPS || '').split(',').map((s) => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const action = (req.query && req.query.action) || '';

  // Method gate per action (default/whoami/leads/itinerary-get = GET; rest POST)
  const POST_ACTIONS = ['lead-status', 'itinerary-save', 'itinerary-publish'];
  const wantsPost = POST_ACTIONS.includes(action);
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
  if (action === 'finance') return handleFinance(req, res);
  if (action === 'analytics') return handleAnalytics(req, res);
  if (action === 'itinerary-get') return handleItineraryGet(req, res);
  if (action === 'itinerary-save') return handleItinerarySave(req, res);
  if (action === 'itinerary-publish') return handleItineraryPublish(req, res);
  return handleTrips(req, res);
}

// --- analytics (PostHog Query API / HogQL — funnel + sources, anonymous) ---
async function phHogql(query) {
  const r = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + PH_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } })
  });
  if (!r.ok) throw new Error('PostHog ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return (await r.json()).results || [];
}
async function handleAnalytics(req, res) {
  if (!PH_KEY) return res.status(503).json({ error: 'Analytics not configured yet' });
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 90);
  const since = `now() - INTERVAL ${days} DAY`;
  // Drop bots/crawlers/monitoring by user-agent (real browser UAs never match these).
  const notBot = `NOT match(lower(coalesce(properties.$raw_user_agent, '')), `
    + `'bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|python-|curl/|wget|monitor|uptime|pingdom|lighthouse|ahrefs|semrush|dataforseo|prerender|vercel-|scan')`;
  const ipClause = PH_EXCLUDE_IPS.length
    ? ` AND coalesce(properties.$ip, '') NOT IN (${PH_EXCLUDE_IPS.map((ip) => `'${ip.replace(/'/g, '')}'`).join(', ')})`
    : '';
  const base = `event='$pageview' AND timestamp > ${since} AND ${notBot}${ipClause}`;
  try {
    const [ov, fn, sr, tr, pg, co, dv, ch] = await Promise.all([
      phHogql(`SELECT count() AS pv, uniq(distinct_id) AS v FROM events WHERE ${base}`),
      phHogql(`SELECT
                 uniqIf(distinct_id, properties.$current_url LIKE '%step1%') AS s1,
                 uniqIf(distinct_id, properties.$current_url LIKE '%step2%') AS s2,
                 uniqIf(distinct_id, properties.$current_url LIKE '%step3%') AS s3,
                 uniqIf(distinct_id, properties.$current_url LIKE '%step4%') AS s4,
                 uniqIf(distinct_id, properties.$current_url LIKE '%result%') AS rs
               FROM events WHERE ${base}`),
      phHogql(`SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS src,
                      uniq(distinct_id) AS v, count() AS pv
               FROM events WHERE ${base}
               GROUP BY src ORDER BY v DESC LIMIT 8`),
      // ① daily visitor trend
      phHogql(`SELECT toString(toDate(timestamp)) AS day, uniq(distinct_id) AS v
               FROM events WHERE ${base} GROUP BY day ORDER BY day`),
      // ② top pages
      phHogql(`SELECT coalesce(nullIf(properties.$pathname, ''), '/') AS page, uniq(distinct_id) AS v, count() AS pv
               FROM events WHERE ${base} GROUP BY page ORDER BY v DESC LIMIT 8`),
      // ③ countries
      phHogql(`SELECT coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown') AS c, uniq(distinct_id) AS v
               FROM events WHERE ${base} GROUP BY c ORDER BY v DESC LIMIT 8`),
      // ④ devices
      phHogql(`SELECT coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS d, uniq(distinct_id) AS v
               FROM events WHERE ${base} GROUP BY d ORDER BY v DESC`),
      // ⑤ marketing channels (UTM) — excludes our QA test tags
      phHogql(`SELECT coalesce(nullIf(properties.utm_source, ''), '(none)') AS src,
                      coalesce(nullIf(properties.utm_medium, ''), '—') AS med, uniq(distinct_id) AS v
               FROM events WHERE ${base} AND coalesce(properties.utm_source, '') != ''
                 AND lower(coalesce(properties.utm_source, '')) NOT IN ('qa_test', 'funnel_qa', 'verify', 'verification')
               GROUP BY src, med ORDER BY v DESC LIMIT 8`)
    ]);
    const o = ov[0] || [0, 0]; const f = fn[0] || [0, 0, 0, 0, 0];
    return res.status(200).json({
      days,
      overview: { pageviews: Number(o[0]) || 0, visitors: Number(o[1]) || 0 },
      funnel: [
        { step: 'Care (step 1)', visitors: Number(f[0]) || 0 },
        { step: 'Trip (step 2)', visitors: Number(f[1]) || 0 },
        { step: 'Experiences (step 3)', visitors: Number(f[2]) || 0 },
        { step: 'Comfort (step 4)', visitors: Number(f[3]) || 0 },
        { step: 'AI plan (result)', visitors: Number(f[4]) || 0 }
      ],
      sources: sr.map((row) => ({ source: row[0] === '$direct' ? 'Direct / none' : row[0], visitors: Number(row[1]) || 0, views: Number(row[2]) || 0 })),
      trend: tr.map((row) => ({ day: row[0], visitors: Number(row[1]) || 0 })),
      pages: pg.map((row) => ({ page: row[0], visitors: Number(row[1]) || 0, views: Number(row[2]) || 0 })),
      countries: co.map((row) => ({ country: row[0], visitors: Number(row[1]) || 0 })),
      devices: dv.map((row) => ({ device: row[0], visitors: Number(row[1]) || 0 })),
      channels: ch.map((row) => ({ source: row[0], medium: row[1], visitors: Number(row[2]) || 0 }))
    });
  } catch (e) {
    console.error('[admin/trips analytics] failed', e?.message || e);
    return res.status(502).json({ error: 'Analytics query failed', detail: String(e?.message || e).slice(0, 200) });
  }
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

// --- finance (accounting dashboard, best-effort: a failing section → zeros) --
// Method-agnostic: card/cash are constant zero categories until those payment
// methods exist, so the chart-of-accounts is always visible. PayPal vs test is
// derived from the capture/order id prefix (MOCK… = sandbox/test).
function deriveMethod(p) {
  const cap = (p.paypal_capture_id || '').trim();
  const ord = (p.paypal_order_id || '').trim();
  if (/^mock/i.test(cap) || /^mock/i.test(ord)) return 'test';
  if (cap || ord) return 'paypal';
  return 'other';
}

async function handleFinance(req, res) {
  const finance = {
    currency: 'USD',
    summary: { invoiced: 0, collected: 0, outstanding: 0, refunded: 0, net: 0 },
    byMethod: [
      { method: 'paypal', label: 'PayPal',      count: 0, gross: 0 },
      { method: 'card',   label: 'Credit card', count: 0, gross: 0 },
      { method: 'cash',   label: 'Cash',        count: 0, gross: 0 },
      { method: 'other',  label: 'Other',       count: 0, gross: 0 },
      { method: 'test',   label: 'Test / mock', count: 0, gross: 0 }
    ],
    fees: { total: null, note: "Processing fees populate once a payment provider's fee reporting is connected." },
    transactions: [],
    receivables: []
  };

  // payment_groups → invoiced + outstanding (best-effort)
  let groups = [];
  try {
    const { data, error } = await admin
      .from('payment_groups')
      .select('id, itinerary_id, total_amount, amount_paid, currency, status, share_token, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    groups = data || [];
    let invoiced = 0, outstanding = 0;
    groups.forEach((g) => {
      const total = Number(g.total_amount) || 0;
      const paid = Number(g.amount_paid) || 0;
      invoiced += total;
      const notFullyPaid = g.status !== 'paid' || paid < total;
      if (notFullyPaid) outstanding += Math.max(total - paid, 0);
    });
    finance.summary.invoiced = invoiced;
    finance.summary.outstanding = outstanding;
  } catch (e) { console.error('[admin/trips?finance] groups failed', e?.message || e); }

  // payments → collected, refunded, byMethod, transactions (best-effort)
  // (group_id → itinerary_id map from the groups we already loaded)
  const itinByGroup = {};
  groups.forEach((g) => { itinByGroup[g.id] = g.itinerary_id; });
  try {
    const { data, error } = await admin
      .from('payments')
      .select('id, payment_group_id, payer_name, payer_email, amount, paypal_order_id, paypal_capture_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    const rows = data || [];

    const methodIdx = {};
    finance.byMethod.forEach((m, i) => { methodIdx[m.method] = i; });

    let collected = 0, refunded = 0;
    rows.forEach((p) => {
      const amt = Number(p.amount) || 0;
      const method = deriveMethod(p);
      if (p.status === 'completed') {
        collected += amt;
        const idx = methodIdx[method];
        if (idx != null) { finance.byMethod[idx].count += 1; finance.byMethod[idx].gross += amt; }
      } else if (p.status === 'refunded') {
        refunded += amt;
      }
    });
    finance.summary.collected = collected;
    finance.summary.refunded = refunded;
    finance.summary.net = collected - refunded; // fees = 0 today

    finance.transactions = rows.map((p) => ({
      id: p.id,
      created_at: p.created_at || null,
      payer_name: p.payer_name || null,
      payer_email: p.payer_email || null,
      amount: Number(p.amount) || 0,
      method: deriveMethod(p),
      status: p.status || null,
      capture_id: p.paypal_capture_id || p.paypal_order_id || null,
      itinerary_id: itinByGroup[p.payment_group_id] || null
    }));
  } catch (e) { console.error('[admin/trips?finance] payments failed', e?.message || e); }

  // receivables → open groups w/ customer name (best-effort)
  try {
    const open = groups.filter((g) => g.status === 'open' || (Number(g.amount_paid) || 0) < (Number(g.total_amount) || 0));
    if (open.length) {
      // itinerary → user_id
      const userByItin = {};
      const itinIds = open.map((g) => g.itinerary_id).filter(Boolean);
      if (itinIds.length) {
        const { data: itins } = await admin.from('itineraries').select('id, user_id').in('id', itinIds);
        (itins || []).forEach((i) => { userByItin[i.id] = i.user_id; });
      }
      // user_id → name (profiles) and email (auth)
      const profById = {};
      try {
        const { data: profs } = await admin.from('profiles').select('id, name');
        (profs || []).forEach((p) => { profById[p.id] = p.name; });
      } catch (e) { /* best-effort */ }
      const emailById = {};
      try {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        (list?.users || []).forEach((u) => { emailById[u.id] = u.email; });
      } catch (e) { /* best-effort */ }

      finance.receivables = open.map((g) => {
        const total = Number(g.total_amount) || 0;
        const paid = Number(g.amount_paid) || 0;
        const uid = userByItin[g.itinerary_id];
        const customer = (uid && profById[uid]) || (uid && emailById[uid]) || '—';
        return {
          itinerary_id: g.itinerary_id,
          customer,
          total,
          paid,
          outstanding: Math.max(total - paid, 0),
          status: g.status,
          share_token: g.share_token
        };
      });
    }
  } catch (e) { console.error('[admin/trips?finance] receivables failed', e?.message || e); }

  return res.status(200).json({ finance });
}

// === Milestone 2: itinerary deliverable (cockpit editor + publish + email) ===
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://mosimkorea.com';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v) { return typeof v === 'string' && UUID_RE.test(v.trim()); }
function isPlainObject(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }

// Resolve an itinerary owner's email from auth.users (the same source the other
// admin endpoints use). Returns null if not found / lookup fails.
async function ownerEmail(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) throw error;
    return (data && data.user && data.user.email) || null;
  } catch (e) {
    console.error('[admin/trips itinerary] ownerEmail lookup failed', e?.message || e);
    return null;
  }
}

// --- itinerary-get (load one itinerary for the cockpit builder) ------------
async function handleItineraryGet(req, res) {
  const id = (req.query && req.query.id) || '';
  if (!isUuid(id)) return res.status(400).json({ error: 'valid id required' });
  try {
    const { data, error } = await admin
      .from('itineraries')
      .select('id, title, state, schedule, final, depart_date, share_token, published_at')
      .eq('id', id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Itinerary not found' });
    return res.status(200).json({
      id: data.id,
      title: data.title || null,
      state: data.state || null,
      schedule: data.schedule || null,
      final: data.final || null,
      depart_date: data.depart_date || null,
      share_token: data.share_token || null,
      published_at: data.published_at || null
    });
  } catch (e) {
    console.error('[admin/trips itinerary-get] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to load itinerary' });
  }
}

// --- itinerary-save (persist editor changes) -------------------------------
async function handleItinerarySave(req, res) {
  const { id, title, final, depart_date } = req.body || {};
  if (!isUuid(id)) return res.status(400).json({ error: 'valid id required' });
  if (!isPlainObject(final)) return res.status(400).json({ error: 'final must be an object' });

  // Only write the columns the editor owns. title is optional (skip if undefined).
  const patch = { final, depart_date: depart_date || null };
  if (title !== undefined) patch.title = title;

  try {
    const { error } = await admin.from('itineraries').update(patch).eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[admin/trips itinerary-save] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to save itinerary' });
  }
}

// --- itinerary-publish (mint share_token, stamp published_at, email owner) --
async function handleItineraryPublish(req, res) {
  const { id } = req.body || {};
  if (!isUuid(id)) return res.status(400).json({ error: 'valid id required' });

  try {
    // Load current row (need owner + existing token for idempotent re-publish).
    const { data: itin, error: loadErr } = await admin
      .from('itineraries')
      .select('id, user_id, title, share_token')
      .eq('id', id)
      .single();
    if (loadErr || !itin) return res.status(404).json({ error: 'Itinerary not found' });

    // Keep an existing token; mint a url-safe one (~22 chars) if still null.
    let shareToken = itin.share_token;
    if (!shareToken) {
      // base64url of 16 random bytes → 22 url-safe chars, no padding/+//.
      shareToken = crypto.randomBytes(16).toString('base64url');
    }

    const { error: upErr } = await admin
      .from('itineraries')
      .update({ published_at: new Date().toISOString(), share_token: shareToken })
      .eq('id', id);
    if (upErr) throw upErr;

    const url = `${SITE_ORIGIN}/itinerary?t=${shareToken}`;

    // ── Customer email (best-effort; a send failure must NOT fail publish) ──
    // Sends only with a VERIFIED sender (CUSTOMER_EMAIL_FROM, e.g.
    // "Mosim <care@mosimkorea.com>") — Resend's shared sender can't email customers.
    let emailed = false;
    const customerFrom = process.env.CUSTOMER_EMAIL_FROM;
    const to = await ownerEmail(itin.user_id);
    if (customerFrom && to) {
      try {
        const r = await sendEmail({
          from: customerFrom,
          to,
          subject: 'Your Korea itinerary is ready',
          html: itineraryReadyHtml(itin, url),
          replyTo: process.env.LEAD_NOTIFY_EMAIL || undefined
        });
        emailed = !(r && r.skipped); // skipped:true means RESEND_API_KEY not set
      } catch (e) {
        console.error('[admin/trips itinerary-publish] customer email failed:', e?.message || e);
      }
    }

    return res.status(200).json({ ok: true, share_token: shareToken, url, emailed });
  } catch (e) {
    console.error('[admin/trips itinerary-publish] failed', e?.message || e);
    return res.status(500).json({ error: 'Failed to publish itinerary' });
  }
}

// Senior-friendly, Warm Trust palette (ivory/navy/gold). One big tappable button.
function itineraryReadyHtml(itin, url) {
  const safeUrl = esc(url);
  const trip = esc(itin.title || 'your Korea trip');
  return `<div style="margin:0;padding:0;background:#FBF7EF">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#1B2A4A">
    <p style="font-size:22px;font-weight:700;color:#1B2A4A;margin:0 0 24px">Mosim</p>
    <h1 style="font-size:28px;line-height:1.3;color:#1B2A4A;margin:0 0 16px">Your Korea itinerary is ready</h1>
    <p style="font-size:19px;line-height:1.6;color:#54514B;margin:0 0 12px;font-family:Helvetica,Arial,sans-serif">
      We've finished putting together the day-by-day plan for <strong style="color:#1B2A4A">${trip}</strong> &mdash; your flights, hotel, every day, and the people you can call. It's all in one place, ready whenever you are.
    </p>
    <p style="font-size:19px;line-height:1.6;color:#54514B;margin:0 0 28px;font-family:Helvetica,Arial,sans-serif">
      Tap the button below to look it over.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px"><tr><td style="border-radius:10px;background:#C39A3F">
      <a href="${safeUrl}" style="display:inline-block;padding:18px 40px;font-size:20px;font-weight:700;color:#1B2A4A;text-decoration:none;font-family:Helvetica,Arial,sans-serif;border-radius:10px">
        View my itinerary
      </a>
    </td></tr></table>
    <p style="font-size:16px;line-height:1.6;color:#8A8479;margin:0 0 24px;font-family:Helvetica,Arial,sans-serif">
      If the button doesn't work, copy and paste this link into your web browser:<br>
      <a href="${safeUrl}" style="color:#1B2A4A;word-break:break-all">${safeUrl}</a>
    </p>
    <p style="font-size:19px;line-height:1.6;color:#54514B;margin:0;font-family:Helvetica,Arial,sans-serif">
      You're never alone in this &mdash; just reply to this email any time and a real person at Mosim will help.
    </p>
    <p style="font-size:19px;line-height:1.6;color:#1B2A4A;margin:24px 0 0;font-family:Helvetica,Arial,sans-serif">Warmly,<br>The Mosim team</p>
  </div>
</div>`;
}
