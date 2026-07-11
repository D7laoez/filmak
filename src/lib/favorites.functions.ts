import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Favorite = {
  movie_id: number;
  title: string;
  poster: string | null;
  year: string | null;
  rating: number | null;
  created_at: string;
};

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Favorite[]> => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("movie_id, title, poster, year, rating, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Favorite[];
  });

export const addFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        movie_id: z.number(),
        title: z.string().max(300),
        poster: z.string().nullable(),
        year: z.string().max(10).nullable(),
        rating: z.number().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("favorites").insert({
      user_id: context.userId,
      movie_id: data.movie_id,
      title: data.title,
      poster: data.poster,
      year: data.year,
      rating: data.rating,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ movie_id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("favorites")
      .delete()
      .eq("movie_id", data.movie_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });