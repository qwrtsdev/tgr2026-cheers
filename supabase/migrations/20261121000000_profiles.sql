-- Profiles: one card per (anonymous) auth user.

create table public.profiles (
  id           uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  contacts     text not null default '' check (char_length(contacts) <= 300),
  description  text not null default '' check (char_length(description) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at honest regardless of what the client sends.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;

-- Least privilege: visitors read only; signed-in (incl. anonymous) users manage their own row.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon;
grant select, insert, update, delete on table public.profiles to authenticated;

create policy "Profiles are viewable by everyone"
on public.profiles for select
to anon, authenticated
using (true);

create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

-- Random card. security invoker = RLS still applies.
-- ponytail: order by random() scans the whole table; fine to ~100k rows, switch to tablesample/offset if it grows.
create function public.random_profile(exclude uuid default null)
returns setof public.profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.profiles
  where id is distinct from exclude
  order by random()
  limit 1;
$$;

revoke execute on function public.random_profile(uuid) from public;
grant execute on function public.random_profile(uuid) to anon, authenticated;
