// POST /api/paypal-order
//   { action:'create',  token, amount }                  → { orderID }
//   { action:'capture', token, orderID }                 → { ok, paid, total, balance, status }
import { createClient } from '@supabase/supabase-js';
import { normalizeAmount } from './_lib/amount.js';
import { createOrder, captureOrder } from './_lib/paypal.js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Temporary test mode: when set, the page lets you complete payments WITHOUT PayPal
// (no real money). Flip PAYMENT_MOCK off once real PayPal credentials are in place.
const PAYMENT_MOCK = process.env.PAYMENT_MOCK === '1';

async function loadGroup(token) {
  const { data, error } = await supa
    .from('payment_groups')
    .select('total_amount, amount_paid, currency, status')
    .eq('share_token', token).single();
  // PGRST116 = no rows → treat as "not found" (data stays null); other errors are real.
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { action, token, amount, orderID } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });

  try {
    const g = await loadGroup(token);
    if (!g) return res.status(404).json({ error: 'Payment link not found' });
    const balance = Number(g.total_amount) - Number(g.amount_paid);

    // ── Test mode: record the payment directly, no PayPal involved ──
    if (action === 'mock-pay') {
      if (!PAYMENT_MOCK) return res.status(400).json({ error: 'Test payments are disabled' });
      if (balance <= 0) return res.status(409).json({ error: 'Already fully paid' });
      const v = normalizeAmount(amount, balance);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const fakeId = 'MOCK-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      const { data, error } = await supa.rpc('record_payment', {
        p_token: token,
        p_amount: v.amount,
        p_payer_name: 'Test Payer',
        p_payer_email: 'test@mosim.local',
        p_order_id: fakeId,
        p_capture_id: fakeId
      });
      if (error) {
        console.error('[paypal-order] mock record_payment failed', error);
        return res.status(500).json({ error: 'Could not record test payment' });
      }
      return res.status(200).json({ ok: true, mock: true, ...data });
    }

    if (action === 'create') {
      if (balance <= 0) return res.status(409).json({ error: 'Already fully paid' });
      const v = normalizeAmount(amount, balance);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const orderId = await createOrder(v.amount, g.currency);
      return res.status(200).json({ orderID: orderId });
    }

    if (action === 'capture') {
      if (!orderID) return res.status(400).json({ error: 'orderID required' });
      let cap;
      try {
        cap = await captureOrder(orderID);                  // money moves here
      } catch (e) {
        if (e.issue === 'ORDER_ALREADY_CAPTURED') {
          // Idempotent retry: order was already captured & recorded earlier.
          const cur = await loadGroup(token);
          const total = Number(cur.total_amount), paid = Number(cur.amount_paid);
          return res.status(200).json({
            ok: true, paid, total, balance: Math.max(0, total - paid), status: cur.status
          });
        }
        throw e;                                            // other errors → outer catch → 502
      }
      // Record atomically; use the amount PayPal actually captured.
      const { data, error } = await supa.rpc('record_payment', {
        p_token: token,
        p_amount: cap.amount,
        p_payer_name: cap.payerName,
        p_payer_email: cap.payerEmail,
        p_order_id: orderID,
        p_capture_id: cap.captureId
      });
      if (error) {
        // Money captured but not recorded — log loudly for manual reconciliation.
        console.error('[paypal-order] record_payment failed AFTER capture', orderID, cap.captureId, error);
        return res.status(500).json({ error: 'Payment captured but not recorded — contact support' });
      }
      return res.status(200).json({ ok: true, ...data });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('[paypal-order]', action, e);
    return res.status(502).json({ error: 'PayPal error' });
  }
}
