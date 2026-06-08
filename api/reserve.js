// POST /api/reserve  (Bearer token + { itinerary_id })  → marks the owner's
// itinerary as 'reserved' (free intent). Idempotent; only advances from 'new'.
import { createClient } from '@supabase/supabase-js';
import { sendEmail, esc } from './_lib/email.js';

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
    .from('itineraries').select('id, user_id, status, title, state').eq('id', itinerary_id).single();
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

  console.log('[reserve] itinerary reserved:', itinerary_id, 'by', user.email);

  // ── Notify (best-effort; never blocks the reservation) ──
  // (1) Internal alert to Mosim — active as soon as RESEND_API_KEY + LEAD_NOTIFY_EMAIL
  //     are set (works with Resend's shared sender, no domain needed).
  await sendEmail({
    to: process.env.LEAD_NOTIFY_EMAIL,
    subject: `New reservation — ${itin.title || 'a Korea trip'}`,
    html: internalAlertHtml(itin, user),
    replyTo: user.email
  }).catch((e) => console.error('[reserve] internal alert failed:', e));

  // (2) Customer confirmation — copy is ready, but only sends once a VERIFIED sender
  //     domain is configured (CUSTOMER_EMAIL_FROM, e.g. "Mosim <care@mosim.com>");
  //     Resend's shared sender cannot email customers. Stays off until then.
  const customerFrom = process.env.CUSTOMER_EMAIL_FROM;
  if (customerFrom && user.email) {
    await sendEmail({
      from: customerFrom,
      to: user.email,
      subject: "Your Mosim trip is reserved — here's what happens next",
      html: customerConfirmHtml(user, itin),
      replyTo: process.env.LEAD_NOTIFY_EMAIL || undefined
    }).catch((e) => console.error('[reserve] customer email failed:', e));
  }

  return res.status(200).json({ ok: true, status: 'reserved' });
}

const CARE_LABELS = { screening: 'health screening', knees: 'knees & joints', dental: 'dental', eyes: 'eyes', unsure: 'care guidance' };
function customerName(user) {
  return (user.user_metadata && user.user_metadata.name) || (user.email ? user.email.split('@')[0] : 'there');
}
function careList(itin) {
  const needs = (itin.state && itin.state.care && itin.state.care.needs) || [];
  return needs.map((k) => CARE_LABELS[k] || k).join(', ');
}

function internalAlertHtml(itin, user) {
  const care = careList(itin) || '—';
  const row = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8479">${esc(k)}</td><td style="font-weight:600">${esc(v)}</td></tr>`;
  return `<div style="font-family:system-ui,sans-serif;color:#1B2A4A">
    <h2 style="margin:0 0 4px">New reservation</h2>
    <p style="margin:0 0 16px;color:#54514B">A traveler just reserved their trip. Reach out within 1 business day.</p>
    <table style="border-collapse:collapse;font-size:15px">
      ${row('Name', customerName(user))}${row('Email', user.email)}${row('Trip', itin.title || 'Korea trip')}${row('Care', care)}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#8A8479">Reply to this email to reach the customer directly.</p>
  </div>`;
}

function customerConfirmHtml(user, itin) {
  const name = esc(customerName(user));
  const care = careList(itin);
  const careClause = care ? ` (e.g. ${esc(care)})` : '';
  return `<div style="font-family:system-ui,sans-serif;color:#1B2A4A;line-height:1.6;font-size:16px">
    <p>Dear ${name},</p>
    <p>Thank you for reserving your trip to Korea. <strong>Reserving is free and not a commitment</strong> — it simply tells us you're serious, so our care team can begin confirming the details for you. Your plan is saved and in good hands.</p>
    <h3 style="margin:22px 0 8px">What happens next</h3>
    <ol style="padding-left:20px;margin:0">
      <li style="margin-bottom:10px"><strong>We confirm.</strong> Our care coordinator checks your selected care${careClause} with our partner hospitals and lines up available dates around your timing.</li>
      <li style="margin-bottom:10px"><strong>We reach out — within 1 business day.</strong> A real Mosim person will contact you to confirm the specifics, answer any questions, and walk you through your plan. <em>To help us, just reply with your preferred phone number and rough travel dates.</em></li>
      <li style="margin-bottom:10px"><strong>You decide, only when ready.</strong> Once everything's confirmed, you'll see one clear concierge-fee quote — and you can pay when you're comfortable (and split it with travel companions if you like). Your hospitals, hotels, and flights are paid by you directly to those providers; <strong>Mosim never marks them up.</strong></li>
    </ol>
    <p>There's nothing to pay right now, and no commitment. You're never alone in this — reply to this email anytime.</p>
    <p style="margin-top:20px">Warmly,<br>The Mosim team</p>
  </div>`;
}
