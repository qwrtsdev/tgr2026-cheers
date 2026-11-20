-- Revert the 3-file limit from 20261121110000_hardening.sql: a storage.objects policy that queries
-- storage.objects makes Storage uploads fail ("The database schema is invalid or incompatible").
-- The app already deletes leftover files before each upload, so each folder holds one photo anyway.
drop policy if exists "Users can upload to their own avatar folder" on storage.objects;

create policy "Users can upload to their own avatar folder"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
