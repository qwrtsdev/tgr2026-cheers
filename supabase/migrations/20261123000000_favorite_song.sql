-- Favorite song on the card, picked from the iTunes Search API (display only: cover, title, artist, a link).
-- The cover is rendered as an <img> and the link as an <a>, so both are pinned to Apple's hosts.
alter table public.profiles
  add column song_title text
    check (char_length(btrim(song_title)) between 1 and 200),
  add column song_artist text
    check (char_length(song_artist) <= 200),
  add column song_artwork_url text
    check (char_length(song_artwork_url) <= 300 and song_artwork_url ~ '^https://is[0-9]+-ssl\.mzstatic\.com/'),
  add column song_url text
    check (char_length(song_url) <= 300 and song_url ~ '^https://music\.apple\.com/'),
  -- No half-filled songs: the other fields only exist alongside a title.
  add constraint profiles_song_needs_title
    check (song_title is not null or (song_artist is null and song_artwork_url is null and song_url is null));

-- User-editable: extend the column-level grants from 20261121070000_is_dev.sql (grants add up).
grant insert (song_title, song_artist, song_artwork_url, song_url) on table public.profiles to authenticated;
grant update (song_title, song_artist, song_artwork_url, song_url) on table public.profiles to authenticated;
