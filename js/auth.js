// K-Wellness Concierge — Supabase auth client + helpers.
// Loaded as <script type="module" src="/js/auth.js"></script>
//
// Public API exposed on window.kwAuth:
//   init()                          → Promise<SupabaseClient>
//   getUser()                       → Promise<User | null>
//   getProfile()                    → Promise<Profile | null>
//   signInWithGoogle(returnTo)      → never resolves (redirects)
//   signInWithEmail(email, pw)      → Promise<{ user, error }>
//   signUpWithEmail(email, pw, name, returnTo) → Promise<{ user, error }>
//   resetPassword(email, returnTo)  → Promise<{ error }>
//   updatePassword(newPassword)     → Promise<{ error }>
//   signOut()                       → Promise<void>
//   onChange(cb)                    → unsubscribe()
//
// All functions are safe to call before init() — they await it internally.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm';

let clientPromise = null;

function init() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error('Failed to load /api/config');
    const { supabaseUrl, supabaseAnonKey } = await r.json();
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
  })();
  return clientPromise;
}

async function getUser() {
  const supa = await init();
  const { data } = await supa.auth.getUser();
  return data?.user || null;
}

async function getProfile() {
  const supa = await init();
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supa.from('profiles').select('*').eq('id', user.id).single();
  if (error && error.code !== 'PGRST116') console.warn('[auth] getProfile', error);
  return data || null;
}

async function signInWithGoogle(returnTo) {
  const supa = await init();
  const redirectTo = absoluteUrl(returnTo || '/me.html');
  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if (error) return { error };
  // signInWithOAuth redirects the browser; nothing below this runs.
  return {};
}

async function signInWithEmail(email, password) {
  const supa = await init();
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  return { user: data?.user || null, error };
}

async function signUpWithEmail(email, password, name, returnTo) {
  const supa = await init();
  const emailRedirectTo = absoluteUrl(returnTo || '/me.html');
  const { data, error } = await supa.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo }
  });
  return { user: data?.user || null, error };
}

async function resetPassword(email, returnTo) {
  const supa = await init();
  const redirectTo = absoluteUrl(returnTo || '/reset-password.html');
  const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
  return { error };
}

async function updatePassword(newPassword) {
  const supa = await init();
  const { error } = await supa.auth.updateUser({ password: newPassword });
  return { error };
}

async function signOut() {
  const supa = await init();
  await supa.auth.signOut();
}

async function onChange(cb) {
  const supa = await init();
  const { data } = supa.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return window.location.origin + '/me.html';
  if (/^https?:/.test(pathOrUrl)) return pathOrUrl;
  return window.location.origin + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

window.kwAuth = {
  init, getUser, getProfile,
  signInWithGoogle, signInWithEmail, signUpWithEmail,
  resetPassword, updatePassword, signOut, onChange
};
