// Competition podium per track, from the TESA score API.
// The API sends no CORS headers, so it's proxied through our own origin:
// vercel.json rewrite in production, vite.server.proxy in astro.config.mjs for `astro dev`.
// Any failure (network, bad JSON, unavailable) just means no cups.

export const TRACKS = ['AI', 'Market', 'Embedded'] as const;
// Display names for the API's track ids.
export const TRACK_LABEL = { AI: 'Edge AI', Embedded: 'Embedded', Market: 'Next-Gen Market' } as const;

export type Placement = { track: (typeof TRACKS)[number]; rank: 1 | 2 | 3 };

type ApiTeam = { id?: unknown };

async function fetchTrack(track: Placement['track']) {
  try {
    const res = await fetch(`/api/tesa/leaderboard?track=${track}&day=Integration`);
    if (!res.ok) return [];
    const { available, teams } = (await res.json()) as { available?: boolean; teams?: ApiTeam[] };
    if (available === false || !Array.isArray(teams)) return [];
    // List order is the podium: index 0 = 1st, 1 = 2nd, 2 = 3rd. Ids look like "TGR-04" (or just "04").
    return teams.slice(0, 3).flatMap((t, i) => {
      const team = Number(/^(?:TGR-)?(\d+)$/.exec(String(t.id))?.[1]);
      return team ? [{ team, track, rank: (i + 1) as 1 | 2 | 3 }] : [];
    });
  } catch {
    return [];
  }
}

let cache: Promise<Map<number, Placement[]>> | null = null;

// team number -> its podium places (a team can place in several tracks). Fetched once per page view.
export function loadPlacements() {
  cache ??= Promise.all(TRACKS.map(fetchTrack)).then((lists) => {
    const byTeam = new Map<number, Placement[]>();
    for (const { team, track, rank } of lists.flat()) {
      byTeam.set(team, [...(byTeam.get(team) ?? []), { track, rank }].sort((a, b) => a.rank - b.rank));
    }
    return byTeam;
  });
  return cache;
}
