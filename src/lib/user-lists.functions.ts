import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

const statusSchema = z.enum(["favorite", "watchlist", "watched"]);
const mediaTypeSchema = z.enum(["movie", "tv"]);

export const listMyItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: statusSchema.optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ListItem[]> => {
    let q = context.supabase
      .from("user_lists")
      .select("id, media_type, media_id, status, rating, note, title, poster, year, tmdb_rating, created_at")
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ListItem[];
  });

export const upsertItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        media_type: mediaTypeSchema,
        media_id: z.number(),
        status: statusSchema,
        title: z.string().max(300),
        poster: z.string().nullable(),
        year: z.string().max(10).nullable(),
        tmdb_rating: z.number().nullable(),
        rating: z.number().min(0).max(10).nullable().optional(),
        note: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_lists").upsert(
      {
        user_id: context.userId,
        media_type: data.media_type,
        media_id: data.media_id,
        status: data.status,
        title: data.title,
        poster: data.poster,
        year: data.year,
        tmdb_rating: data.tmdb_rating,
        rating: data.rating ?? null,
        note: data.note ?? null,
      },
      { onConflict: "user_id,media_type,media_id,status" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        media_type: mediaTypeSchema,
        media_id: z.number(),
        status: statusSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_lists")
      .delete()
      .eq("media_type", data.media_type)
      .eq("media_id", data.media_id)
      .eq("status", data.status);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        media_type: mediaTypeSchema,
        media_id: z.number(),
        status: statusSchema,
        rating: z.number().min(0).max(10).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_lists")
      .update({ rating: data.rating })
      .eq("media_type", data.media_type)
      .eq("media_id", data.media_id)
      .eq("status", data.status);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("user_lists")
      .select("media_type, status, rating, year");
    if (error) throw new Error(error.message);
    const items = rows ?? [];
    const byStatus = { favorite: 0, watchlist: 0, watched: 0 } as Record<ListStatus, number>;
    const byType = { movie: 0, tv: 0 } as Record<MediaType, number>;
    let ratedSum = 0;
    let ratedCount = 0;
    const yearCounts: Record<string, number> = {};
    for (const r of items) {
      byStatus[r.status as ListStatus] = (byStatus[r.status as ListStatus] || 0) + 1;
      byType[r.media_type as MediaType] = (byType[r.media_type as MediaType] || 0) + 1;
      if (r.rating != null) {
        ratedSum += Number(r.rating);
        ratedCount++;
      }
      if (r.year) yearCounts[r.year as string] = (yearCounts[r.year as string] || 0) + 1;
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
  });
