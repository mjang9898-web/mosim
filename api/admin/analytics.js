// GET /api/admin/analytics?days=30  — admin only.
// Marketing analytics for the cockpit: traffic overview, the planner funnel (step1→result)
// with per-step drop-off, and top traffic sources. Data comes from PostHog via the Query
// API (HogQL) using the server-side personal key — anonymous pageviews only (no PII).
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const PH_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PH_HOST = 'https://us.posthog.com';
const PH_PROJECT = '463716';

async function hogql(query) {
  const r = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + PH_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } })
  });
  if (!r.ok) throw new Error('PostHog ' + r.status + ': ' + (await r.text()).slice(0, 240));
  const d = await r.json();
  return d.results || [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });
  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });
  if (!PH_KEY) return res.status(503).json({ error: 'Analytics not configured yet' });

  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 90);
  const since = `now() - INTERVAL ${days} DAY`;

  try {
    const [overviewRows, funnelRows, sourceRows] = await Promise.all([
      hogql(`SELECT count() AS pageviews, uniq(distinct_id) AS visitors
             FROM events WHERE event = '$pageview' AND timestamp > ${since}`),
      hogql(`SELECT
               uniqIf(distinct_id, properties.$current_url LIKE '%step1%') AS s1,
               uniqIf(distinct_id, properties.$current_url LIKE '%step2%') AS s2,
               uniqIf(distinct_id, properties.$current_url LIKE '%step3%') AS s3,
               uniqIf(distinct_id, properties.$current_url LIKE '%step4%') AS s4,
               uniqIf(distinct_id, properties.$current_url LIKE '%result%') AS res
             FROM events WHERE event = '$pageview' AND timestamp > ${since}`),
      hogql(`SELECT coalesce(nullIf(properties.$referring_domain, ''), '$direct') AS source,
                    uniq(distinct_id) AS visitors, count() AS views
             FROM events WHERE event = '$pageview' AND timestamp > ${since}
             GROUP BY source ORDER BY visitors DESC LIMIT 8`)
    ]);

    const o = overviewRows[0] || [0, 0];
    const f = funnelRows[0] || [0, 0, 0, 0, 0];
    const funnel = [
      { step: 'Care (step 1)',        visitors: Number(f[0]) || 0 },
      { step: 'Trip (step 2)',        visitors: Number(f[1]) || 0 },
      { step: 'Experiences (step 3)', visitors: Number(f[2]) || 0 },
      { step: 'Comfort (step 4)',     visitors: Number(f[3]) || 0 },
      { step: 'AI plan (result)',     visitors: Number(f[4]) || 0 }
    ];
    const sources = sourceRows.map((row) => ({
      source: row[0] === '$direct' ? 'Direct / none' : row[0],
      visitors: Number(row[1]) || 0,
      views: Number(row[2]) || 0
    }));

    return res.status(200).json({
      days,
      overview: { pageviews: Number(o[0]) || 0, visitors: Number(o[1]) || 0 },
      funnel,
      sources
    });
  } catch (e) {
    console.error('[admin/analytics] failed', e?.message || e);
    return res.status(502).json({ error: 'Analytics query failed', detail: String(e?.message || e).slice(0, 240) });
  }
}
