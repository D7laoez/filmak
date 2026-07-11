import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MovieCard = {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  overview: string;
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

const langSchema = z.enum(["ar", "en"]).default("ar");
const langOnly = (d: unknown) =>
  z.object({ lang: langSchema }).parse(d ?? {});

export const getTrending = createServerFn({ method: "GET" })
  .inputValidator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: any[] }>("/trending/movie/week", {}, data.lang);
    return r.results.filter((m) => m.poster_path).slice(0, 18).map(toCard);
  });

export const getTopRated = createServerFn({ method: "GET" })
  .inputValidator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: any[] }>("/movie/top_rated", {}, data.lang);
    return r.results.filter((m) => m.poster_path).slice(0, 18).map(toCard);
  });

export const getPopular = createServerFn({ method: "GET" })
  .inputValidator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: any[] }>("/movie/popular", {}, data.lang);
    return r.results.filter((m) => m.poster_path).slice(0, 18).map(toCard);
  });

export const getNowPlaying = createServerFn({ method: "GET" })
  .inputValidator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: any[] }>(
      "/movie/now_playing",
      { region: data.lang === "en" ? "US" : "SA" },
      data.lang,
    );
    return r.results.filter((m) => m.poster_path).slice(0, 18).map(toCard);
  });

export const getUpcoming = createServerFn({ method: "GET" })
  .inputValidator(langOnly)
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const r = await tmdbGet<{ results: any[] }>(
      "/movie/upcoming",
      { region: data.lang === "en" ? "US" : "SA" },
      data.lang,
    );
    return r.results.filter((m) => m.poster_path).slice(0, 18).map(toCard);
  });

export const searchMovies = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ q: z.string().min(1), lang: langSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const res = await tmdbGet<{ results: any[] }>(
      "/search/movie",
      { query: data.q },
      data.lang,
    );
    return res.results.filter((m) => m.poster_path).slice(0, 24).map(toCard);
  });

export const getMovieDetails = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ id: z.number(), lang: langSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const [details, videos, providers, credits, similar] = await Promise.all([
      tmdbGet<any>(`/movie/${data.id}`, {}, data.lang),
      tmdbGet<any>(`/movie/${data.id}/videos`, { language: "en-US" }, data.lang),
      tmdbGet<any>(`/movie/${data.id}/watch/providers`, {}, data.lang),
      tmdbGet<any>(`/movie/${data.id}/credits`, {}, data.lang),
      tmdbGet<any>(`/movie/${data.id}/similar`, {}, data.lang),
    ]);

    const trailer = (videos.results || []).find(
      (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
    );

    const providersByCountry = providers.results || {};
    const preferred = ["SA", "AE", "EG", "US"];
    let watchCountry: string | null = null;
    let watch: any = null;
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
      title: details.title || details.original_title,
      tagline: details.tagline,
      overview: details.overview,
      poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      backdrop: details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null,
      year: (details.release_date || "").slice(0, 4),
      runtime: details.runtime,
      rating: Math.round((details.vote_average || 0) * 10) / 10,
      genres: (details.genres || []).map((g: any) => g.name),
      trailerKey: trailer?.key ?? null,
      cast: (credits.cast || []).slice(0, 8).map((c: any) => ({
        name: c.name,
        character: c.character,
        profile: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null,
      })),
      watchCountry,
      watch: watch
        ? {
            link: watch.link,
            flatrate: (watch.flatrate || []).map((p: any) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
            rent: (watch.rent || []).map((p: any) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
            buy: (watch.buy || []).map((p: any) => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
            })),
          }
        : null,
      similar: (similar.results || []).slice(0, 12).map((m: any) => ({
        id: m.id,
        title: m.title || m.original_title,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        year: (m.release_date || "").slice(0, 4),
        rating: Math.round((m.vote_average || 0) * 10) / 10,
      })),
    };
  });