import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  TmdbCastMember,
  TmdbCrewMember,
  TmdbImageItem,
  TmdbMovieDetails,
  TmdbMovieResult,
  TmdbVideoItem,
  TmdbWatchRegion,
} from "./tmdb.types";

export type MovieCard = {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  overview: string;
};

function toCard(m: TmdbMovieResult): MovieCard {
  return {
    id: m.id,
    title: m.title || m.original_title || "",
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
    year: (m.release_date || "").slice(0, 4),
    rating: Math.round((m.vote_average || 0) * 10) / 10,
    overview: m.overview || "",
  };
}

const langSchema = z.enum(["ar", "en"]).default("ar");
const langOnly = (d: unknown) => z.object({ lang: langSchema }).parse(d ?? {});

export const getTrending = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbMovieResult[] }>("/trending/movie/week", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getTopRated = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbMovieResult[] }>("/movie/top_rated", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getPopular = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbMovieResult[] }>("/movie/popular", {}, data.lang);
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getNowPlaying = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbMovieResult[] }>(
      "/movie/now_playing",
      { region: data.lang === "en" ? "US" : "IQ" },
      data.lang,
    );
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const getUpcoming = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: TmdbMovieResult[] }>(
      "/movie/upcoming",
      { region: data.lang === "en" ? "US" : "IQ" },
      data.lang,
    );
    return (r.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 18)
      .map(toCard);
  });

export const searchMovies = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ q: z.string().min(1).max(200), lang: langSchema }).parse(d))
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const res = await tmdbGet<{ results: TmdbMovieResult[] }>(
      "/search/movie",
      { query: data.q },
      data.lang,
    );
    return (res.results || [])
      .filter((m) => m.poster_path)
      .slice(0, 24)
      .map(toCard);
  });

export const getGenres = createServerFn({ method: "GET" })
  .validator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ genres: { id: number; name: string }[] }>(
      "/genre/movie/list",
      {},
      data.lang,
    );
    return r.genres || [];
  });

export const getMoviesByGenre = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z
      .object({
        genreIds: z.array(z.number()).min(1),
        lang: langSchema,
        sort: z
          .enum(["popularity.desc", "vote_average.desc", "primary_release_date.desc"])
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
      "vote_count.gte": data.sort === "vote_average.desc" ? "200" : "50",
      include_adult: "false",
      page: String(data.page),
    };
    if (data.minRating > 0) params["vote_average.gte"] = String(data.minRating);
    if (data.year) params["primary_release_year"] = String(data.year);
    if (data.lang_original) params["with_original_language"] = data.lang_original;
    const r = await tmdbGet<{ results: TmdbMovieResult[]; total_pages: number }>(
      "/discover/movie",
      params,
      data.lang,
    );
    return {
      results: (r.results || []).filter((m) => m.poster_path).map(toCard),
      totalPages: Math.min(r.total_pages || 1, 20),
    };
  });

export const discoverMovies = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z
      .object({
        lang: langSchema,
        genreIds: z.array(z.number()).default([]),
        sort: z
          .enum([
            "popularity.desc",
            "vote_average.desc",
            "primary_release_date.desc",
            "primary_release_date.asc",
            "revenue.desc",
          ])
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
      sort_by: data.sort,
      "vote_count.gte": data.sort === "vote_average.desc" ? "300" : "50",
      include_adult: "false",
      page: String(data.page),
    };
    if (data.genreIds.length) params.with_genres = data.genreIds.join(",");
    if (data.minRating > 0) params["vote_average.gte"] = String(data.minRating);
    if (data.year) params["primary_release_year"] = String(data.year);
    if (data.lang_original) params["with_original_language"] = data.lang_original;
    const r = await tmdbGet<{ results: TmdbMovieResult[]; total_pages: number }>(
      "/discover/movie",
      params,
      data.lang,
    );
    return {
      results: (r.results || []).filter((m) => m.poster_path).map(toCard),
      totalPages: Math.min(r.total_pages || 1, 20),
    };
  });

export const getMovieDetails = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({ id: z.number().int().positive(), lang: langSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const [details, videos, providers, credits, similar, images] = await Promise.all([
      tmdbGet<TmdbMovieDetails>(`/movie/${data.id}`, {}, data.lang),
      tmdbGet<{ results?: TmdbVideoItem[] }>(
        `/movie/${data.id}/videos`,
        { language: "en-US" },
        data.lang,
      ),
      tmdbGet<{ results?: Record<string, TmdbWatchRegion> }>(
        `/movie/${data.id}/watch/providers`,
        {},
        data.lang,
      ),
      tmdbGet<{ cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] }>(
        `/movie/${data.id}/credits`,
        {},
        data.lang,
      ),
      tmdbGet<{ results?: TmdbMovieResult[] }>(`/movie/${data.id}/similar`, {}, data.lang),
      tmdbGet<{ backdrops?: TmdbImageItem[]; posters?: TmdbImageItem[] }>(
        `/movie/${data.id}/images`,
        { include_image_language: "en,null" },
        data.lang,
      ).catch(() => ({ backdrops: [] as TmdbImageItem[], posters: [] as TmdbImageItem[] })),
    ]);

    const trailer = (videos.results || []).find(
      (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
    );
    const allVideos = (videos.results || [])
      .filter((v) => v.site === "YouTube" && Boolean(v.key))
      .sort((a, b) => {
        const order: Record<string, number> = {
          Trailer: 0,
          Teaser: 1,
          Clip: 2,
          "Behind the Scenes": 3,
          Featurette: 4,
        };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      })
      .slice(0, 12)
      .map((v) => ({ key: v.key, name: v.name, type: v.type }));

    const providersByCountry = providers.results || {};
    const preferred = ["IQ", "SA", "AE", "EG", "US"];
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

    const crewList = (credits.crew || []) as Array<{
      job: string;
      name: string;
      profile_path: string | null;
    }>;
    const findCrew = (jobs: string[]) =>
      crewList
        .filter((c) => jobs.includes(c.job))
        .slice(0, 3)
        .map((c) => c.name);

    return {
      id: details.id,
      title: details.title || details.original_title || "",
      originalTitle: details.original_title ?? null,
      tagline: details.tagline ?? null,
      overview: details.overview ?? "",
      poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdrop: details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null,
      year: (details.release_date || "").slice(0, 4),
      releaseDate: details.release_date ?? null,
      runtime: details.runtime ?? null,
      rating: Math.round((details.vote_average || 0) * 10) / 10,
      voteCount: details.vote_count ?? 0,
      popularity: Math.round((details.popularity ?? 0) * 10) / 10,
      status: details.status ?? null,
      budget: details.budget ?? 0,
      revenue: details.revenue ?? 0,
      imdbId: details.imdb_id ?? null,
      originalLanguage: details.original_language ?? null,
      spokenLanguages: (details.spoken_languages || []).map((l) => l.english_name || l.name || ""),
      productionCountries: (details.production_countries || []).map((c) => c.name),
      productionCompanies: (details.production_companies || []).map((c) => ({
        name: c.name,
        logo: c.logo_path ? `https://image.tmdb.org/t/p/w200${c.logo_path}` : null,
      })),
      genres: (details.genres || []).map((g) => g.name),
      trailerKey: trailer?.key ?? null,
      videos: allVideos,
      images: {
        backdrops: (images.backdrops || []).slice(0, 12).map((b) => ({
          url: `https://image.tmdb.org/t/p/original${b.file_path}`,
          thumb: `https://image.tmdb.org/t/p/w780${b.file_path}`,
        })),
        posters: (images.posters || []).slice(0, 12).map((p) => ({
          url: `https://image.tmdb.org/t/p/original${p.file_path}`,
          thumb: `https://image.tmdb.org/t/p/w342${p.file_path}`,
        })),
      },
      cast: (credits.cast || []).slice(0, 16).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? "",
        profile: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
      })),
      crew: {
        director: findCrew(["Director"]),
        writers: findCrew(["Screenplay", "Writer", "Story"]),
        composer: findCrew(["Original Music Composer", "Music"]),
        cinematographer: findCrew(["Director of Photography"]),
        editor: findCrew(["Editor"]),
      },
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
        title: m.title || m.original_title || "",
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        year: (m.release_date || "").slice(0, 4),
        rating: Math.round((m.vote_average || 0) * 10) / 10,
      })),
    };
  });
