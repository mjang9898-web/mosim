// POST  /api/payment-group   (Bearer token + { itinerary_id })  → create-or-get; owner only
// GET   /api/payment-group?token=<t>                            → public summary by token
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { adminEmails } from './_lib/admin.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_FEE = 1200;   // concierge fee per traveler for a one-week (7-day) trip
const BASE_DAYS = 7;     // the fee is prorated from this baseline to the actual trip length

const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function groupSize(state) {
  const t = state?.trip || {};
  const ps = parseInt(t.partySize, 10);            // current planner model
  if (Number.isFinite(ps) && ps > 0) return ps;
  const n = (parseInt(t.adults, 10) || 0) + (parseInt(t.children, 10) || 0); // legacy
  return n > 0 ? n : 1;
}

// Number of days in the trip. The finalized day-by-day itinerary is the source
// of truth; fall back to the planner's rough length range, then the 7-day base.
function tripDays(state, schedule) {
  if (Array.isArray(schedule) && schedule.length > 0) return schedule.length;
  const t = state?.trip || {};
  const explicit = parseInt(t.days, 10);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const byRange = { under1w: 5, '1to2w': 10, '2plus': 16 };
  return byRange[t.length] || BASE_DAYS;
}

// $1,200 for a 7-day trip, prorated to the actual number of days, per traveler.
function perPersonFee(days) {
  return Math.round((BASE_FEE / BASE_DAYS) * days);
}

function computeTotal(state, schedule) {
  return perPersonFee(tripDays(state, schedule)) * groupSize(state);
}

export default async function handler(req, res) {
  if (!supa) return res.status(500).json({ error: 'Server not configured' });

  if (req.method === 'GET') {
    const token = (req.query.token || '').toString();
    if (!token) return res.status(400).json({ error: 'token required' });
    const { data: g } = await supa
      .from('payment_groups')
      .select('total_amount, amount_paid, currency, status, itinerary_id')
      .eq('share_token', token)
      .single();
    if (!g) return res.status(404).json({ error: 'Payment link not found' });
    const { data: itin } = await supa
      .from('itineraries').select('title, state, schedule').eq('id', g.itinerary_id).single();
    const days = tripDays(itin?.state, itin?.schedule);
    return res.status(200).json({
      title: itin?.title || 'Mosim concierge',
      people: groupSize(itin?.state),
      days,
      perPerson: perPersonFee(days),
      total: Number(g.total_amount),
      paid: Number(g.amount_paid),
      balance: Math.max(0, Number(g.total_amount) - Number(g.amount_paid)),
      currency: g.currency,
      status: g.status
    });
  }

  if (req.method === 'POST') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });
    const { data: { user }, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { itinerary_id } = req.body || {};
    if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

    const { data: itin } = await supa
      .from('itineraries').select('id, user_id, state, schedule').eq('id', itinerary_id).single();
    // The owner OR a Mosim admin (concierge invoicing from the cockpit) may set up payment.
    const isAdmin = adminEmails().includes((user.email || '').toLowerCase());
    if (!itin || (itin.user_id !== user.id && !isAdmin)) {
      return res.status(403).json({ error: 'Not your itinerary' });
    }

    // Idempotent: return the existing group if there is one.
    const { data: existing } = await supa
      .from('payment_groups').select('share_token').eq('itinerary_id', itinerary_id).single();
    if (existing) return res.status(200).json({ token: existing.share_token });

    const shareToken = crypto.randomBytes(24).toString('hex');
    const total = computeTotal(itin.state, itin.schedule);
    const { data, error } = await supa
      .from('payment_groups')
      .insert({ itinerary_id, share_token: shareToken, total_amount: total })
      .select('share_token').single();
    if (error) {
      if (error.code === '23505') {
        // Lost a concurrent create race — return the winner's token (idempotent).
        const { data: winner } = await supa
          .from('payment_groups').select('share_token').eq('itinerary_id', itinerary_id).single();
        if (winner) return res.status(200).json({ token: winner.share_token });
      }
      console.error('[payment-group] insert failed', error);
      return res.status(500).json({ error: 'Failed to create payment group' });
    }
    return res.status(200).json({ token: data.share_token });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
