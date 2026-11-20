-- Fetch several random cards at once so the client can prefetch ahead.
-- security invoker = RLS still applies.
-- ponytail: order by random() scans the whole table; fine to ~100k rows, switch to tablesample if it grows.
create function public.random_profiles(exclude uuid[] default '{}', n int default 3)
returns setof public.profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.profiles
  where not (id = any (exclude))
  order by random()
  limit least(greatest(n, 0), 10);
$$;

revoke execute on function public.random_profiles(uuid[], int) from public;
grant execute on function public.random_profiles(uuid[], int) to anon, authenticated;

-- Replaced by random_profiles.
drop function public.random_profile(uuid);
