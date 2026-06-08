// Minimal Resend email sender. No-op (returns {skipped:true}) until RESEND_API_KEY
// is set, so callers can fire it safely before email is configured.
//
// Env:
//   RESEND_API_KEY      — from resend.com (free tier; starts "re_")
//   LEAD_FROM_EMAIL     — default "from" (defaults to Resend's shared sender, which
//                         can only deliver to the account owner until a domain is verified)
export async function sendEmail({ to, subject, html, replyTo, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return { skipped: true };

  const fromAddr = from || process.env.LEAD_FROM_EMAIL || 'Mosim <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddr,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Resend ${r.status}: ${t}`);
  }
  return { ok: true };
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
