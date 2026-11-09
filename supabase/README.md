# Supabase Auth and history setup

The frontend uses the public publishable key only. Measurement history uses the existing `public."Riwayat Pengukuran"` table. Its verified columns are `id` (identity primary key), `created_at`, `machine`, `chamber`, `dw_zerf`, and `gy`. The application stores its full calculation payload in the `data` JSONB column and scopes rows to the signed-in user through `user_id` and row-level security (RLS). The existing `dw_zerf` and `gy` values are left unchanged because their meaning is not defined by the schema.

## Secure the existing history table

Run `migrations/20261109_secure_existing_history.sql` in the Supabase SQL Editor after reviewing it. It only adds `user_id` and `data` to the existing table, enables RLS, and grants authenticated users only the select/insert/delete privileges needed by the app. It does not create, drop, or backfill any table or row. Existing rows have no verified owner, so they remain inaccessible under RLS rather than being assigned to an account. Until this migration is applied, history requests fail because the live table has no `user_id` or `data` columns (`42703: undefined_column`).

The older `migrations/20261104_auth_history.sql` is retired and must not be applied; it created a separate history table. This history migration does not configure account registration or username login. Keep any already-deployed Auth profile and Edge Function setup separately.

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

The app's registration and recovery redirects use the current app origin. Email delivery and username login cannot be verified until the Auth profile setup is deployed, the Edge Function is deployed with its secrets, and Auth email settings are configured. The `SUPABASE_SERVICE_ROLE_KEY` must never be placed in frontend code or committed files.