-- Cheers: each user can cheer a given card once, never their own.

create table public.cheers (
  from_user  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_profile uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_profile),
  check (from_user <> to_profile)
);

create index cheers_to_profile_idx on public.cheers (to_profile);

alter table public.cheers enable row level security;

-- Only signed-in (incl. anonymous) users; no update/delete: a cheer is forever.
revoke all on table public.cheers from anon, authenticated;
grant select, insert on table public.cheers to authenticated;

create policy "Users can see their own cheers"
on public.cheers for select
to authenticated
using ((select auth.uid()) = from_user);

create policy "Users can cheer as themselves"
on public.cheers for insert
to authenticated
with check ((select auth.uid()) = from_user);

-- Top cards by cheers. security definer so it can count everyone's cheers,
-- but it only returns totals + public display names, never who cheered whom.
-- ponytail: aggregates on every call; fine for this scale, keep a counter column if cheers reach millions.
create function public.leaderboard(n int default 10)
returns table (id uuid, display_name text, cheers bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, count(*) as cheers
  from public.cheers c
  join public.profiles p on p.id = c.to_profile
  group by p.id, p.display_name
  order by cheers desc, max(c.created_at) asc
  limit least(greatest(n, 0), 10);
$$;

revoke execute on function public.leaderboard(int) from public;
grant execute on function public.leaderboard(int) to anon, authenticated;
