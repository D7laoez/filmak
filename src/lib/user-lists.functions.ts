// Client-only localStorage store. No auth required — data persists per device.
export type ListStatus = "favorite" | "watchlist" | "watched";
export type MediaType = "movie" | "tv";

export type ListItem = {
  id: string;
  media_type: MediaType;
  media_id: number;
  status: ListStatus;
  rating: number | null;
  note: string | null;
  title: string;
  poster: string | null;
  year: string | null;
  tmdb_rating: number | null;
  created_at: string;
};

const STORAGE_KEY = "filmak.user-lists.v1";

function readAll(): ListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ListItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: ListItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

function keyOf(mt: MediaType, mid: number, st: ListStatus) {
  return `${mt}:${mid}:${st}`;
}

export async function listMyItems(
  args?: { data?: { status?: ListStatus } } | undefined,
): Promise<ListItem[]> {
  const status = args?.data?.status;
  const all = readAll().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return status ? all.filter((i) => i.status === status) : all;
}

export async function upsertItem(args: {
  data: {
    media_type: MediaType;
    media_id: number;
    status: ListStatus;
    title: string;
    poster: string | null;
    year: string | null;
    tmdb_rating: number | null;
    rating?: number | null;
    note?: string | null;
  };
}) {
  const d = args.data;
  const all = readAll();
  const idx = all.findIndex(
    (i) => i.media_type === d.media_type && i.media_id === d.media_id && i.status === d.status,
  );
  const now = new Date().toISOString();
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      title: d.title,
      poster: d.poster,
      year: d.year,
      tmdb_rating: d.tmdb_rating,
      rating: d.rating ?? all[idx].rating,
      note: d.note ?? all[idx].note,
    };
  } else {
    all.push({
      id: keyOf(d.media_type, d.media_id, d.status),
      media_type: d.media_type,
      media_id: d.media_id,
      status: d.status,
      rating: d.rating ?? null,
      note: d.note ?? null,
      title: d.title,
      poster: d.poster,
      year: d.year,
      tmdb_rating: d.tmdb_rating,
      created_at: now,
    });
  }
  writeAll(all);
  return { ok: true };
}

export async function removeItem(args: {
  data: { media_type: MediaType; media_id: number; status: ListStatus };
}) {
  const d = args.data;
  const all = readAll().filter(
    (i) => !(i.media_type === d.media_type && i.media_id === d.media_id && i.status === d.status),
  );
  writeAll(all);
  return { ok: true };
}

export async function setRating(args: {
  data: {
    media_type: MediaType;
    media_id: number;
    status: ListStatus;
    rating: number | null;
  };
}) {
  const d = args.data;
  const all = readAll();
  const idx = all.findIndex(
    (i) => i.media_type === d.media_type && i.media_id === d.media_id && i.status === d.status,
  );
  if (idx >= 0) {
    all[idx] = { ...all[idx], rating: d.rating };
    writeAll(all);
  }
  return { ok: true };
}

export async function getMyStats() {
  const items = readAll();
  const byStatus = { favorite: 0, watchlist: 0, watched: 0 } as Record<ListStatus, number>;
  const byType = { movie: 0, tv: 0 } as Record<MediaType, number>;
  let ratedSum = 0;
  let ratedCount = 0;
  const yearCounts: Record<string, number> = {};
  for (const r of items) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byType[r.media_type] = (byType[r.media_type] || 0) + 1;
    if (r.rating != null) {
      ratedSum += Number(r.rating);
      ratedCount++;
    }
    if (r.year) yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
  }
  const topYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    total: items.length,
    byStatus,
    byType,
    averageRating: ratedCount > 0 ? Math.round((ratedSum / ratedCount) * 10) / 10 : null,
    ratedCount,
    topYear,
  };
}