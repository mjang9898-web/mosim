// POST /api/admin/trip-status  { itinerary_id, status, flight_status?, stay_status?, travelers?, total_override? }
//   — admin only. Advances a trip's concierge status (the customer sees it in My Page).
//   When status is set to 'booked', also create-or-get the payment_group for that
//   itinerary and email the owner the pay link (best-effort — never fails the status
//   update). Returns the pay link details so the cockpit can show them.
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '../_lib/admin.js';
import { sendEmail } from '../_lib/email.js';
import { customerPayEmail } from '../_lib/pay-emails.js';
import { ensurePaymentGroup } from '../_lib/payment-group.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://mosimkorea.com';
const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const ALLOWED = ['new', 'reserved', 'reviewing', 'quoted', 'booked', 'archived'];
const BOOKING = ['none', 'pending', 'booked'];   // flight_status / stay_status

async function ownerEmail(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) throw error;
    return (data && data.user && data.user.email) || null;
  } catch (e) {
    console.error('[admin/trip-status] ownerEmail lookup failed', e?.message || e);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const me = await getAdminUser(req, admin);
  if (!me) return res.status(403).json({ error: 'Admins only' });

  const { itinerary_id, status, flight_status, stay_status, travelers, total_override } = req.body || {};
  if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

  const update = {};
  if (status !== undefined) {
    if (!ALLOWED.includes(status)) return res.status(400).json({ error: 'invalid status' });
    update.status = status;
  }
  if (flight_status !== undefined) {
    if (!BOOKING.includes(flight_status)) return res.status(400).json({ error: 'invalid flight_status' });
    update.flight_status = flight_status;
  }
  if (stay_status !== undefined) {
    if (!BOOKING.includes(stay_status)) return res.status(400).json({ error: 'invalid stay_status' });
    update.stay_status = stay_status;
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'no valid fields to update' });

  const { error } = await admin.from('itineraries').update(update).eq('id', itinerary_id);
  if (error) {
    console.error('[admin/trip-status] update failed', error);
    return res.status(500).json({ error: 'Failed to update' });
  }

  const out = { ok: true, ...update };

  // ── On 'booked': create-or-get the payment group + email the owner the link ──
  if (update.status === 'booked') {
    try {
      const { data: itin } = await admin
        .from('itineraries')
        .select('id, user_id, title, state, schedule')
        .eq('id', itinerary_id)
        .single();
      if (itin) {
        const t = parseInt(travelers, 10);
        const ov = Number(total_override);
        const g = await ensurePaymentGroup(admin, {
          itinerary_id,
          state: itin.state,
          schedule: itin.schedule,
          travelers: Number.isFinite(t) && t > 0 ? t : undefined,
          totalOverride: Number.isFinite(ov) && ov > 0 ? ov : undefined
        });

        out.share_token = g.share_token;
        out.url = `${SITE_ORIGIN}/pay?g=${g.share_token}`;
        out.total = g.total;
        out.travelers = g.travelers;

        // Email the owner the pay link — best-effort; a failure must NOT fail booking.
        const customerFrom = process.env.CUSTOMER_EMAIL_FROM;
        const to = await ownerEmail(itin.user_id);
        if (customerFrom && to) {
          try {
            const { subject, html } = customerPayEmail({
              payUrl: out.url, total: g.total, travelers: g.travelers, tripTitle: itin.title
            });
            const r = await sendEmail({ from: customerFrom, to, subject, html, replyTo: process.env.LEAD_NOTIFY_EMAIL || undefined });
            out.emailed = !(r && r.skipped);
          } catch (e) {
            console.error('[admin/trip-status] owner pay email failed', e?.message || e);
            out.emailed = false;
          }
        } else {
          out.emailed = false;
        }
      }
    } catch (e) {
      // Group creation failed — the status change still stands.
      console.error('[admin/trip-status] payment group on booked failed', e?.message || e);
      out.payment_group_error = true;
    }
  }

  return res.status(200).json(out);
}
