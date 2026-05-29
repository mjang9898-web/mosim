// Returns the public Supabase config needed by the browser.
// SUPABASE_ANON_KEY is safe to expose (RLS protects data).
// SUPABASE_SERVICE_ROLE_KEY is NEVER returned here.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not set' });
  }
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
  const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    paypalClientId: PAYPAL_CLIENT_ID,
    paypalEnv: PAYPAL_ENV
  });
}
