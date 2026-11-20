-- Optional Top Gun team number (1-56); null = not specified.
alter table public.profiles
  add column tgr_team_number smallint check (tgr_team_number between 1 and 56);
