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

export const getTrending = createServerFn({ method: "GET" }).handler(async () => {
  const { tmdbGet } = await import("./tmdb.server");
  const data = await tmdbGet<{ results: any[] }>("/trending/movie/week");
  return data.results.slice(0, 18).map(toCard);
});

export const getTopRated = createServerFn({ method: "GET" }).handler(async () => {
  const { tmdbGet } = await import("./tmdb.server");
  const data = await tmdbGet<{ results: any[] }>("/movie/top_rated");
  return data.results.slice(0, 18).map(toCard);
});

export const getPopular = createServerFn({ method: "GET" }).handler(async () => {
  const { tmdbGet } = await import("./tmdb.server");
  const data = await tmdbGet<{ results: any[] }>("/movie/popular");
  return data.results.slice(0, 18).map(toCard);
});

export const searchMovies = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const res = await tmdbGet<{ results: any[] }>("/search/movie", { query: data.q });
    return res.results.slice(0, 24).map(toCard);
  });

export const getMovieDetails = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const { tmdbGet } = await import("./tmdb.server");
    const [details, videos, providers, credits, similar] = await Promise.all([
      tmdbGet<any>(`/movie/${data.id}`),
      tmdbGet<any>(`/movie/${data.id}/videos`, { language: "en-US" }),
      tmdbGet<any>(`/movie/${data.id}/watch/providers`),
      tmdbGet<any>(`/movie/${data.id}/credits`),
      tmdbGet<any>(`/movie/${data.id}/similar`),
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