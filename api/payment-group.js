// GET  /api/payment-group?token=<t>                                  → public summary by token
// POST /api/payment-group   (Bearer + { itinerary_id })              → create-or-get; owner or admin
// POST /api/payment-group   (no Bearer + { token, companion_email })  → email the /pay link to a companion
import { createClient } from '@supabase/supabase-js';
import { adminEmails } from './_lib/admin.js';
import { sendEmail } from './_lib/email.js';
import { companionPayEmail } from './_lib/pay-emails.js';
import {
  groupSize, tripDays, perPersonFee, ensurePaymentGroup
} from './_lib/payment-group.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://mosimkorea.com';

const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const body = req.body || {};
    const auth = req.headers.authorization || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    // ── Companion-email path: no Bearer, has { token, companion_email } ──────
    // Same trust model as the public /pay page: a valid share token is enough.
    if (!bearer && (body.companion_email || body.token)) {
      const token = (body.token || '').toString().trim();
      const email = (body.companion_email || '').toString().trim();
      if (!token) return res.status(400).json({ error: 'token required' });
      if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });

      const { data: g } = await supa
        .from('payment_groups')
        .select('share_token, itinerary_id')
        .eq('share_token', token)
        .single();
      if (!g) return res.status(404).json({ error: 'Payment link not found' });

      const { data: itin } = await supa
        .from('itineraries').select('title, user_id').eq('id', g.itinerary_id).single();
      let inviterName = '';
      if (itin?.user_id) {
        const { data: prof } = await supa
          .from('profiles').select('name').eq('id', itin.user_id).single();
        inviterName = (prof?.name || '').trim();
      }

      const customerFrom = process.env.CUSTOMER_EMAIL_FROM;
      if (!customerFrom) {
        // No verified sender configured — don't pretend we sent it.
        return res.status(503).json({ error: 'Email is not available yet' });
      }
      const payUrl = `${SITE_ORIGIN}/pay?g=${g.share_token}`;
      const { subject, html } = companionPayEmail({ payUrl, inviterName, tripTitle: itin?.title });
      try {
        const r = await sendEmail({
          from: customerFrom, to: email, subject, html,
          replyTo: process.env.LEAD_NOTIFY_EMAIL || undefined
        });
        if (r && r.skipped) return res.status(503).json({ error: 'Email is not available yet' });
      } catch (e) {
        console.error('[payment-group companion-email] send failed', e?.message || e);
        return res.status(502).json({ error: 'Could not send the email — please try again' });
      }
      return res.status(200).json({ ok: true });
    }

    // ── Create-or-get path: Bearer + { itinerary_id } (owner or admin) ───────
    if (!bearer) return res.status(401).json({ error: 'Missing bearer token' });
    const { data: { user }, error: userErr } = await supa.auth.getUser(bearer);
    if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { itinerary_id } = body;
    if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

    const { data: itin } = await supa
      .from('itineraries').select('id, user_id, state, schedule').eq('id', itinerary_id).single();
    const isAdmin = adminEmails().includes((user.email || '').toLowerCase());
    if (!itin || (itin.user_id !== user.id && !isAdmin)) {
      return res.status(403).json({ error: 'Not your itinerary' });
    }

    try {
      const g = await ensurePaymentGroup(supa, {
        itinerary_id, state: itin.state, schedule: itin.schedule
      });
      return res.status(200).json({ token: g.share_token });
    } catch (e) {
      console.error('[payment-group] create failed', e?.message || e);
      return res.status(500).json({ error: 'Failed to create payment group' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
