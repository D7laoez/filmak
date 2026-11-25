import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PersonCredit = {
  id: number;
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  character: string;
  mediaType: "movie" | "tv";
  popularity: number;
};

export type PersonDetails = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  knownFor: string;
  profile: string | null;
  homepage: string | null;
  imdbId: string | null;
  cast: PersonCredit[];
  crew: PersonCredit[];
};

const input = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  lang: z.enum(["ar", "en"]).default("ar"),
});

type TmdbPersonDetails = {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  homepage?: string | null;
  imdb_id?: string | null;
};

type TmdbPersonCredit = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  character?: string;
  job?: string;
  media_type?: string;
  popularity?: number;
};

export const getPersonDetails = createServerFn({ method: "GET" })
  .validator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<PersonDetails> => {
    const { tmdbGet } = await import("./tmdb.server");
    const [details, credits] = await Promise.all([
      tmdbGet<TmdbPersonDetails>(`/person/${data.id}`, {}, data.lang),
      tmdbGet<{ cast?: TmdbPersonCredit[]; crew?: TmdbPersonCredit[] }>(
        `/person/${data.id}/combined_credits`,
        {},
        data.lang,
      ),
    ]);

    const mapCredit = (c: TmdbPersonCredit): PersonCredit => ({
      id: c.id,
      title: c.title || c.name || c.original_title || c.original_name || "",
      poster: c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : null,
      year: (c.release_date || c.first_air_date || "").slice(0, 4),
      rating: Math.round((c.vote_average || 0) * 10) / 10,
      character: c.character || c.job || "",
      mediaType: c.media_type === "tv" ? "tv" : "movie",
      popularity: c.popularity || 0,
    });

    const dedupe = (arr: PersonCredit[]) => {
      const seen = new Set<string>();
      return arr.filter((c) => {
        const k = `${c.mediaType}-${c.id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    const cast: PersonCredit[] = dedupe((credits.cast || []).map(mapCredit))
      .filter((c) => c.title)
      .sort((a, b) => {
        const ay = parseInt(a.year || "0", 10);
        const by = parseInt(b.year || "0", 10);
        if (by !== ay) return by - ay;
        return b.popularity - a.popularity;
      });

    const crew: PersonCredit[] = dedupe((credits.crew || []).map(mapCredit))
      .filter((c) => c.title)
      .sort((a, b) => {
        const ay = parseInt(a.year || "0", 10);
        const by = parseInt(b.year || "0", 10);
        if (by !== ay) return by - ay;
        return b.popularity - a.popularity;
      });

    return {
      id: details.id,
      name: details.name,
      biography: details.biography || "",
      birthday: details.birthday || null,
      deathday: details.deathday || null,
      placeOfBirth: details.place_of_birth || null,
      knownFor: details.known_for_department || "",
      profile: details.profile_path
        ? `https://image.tmdb.org/t/p/h632${details.profile_path}`
        : null,
      homepage: details.homepage || null,
      imdbId: details.imdb_id || null,
      cast,
      crew,
    };
  });
