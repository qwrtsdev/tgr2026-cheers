-- Split free-text contacts into one column per channel.
-- URLs must be https on the right domain: they are rendered as links, so this also blocks javascript: URLs.

alter table public.profiles
  drop column contacts,
  add column facebook_url text
    check (char_length(facebook_url) <= 200 and facebook_url ~ '^https://(www\.|m\.)?(facebook|fb)\.com/.+'),
  add column instagram_url text
    check (char_length(instagram_url) <= 200 and instagram_url ~ '^https://(www\.)?instagram\.com/.+'),
  add column discord_username text
    check (discord_username ~ '^[a-z0-9_.]{2,32}$'),
  add column github_url text
    check (char_length(github_url) <= 200 and github_url ~ '^https://(www\.)?github\.com/.+');
