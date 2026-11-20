-- Never show a signed-in user their own card.
create or replace function public.random_profiles(exclude uuid[] default '{}', n int default 3)
returns setof public.profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.profiles
  where not (id = any (exclude))
    and id is distinct from (select auth.uid())
  order by random()
  limit least(greatest(n, 0), 10);
$$;
