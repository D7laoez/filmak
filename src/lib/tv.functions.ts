import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  TmdbCastMember,
  TmdbTvDetails,
  TmdbTvResult,
  TmdbVideoItem,
  TmdbWatchRegion,
} from "./tmdb.types";

export type TvCard = {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  overview: string;
};

function toCard(m: TmdbTvResult): TvCard {
  return {
    id: m.id,
    title: m.name || m.original_name || "",
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
    year: (m.first_air_date || "").slice(0, 4),
    rating: Math.round((m.vote_average || 0) * 10) / 10,
    overview: m.overview || "",
  };
}

const langSchema = z.enum(["ar", "en"]).default("ar");
const langOnly = (d: unknown) => z.object({ lang: langSchema }).parse(d ?? {});

export const getTrendingTv = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>("/trending/tv/week", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getPopularTv = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>("/tv/popular", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getTopRatedTv = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>("/tv/top_rated", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getOnAirTv = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>("/tv/on_the_air", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getAiringTodayTv = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>("/tv/airing_today", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const searchTv = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ q: z.string().min(1).max(200), lang: langSchema }).parse(d))
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbTvResult[] }>(
      "/search/tv",
      { query: data.q },
      data.lang,
    );
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 24)
      .map(toCard);
  });

export const getTvGenres = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ genres: { id: number; name: string }[] }>(
      "/genre/tv/list",
      {},
      data.lang,
    );
    return r.genres || [];
  });

export const getTvByGenre = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z
      .object({
        genreIds: z.array(z.number()).min(1),
        lang: langSchema,
        sort: z
          .enum(["popularity.desc", "vote_average.desc", "first_air_date.desc"])
          .default("popularity.desc"),
        page: z.number().int().min(1).max(20).default(1),
        minRating: z.number().min(0).max(10).default(0),
        year: z.number().int().min(1900).max(2100).nullable().default(null),
        lang_original: z.string().nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const params: Record<string, string> = {
      with_genres: data.genreIds.join(","),
      sort_by: data.sort,
      "vote_count.gte": data.sort === "vote_average.desc" ? "100" : "20",
      include_adult: "false",
      page: String(data.page),
    };
    if (data.minRating > 0) params["vote_average.gte"] = String(data.minRating);
    if (data.year) params["first_air_date_year"] = String(data.year);
    if (data.lang_original) params["with_original_language"] = data.lang_original;
    const r = await tmdbGet<{ results: TmdbTvResult[]; total_pages: number }>(
      "/discover/tv",
      params,
      data.lang,
    );
    return {
      results: (r.results || []).filter((m) => m.poster_path).map(toCard),
      totalPages: Math.min(r.total_pages || 1, 20),
    };
  });

export const getTvDetails = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({ id: z.number().int().positive(), lang: langSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const [details, videos, providers, credits, similar] = await Promise.all([
      tmdbGet<TmdbTvDetails>(`/tv/${data.id}`, {}, data.lang),
      tmdbGet<{ results?: TmdbVideoItem[] }>(
        `/tv/${data.id}/videos`,
        { language: "en-US" },
        data.lang,
      ),
      tmdbGet<{ results?: Record<string, TmdbWatchRegion> }>(
        `/tv/${data.id}/watch/providers`,
        {},
        data.lang,
      ),
      tmdbGet<{ cast?: TmdbCastMember[] }>(`/tv/${data.id}/credits`, {}, data.lang),
      tmdbGet<{ results?: TmdbTvResult[] }>(`/tv/${data.id}/similar`, {}, data.lang),
    ]);
    const trailer = (videos.results || []).find(
      (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
    );
    const providersByCountry = providers.results || {};
    const preferred = ["SA", "AE", "EG", "US"];
    let watchCountry: string | null = null;
    let watch: TmdbWatchRegion | null = null;
    for (const c of preferred) {
      if (providersByCountry[c]) {
        watchCountry = c;
        watch = providersByCountry[c];
        break;
      }
    }
    if (!watch) {
      const first = Object.keys(providersByCountry)[0];
      if (first) {
        watchCountry = first;
        watch = providersByCountry[first];
      }
    }
    return {
      id: details.id,
      title: details.name || details.original_name || "",
      tagline: details.tagline,
      overview: details.overview,
      poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdrop: details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null,
      backdropLarge: details.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null,
      year: (details.first_air_date || "").slice(0, 4),
      seasons: details.number_of_seasons,
      episodes: details.number_of_episodes,
      rating: Math.round((details.vote_average || 0) * 10) / 10,
      genres: (details.genres || []).map((g) => g.name),
      trailerKey: trailer?.key ?? null,
      cast: (credits.cast || []).slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? "",
        profile: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
      })),
      watchCountry,
      watch: watch
        ? {
            link: watch.link ?? "",
            flatrate: (watch.flatrate || []).map((p) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
            rent: (watch.rent || []).map((p) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
            buy: (watch.buy || []).map((p) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
          }
        : null,
      similar: (similar.results || []).slice(0, 12).map((m) => ({
        id: m.id,
        title: m.name || m.original_name || "",
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        year: (m.first_air_date || "").slice(0, 4),
        rating: Math.round((m.vote_average || 0) * 10) / 10,
      })),
    };
  });
