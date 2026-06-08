// Founder/admin gating for the cockpit admin APIs.
// Allowlist comes from ADMIN_EMAILS (comma-separated); defaults to the founder.
export function adminEmails() {
  const raw = process.env.ADMIN_EMAILS || 'mjang9898@gmail.com';
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Returns the authenticated user IF they're an admin, else null.
export async function getAdminUser(req, admin) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const email = (user.email || '').toLowerCase();
  return adminEmails().includes(email) ? user : null;
}
