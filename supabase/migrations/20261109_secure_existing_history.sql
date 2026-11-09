begin;

alter table public."Riwayat Pengukuran"
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists data jsonb;

alter table public."Riwayat Pengukuran"
  alter column user_id set default auth.uid(),
  enable row level security;

revoke all on table public."Riwayat Pengukuran" from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, delete on table public."Riwayat Pengukuran" to authenticated;

drop policy if exists riwayat_pengukuran_select_own on public."Riwayat Pengukuran";
create policy riwayat_pengukuran_select_own on public."Riwayat Pengukuran"
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists riwayat_pengukuran_insert_own on public."Riwayat Pengukuran";
create policy riwayat_pengukuran_insert_own on public."Riwayat Pengukuran"
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists riwayat_pengukuran_delete_own on public."Riwayat Pengukuran";
create policy riwayat_pengukuran_delete_own on public."Riwayat Pengukuran"
  for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
