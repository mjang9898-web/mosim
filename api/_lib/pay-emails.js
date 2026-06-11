// Senior-friendly, Warm Trust (ivory / navy / gold, Lora serif) email templates for
// the concierge-fee pay link. Body text is >=19px, one big tappable button to
// /pay?g=<token>, with a plaintext fallback link. Used by:
//   - api/admin/trip-status.js  → customerPayEmail()   (owner, on 'booked')
//   - api/payment-group.js      → companionPayEmail()  (companion, on request)
import { esc } from './email.js';

const NAVY = '#1F3A5F';
const GOLD = '#C39A3F';
const INK = '#2B2B2B';
const IVORY = '#F7F2E9';

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');

// Shared shell: ivory page, navy serif headline, one gold button, plaintext fallback.
function shell({ heading, intro, amountLine, buttonLabel, payUrl, outro }) {
  const safeUrl = esc(payUrl);
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${IVORY};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #EAE0CF;">
        <tr><td style="background:${NAVY};padding:28px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#ffffff;letter-spacing:.5px;">Mosim</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#D8C79B;margin-top:4px;">Your Korea care concierge</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:${NAVY};font-weight:normal;">${esc(heading)}</h1>
          <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:1.6;color:${INK};">${intro}</p>
          ${amountLine ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;background:${IVORY};border-radius:12px;"><tr><td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:1.5;color:${INK};">${amountLine}</td></tr></table>` : ''}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
            <td align="center" bgcolor="${GOLD}" style="border-radius:12px;">
              <a href="${safeUrl}" style="display:inline-block;padding:18px 36px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;">${esc(buttonLabel)}</a>
            </td>
          </tr></table>
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.6;color:#5A5A5A;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.6;word-break:break-all;"><a href="${safeUrl}" style="color:${NAVY};">${safeUrl}</a></p>
          ${outro ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:1.6;color:${INK};">${outro}</p>` : ''}
        </td></tr>
        <tr><td style="padding:22px 32px;border-top:1px solid #EAE0CF;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#8A8A8A;">
          You're never alone on this trip. Reply to this email any time and a real person at Mosim will help.<br>
          This fee covers Mosim's concierge service only. Your hospital and travel costs are paid directly to those providers.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Customer (itinerary owner), sent when the admin marks the trip 'booked'.
// amount: total concierge fee; travelers, days optional context.
export function customerPayEmail({ payUrl, total, travelers, tripTitle }) {
  const heading = 'Your Mosim concierge fee is ready';
  const who = travelers && travelers > 1 ? `for ${travelers} travelers` : '';
  const trip = tripTitle ? ` for <strong>${esc(tripTitle)}</strong>` : '';
  const intro =
    `Wonderful news — your Korea trip${trip} is confirmed, and we've set up your concierge fee${who ? ' ' + who : ''}. ` +
    `You can pay it now, all at once or in parts. If family or friends are joining you, you can split it with them — everyone can pay their share from the same secure page.`;
  const amountLine = `<strong>Concierge fee:</strong> ${money(total)}<br><span style="color:#5A5A5A;font-size:17px;">Pay in full or split it — your choice.</span>`;
  const outro = 'Take your time. Whenever you\'re ready, just tap the button above.';
  return {
    subject: 'Your Mosim concierge fee — ready to pay (split it if you like)',
    html: shell({ heading, intro, amountLine, buttonLabel: 'Pay or split the fee', payUrl, outro })
  };
}

// Companion, sent when someone shares the pay link from the pay page.
// inviterName optional; tripTitle optional.
export function companionPayEmail({ payUrl, inviterName, tripTitle }) {
  const who = inviterName && inviterName.trim() ? esc(inviterName.trim()) : 'A friend';
  const trip = tripTitle ? ` to ${esc(tripTitle)}` : ' to Korea';
  const heading = `You're invited to share a Mosim trip cost`;
  const intro =
    `${who} is travelling${trip} with Mosim — a full-service concierge that stays beside them the whole way — ` +
    `and has invited you to help with the concierge fee. You can pay any amount toward it from the secure page below; ` +
    `there's no account or sign-in needed.`;
  const outro = 'Thank you for helping make this trip possible.';
  return {
    subject: `${who} invited you to share their Mosim trip cost`,
    html: shell({ heading, intro, amountLine: '', buttonLabel: 'Pay a share', payUrl, outro })
  };
}
