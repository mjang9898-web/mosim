import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supa) {
    console.error('[api/lead] Supabase env vars not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const body = req.body || {};
    const { name, email, from, when: travelWhen, interest, note, state } = body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Privacy promise: the free-text care note is client-only and must never be
    // persisted. The client already strips it; we strip again here defensively.
    let safeState = null;
    if (state && typeof state === 'object') {
      try {
        safeState = JSON.parse(JSON.stringify(state));
        if (safeState.care && typeof safeState.care === 'object') delete safeState.care.note;
      } catch (e) {
        safeState = null;
      }
    }

    // If a bearer token is present, attach the user_id to the lead.
    let userId = null;
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      try {
        const { data: { user } } = await supa.auth.getUser(token);
        if (user) userId = user.id;
      } catch (e) {
        // best-effort — proceed without user_id
      }
    }

    const { data, error } = await supa
      .from('leads')
      .insert({
        name: name || null,
        email: email.trim().toLowerCase(),
        origin_from: from || null,
        travel_when: travelWhen || null,
        interest: interest || null,
        note: note || null,
        state: safeState,
        user_id: userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('[api/lead] supabase insert failed:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    // Best-effort email notification — never blocks or fails the lead capture.
    await notifyByEmail({
      name, email: email.trim().toLowerCase(), from, travelWhen, interest, state: safeState
    }).catch((e) => console.error('[api/lead] notify failed:', e));

    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    console.error('[api/lead] unexpected error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Sends a plain notification to the Mosim team when a new lead comes in.
// No-op (silently skipped) until both env vars are set, so lead capture keeps
// working before email is configured:
//   RESEND_API_KEY     — from resend.com (free tier; starts "re_")
//   LEAD_NOTIFY_EMAIL  — where to send the alert (e.g. the founder's inbox)
// Optional: LEAD_FROM_EMAIL — defaults to Resend's shared onboarding sender,
//   which can only deliver to the account owner until a domain is verified.
async function notifyByEmail({ name, email, from, travelWhen, interest, state }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!apiKey || !to) return; // not configured yet — skip quietly

  const fromAddr = process.env.LEAD_FROM_EMAIL || 'Mosim <onboarding@resend.dev>';
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  const care = (state && state.care && state.care.needs) || [];
  const trip = (state && state.trip) || {};
  const comfort = (state && state.comfort) || {};
  const rows = [
    ['Name', name],
    ['Email', email],
    ['Coming from', from],
    ['When', travelWhen],
    ['Care interest', interest || care.join(', ')],
    ['Trip length', trip.length],
    ['Party', trip.party],
    ['Pace', comfort.pace]
  ].filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#8A8479">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(v)}</td></tr>`).join('');

  const html = `<div style="font-family:system-ui,sans-serif;color:#1B2A4A">
    <h2 style="margin:0 0 4px">New Mosim lead</h2>
    <p style="margin:0 0 16px;color:#54514B">Someone finished the planner and asked to talk.</p>
    <table style="border-collapse:collapse;font-size:15px">${rows}</table>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddr,
      to: [to],
      reply_to: email,
      subject: `New Mosim lead — ${name || email}`,
      html
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Resend ${r.status}: ${t}`);
  }
}
