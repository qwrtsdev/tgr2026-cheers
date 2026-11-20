-- Security hardening pass.

-- 1) Trigger helper is not an API: nobody should call it directly.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 2) random_profiles: cap the exclude list so a huge array can't be used to burn CPU.
create or replace function public.random_profiles(exclude uuid[] default '{}', n int default 3)
returns setof public.profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.profiles
  where not (id = any (exclude[1:50]))
    and id is distinct from (select auth.uid())
  order by random()
  limit least(greatest(n, 0), 10);
$$;

-- 3) Avatars: at most 3 files per user folder (the app keeps 1, briefly 2 while replacing),
--    so an account can't be used as free unlimited file storage.
drop policy "Users can upload to their own avatar folder" on storage.objects;
create policy "Users can upload to their own avatar folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    select count(*) from storage.objects o
    where o.bucket_id = 'avatars' and (storage.foldername(o.name))[1] = (select auth.uid())::text
  ) < 3
);
