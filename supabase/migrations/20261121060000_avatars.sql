-- Profile photos in a public Storage bucket, one folder per user: avatars/<user id>/<timestamp>.webp|jpg
-- Images are resized in the browser to 512x512 before upload, so 512 KB is plenty.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Public bucket: anyone can view via the public URL. Writes only inside your own folder.
-- (select is needed for delete; it only lists your own files.)
create policy "Users can read their own avatar files"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload to their own avatar folder"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatar files"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Path must be in the owner's own folder, so a card can't show someone else's upload.
alter table public.profiles
  add column avatar_path text
    check (avatar_path ~ '^[0-9a-f-]{36}/[0-9]+\.(webp|jpg)$' and split_part(avatar_path, '/', 1) = id::text);
