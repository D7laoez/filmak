import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { MovieCard } from "./movies.functions";

const langSchema = z.enum(["ar", "en"]).default("ar");
const moodSchema = z.enum(["all", "action", "comedy", "horror", "romance", "sciFi"]).default("all");

const genreByMood: Record<Exclude<z.infer<typeof moodSchema>, "all">, number> = {
  action: 28,
  comedy: 35,
  horror: 27,
  romance: 10749,
  sciFi: 878,
};

function toCard(m: any): MovieCard {
  return {
    id: m.id,
    title: m.title || m.original_title,
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
    year: (m.release_date || "").slice(0, 4),
    rating: Math.round((m.vote_average || 0) * 10) / 10,
    overview: m.overview || "",
  };
}

const baseInput = z.object({
  lang: langSchema,
  mood: moodSchema,
  minRating: z.number().min(0).max(10).default(7),
  minRuntime: z.number().int().min(0).max(400).nullable().default(null),
  maxRuntime: z.number().int().min(0).max(400).nullable().default(null),
  page: z.number().int().min(1).max(20).default(1),
});

export const getMovieNightPicks = createServerFn({ method: "GET" })
  .inputValidator((d) => baseInput.parse(d))
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const params: Record<string, string> = {
      sort_by: "popularity.desc",
      vote_count: "",
      "vote_count.gte": "100",
      include_adult: "false",
      page: String(data.page),
    };

    if (data.mood !== "all") params.with_genres = String(genreByMood[data.mood]);
    if (data.minRating > 0) params["vote_average.gte"] = String(data.minRating);
    if (data.minRuntime !== null) params["with_runtime.gte"] = String(data.minRuntime);
    if (data.maxRuntime !== null) params["with_runtime.lte"] = String(data.maxRuntime);

    const r = await tmdbGet<{ results: any[]; total_pages: number }>("/discover/movie", params, data.lang);
    return {
      results: r.results.filter((m) => m.poster_path).map(toCard).slice(0, 12),
      totalPages: Math.min(r.total_pages, 20),
    };
  });

export const getRandomMoviePick = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      lang: langSchema,
      ratingMode: z.enum(["any", "high"]).default("any"),
      nonce: z.number().int().min(0).default(0),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const params: Record<string, string> = {
      sort_by: "popularity.desc",
      "vote_count.gte": "100",
      include_adult: "false",
      page: String((data.nonce % 20) + 1),
    };
    if (data.ratingMode === "high") params["vote_average.gte"] = "7.5";

    const r = await tmdbGet<{ results: any[] }>("/discover/movie", params, data.lang);
    const pool = r.results.filter((m) => m.poster_path).map(toCard);
    if (!pool.length) return null;
    const index = (data.nonce * 7 + Math.floor(Math.random() * pool.length)) % pool.length;
    return pool[index];
  });
