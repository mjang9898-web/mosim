# Supabase Setup — Auth Providers & Redirect URLs

One-time configuration after running `schema.sql`. Do this in the Supabase Dashboard.

## A) Google OAuth

1. Go to https://console.cloud.google.com/ and create (or pick) a project.
2. APIs & Services → OAuth consent screen → External → fill in app name, support email, developer contact. Save.
3. APIs & Services → Credentials → Create credentials → OAuth client ID.
   - Application type: Web application
   - Authorized JavaScript origins:
     - https://<your-production-domain>
     - http://localhost:3000
   - Authorized redirect URIs:
     - https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
4. Copy the **Client ID** and **Client Secret**.
5. In Supabase Dashboard → Authentication → Providers → Google: enable, paste Client ID + Secret. Save.

## B) URL Configuration

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://<your-production-domain>`
- **Redirect URLs** (add each on its own line):
  - `https://<your-production-domain>/me.html`
  - `https://<your-production-domain>/signin.html`
  - `https://<your-production-domain>/signup.html`
  - `https://<your-production-domain>/reset-password.html`
  - `https://<your-production-domain>/result.html`
  - `http://localhost:3000/me.html`
  - `http://localhost:3000/signin.html`
  - `http://localhost:3000/signup.html`
  - `http://localhost:3000/reset-password.html`
  - `http://localhost:3000/result.html`

## C) Email Templates (optional polish)

Authentication → Email Templates → edit "Confirm signup" and "Reset password" to use a K-Wellness tone. Keep the `{{ .ConfirmationURL }}` token.

## D) Verify

In Supabase Dashboard → Authentication → Providers, Google should show "Enabled". URL Configuration should list at least the two domains above.
