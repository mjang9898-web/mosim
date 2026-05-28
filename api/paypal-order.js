// POST /api/paypal-order
//   { action:'create',  token, amount }                  → { orderID }
//   { action:'capture', token, orderID }                 → { ok, paid, total, balance, status }
import { createClient } from '@supabase/supabase-js';
import { normalizeAmount } from './_lib/amount.js';
import { createOrder, captureOrder } from './_lib/paypal.js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function loadGroup(token) {
  const { data } = await supa
    .from('payment_groups')
    .select('total_amount, amount_paid, currency, status')
    .eq('share_token', token).single();
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { action, token, amount, orderID } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });

  const g = await loadGroup(token);
  if (!g) return res.status(404).json({ error: 'Payment link not found' });
  const balance = Number(g.total_amount) - Number(g.amount_paid);

  try {
    if (action === 'create') {
      if (balance <= 0) return res.status(409).json({ error: 'Already fully paid' });
      const v = normalizeAmount(amount, balance);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const orderId = await createOrder(v.amount, g.currency);
      return res.status(200).json({ orderID: orderId });
    }

    if (action === 'capture') {
      if (!orderID) return res.status(400).json({ error: 'orderID required' });
      const cap = await captureOrder(orderID);              // money moves here
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
