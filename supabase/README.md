# Supabase Auth and history setup

The frontend uses the public publishable key only. The existing `Riwayat Pengukuran` table does not expose a user UUID or a calculation payload column through the project's public schema. The migration below intentionally creates a separate `measurement_history` table and a `profiles` table; it does not delete or rewrite rows in the existing table. Existing rows are not copied because their owning Auth UUID cannot be established safely.

## Apply the migration

Review and run `migrations/20261104_auth_history.sql` in the Supabase SQL Editor. It creates `profiles`, `measurement_history`, username uniqueness, a profile-creation trigger, grants required by the authenticated client, and per-user RLS policies. It does not alter the existing `Riwayat Pengukuran` table. Do not run it until you have reviewed the effects.

## Deploy username login

From this repository root, link the Supabase project and deploy the function:

```powershell
supabase login
supabase link --project-ref ioutuheuahsvnjzngzdp
supabase functions deploy login-by-username
```

Set these Edge Function secrets in the Supabase dashboard's Edge Function Secrets page (or with `supabase secrets set`):

- `APP_ORIGINS`: comma-separated exact origins of the deployed app (include localhost origins only for development).
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable/anon key if `SUPABASE_ANON_KEY` is not present in the Edge Function environment.
- `SUPABASE_SERVICE_ROLE_KEY`: the service-role secret, stored only in Edge Function Secrets. Never put it in this repository or frontend.

`SUPABASE_URL` is supplied by the Supabase Edge Function environment. Set `APP_ORIGINS` to the exact deployed web origin before deployment. Username lookup returns only an Auth session, never the account email. Invalid usernames and passwords have the same response. The service-role secret is used only by the Edge Function to look up the profile; it is never exposed to the browser.

## Configure Auth email flows

- Enable email confirmations in Supabase Auth.
- Set the production Site URL and add the deployed app URL to the Auth redirect allowlist.
- Configure SMTP for reliable confirmation and password-recovery delivery.
- Verify that the confirmation and recovery templates use the Supabase-provided action link.
- Add the app's exact URL, including its `index.html` redirect, to the Auth redirect allowlist.

The app's registration and recovery redirects use the current app origin. Email delivery and username login cannot be verified until the migration is applied, the Edge Function is deployed with its secrets, and Auth email settings are configured. The `SUPABASE_SERVICE_ROLE_KEY` must never be placed in frontend code or committed files.