-- Leaderboard also returns is_dev (DEV badge). Return type changes, so drop and recreate.
drop function public.leaderboard(int);

create function public.leaderboard(n int default 10)
returns table (id uuid, display_name text, avatar_path text, is_dev boolean, cheers bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_path, p.is_dev, count(*) as cheers
  from public.cheers c
  join public.profiles p on p.id = c.to_profile
  group by p.id, p.display_name, p.avatar_path, p.is_dev
  order by cheers desc, max(c.created_at) asc
  limit least(greatest(n, 0), 10);
$$;

revoke execute on function public.leaderboard(int) from public;
grant execute on function public.leaderboard(int) to anon, authenticated;
