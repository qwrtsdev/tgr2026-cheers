// Favorite song: searched with Apple's free iTunes Search API straight from the browser (no key, CORS allowed,
// ~20 searches/min per visitor). Display only: cover, title, artist, a link to Apple Music. Nothing plays.
// A stored song without a cover / link (the DB allows it) still renders, with a note icon instead of the cover.
// Checks mirror the DB constraints in supabase/migrations/20261123000000_favorite_song.sql.

export type Song = {
  song_title: string;
  song_artist: string;
  song_artwork_url: string | null;
  song_url: string | null;
};
export const SONG_COLUMNS = 'song_title, song_artist, song_artwork_url, song_url';

const ARTWORK = /^https:\/\/is[0-9]+-ssl\.mzstatic\.com\//;
const LINK = /^https:\/\/music\.apple\.com\//;
// Japanese script -> the Japan store (titles come back in Japanese); everything else -> the Thai store,
// which carries Thai, English and most Japanese releases.
const JAPANESE = /[぀-ヿㇰ-ㇿ一-鿿]/;

/** A stored song, or null when the card has none (or it fails the same checks as the DB). */
export function toSong(s: Partial<Record<keyof Song, unknown>> | null | undefined): Song | null {
  const { song_title: t, song_artist: a, song_artwork_url: art, song_url: url } = s ?? {};
  if (typeof t !== 'string' || !t.trim() || t.length > 200) return null;
  const ok = (v: unknown, re: RegExp) => typeof v === 'string' && v.length <= 300 && re.test(v);
  return {
    song_title: t.trim(),
    song_artist: typeof a === 'string' ? a.trim().slice(0, 200) : '',
    song_artwork_url: ok(art, ARTWORK) ? (art as string) : null,
    song_url: ok(url, LINK) ? (url as string) : null,
  };
}

type ApiTrack = { trackName?: unknown; artistName?: unknown; artworkUrl100?: unknown; trackViewUrl?: unknown };

export async function searchSongs(term: string, signal: AbortSignal): Promise<Song[]> {
  const params = new URLSearchParams({ term, country: JAPANESE.test(term) ? 'jp' : 'th', media: 'music', entity: 'song', limit: '10' });
  const res = await fetch(`https://itunes.apple.com/search?${params}`, { signal });
  // Apple answers 403 (sometimes 429) when a visitor searches too often; anything else is "down".
  if (!res.ok) throw new Error(res.status === 403 || res.status === 429 ? 'rate-limit' : `HTTP ${res.status}`);
  const { results } = (await res.json()) as { results?: ApiTrack[] };
  const seen = new Set<string>();
  return (results ?? []).flatMap((r) => {
    let url = typeof r.trackViewUrl === 'string' ? r.trackViewUrl : '';
    try {
      const u = new URL(url);
      u.searchParams.delete('uo'); // Apple's tracking tag, not needed
      url = u.href;
    } catch {}
    const s = toSong({ song_title: r.trackName, song_artist: r.artistName, song_artwork_url: r.artworkUrl100, song_url: url });
    const key = s && `${s.song_title}\n${s.song_artist}`.toLowerCase();
    if (!s?.song_artwork_url || !s.song_url || seen.has(key!)) return []; // same song on several albums: show it once
    seen.add(key!);
    return [s];
  });
}

export const NOTE =
  '<svg viewBox="0 0 24 24" aria-hidden="true" class="size-5 fill-current"><path d="M9 18V5l12-2v13a3 3 0 1 1-2-2.83V7.3l-8 1.33V18a3 3 0 1 1-2-2.83Z"/></svg>';

/**
 * Long title that doesn't fit: it rolls left until the end shows, holds, blinks, and starts over (CSS .song-roll).
 * Call once the element is on screen (it measures). Short titles and reduced-motion users keep the plain "…".
 */
export function rollTitle(root: Element) {
  const title = root.querySelector<HTMLElement>('[data-song-title]');
  if (!title || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dist = title.scrollWidth - title.clientWidth;
  if (dist <= 1) return;
  const inner = document.createElement('span');
  inner.className = 'song-roll inline-block';
  inner.textContent = title.textContent;
  inner.style.setProperty('--roll', `${-dist}px`);
  inner.style.setProperty('--roll-dur', `${Math.max(4, dist / 40 / 0.6).toFixed(1)}s`); // ~40 px/s while moving
  title.classList.replace('truncate', 'overflow-hidden');
  title.classList.add('whitespace-nowrap');
  title.replaceChildren(inner);
}

/** Cover + title + artist. textContent / attributes only: the text comes from a third party. */
export function songInfo(s: Song) {
  const wrap = document.createElement('span');
  wrap.className = 'flex min-w-0 flex-1 items-center gap-3';
  const img = document.createElement(s.song_artwork_url ? 'img' : 'span');
  img.className = 'grid size-12 shrink-0 place-items-center rounded bg-cream object-cover text-coral';
  if (img instanceof HTMLImageElement) {
    img.src = s.song_artwork_url!; // 100x100: sharp at the 48px it's shown
    img.alt = '';
    img.width = img.height = 48;
    img.loading = 'lazy';
  } else img.innerHTML = NOTE; // no cover: a note icon instead (static markup)
  // Apple's image server down / cover gone: the same note icon instead of a broken image.
  img.addEventListener('error', () => {
    const note = document.createElement('span');
    note.className = 'grid size-12 shrink-0 place-items-center rounded bg-cream text-coral';
    note.innerHTML = NOTE;
    img.replaceWith(note);
  }, { once: true });
  const text = document.createElement('span');
  text.className = 'grid min-w-0 text-left';
  const title = document.createElement('span');
  title.className = 'truncate font-semibold';
  title.dataset.songTitle = '';
  title.textContent = s.song_title;
  const artist = document.createElement('span');
  artist.className = 'truncate text-sm text-ink/60';
  artist.textContent = s.song_artist;
  text.append(title, artist);
  wrap.append(img, text);
  return wrap;
}
