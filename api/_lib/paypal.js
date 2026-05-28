// Minimal PayPal REST client (no SDK). Server-side only — uses the secret.
const BASE = (process.env.PAYPAL_ENV || 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error(`paypal token ${r.status}`);
  return (await r.json()).access_token;
}

export async function createOrder(amount, currency = 'USD') {
  const tok = await accessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) } }]
    })
  });
  if (!r.ok) throw new Error(`paypal create ${r.status}`);
  return (await r.json()).id;
}

export async function captureOrder(orderId) {
  const tok = await accessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
  });
  const data = await r.json();
  if (!r.ok || data.status !== 'COMPLETED') {
    throw new Error(`paypal capture ${r.status} ${data.status || ''}`);
  }
  const pu = data.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const payer = data.payer || {};
  return {
    captureId: cap?.id || null,
    amount: Number(cap?.amount?.value || 0),
    payerName: [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ') || null,
    payerEmail: payer.email_address || null
  };
}
