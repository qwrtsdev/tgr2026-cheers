-- DEV badge. Only admins (SQL editor / service role) can set it:
--   update public.profiles set is_dev = true where id = '<user id>';
alter table public.profiles add column is_dev boolean not null default false;

-- Users may write every column except is_dev (column-level grants; RLS still limits them to their own row).
-- When adding a user-editable column later, add it to both lists.
revoke insert, update on table public.profiles from authenticated;
grant insert (id, display_name, description, tgr_team_number, avatar_path,
              facebook_url, instagram_url, discord_username, github_url)
  on table public.profiles to authenticated;
grant update (id, display_name, description, tgr_team_number, avatar_path,
              facebook_url, instagram_url, discord_username, github_url)
  on table public.profiles to authenticated;
