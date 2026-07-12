import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Star, Tags, Film, Tv as TvIcon, Filter } from "lucide-react";
import { NavToggles } from "@/components/NavToggles";
import { getGenres, getMoviesByGenre, type MovieCard } from "@/lib/movies.functions";
import { getTvGenres, getTvByGenre, type TvCard } from "@/lib/tv.functions";
import { useLocale, useT } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useState } from "react";

const searchSchema = z.object({
  type: z.enum(["movie", "tv"]).catch("movie"),
  sort: z.string().catch("popularity.desc"),
  page: z.number().catch(1),
  minRating: z.number().catch(0),
  year: z.number().nullable().catch(null),
  ol: z.string().nullable().catch(null),
});

export const Route = createFileRoute("/genre/$id")({
  validateSearch: (raw) => searchSchema.parse(raw),
  component: GenrePage,
});

const LANGS = ["ar", "en", "ko", "ja", "tr", "hi", "fr", "es"] as const;
const CURRENT_YEAR = new Date().getFullYear();

function GenrePage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { locale, dir, t } = useLocale();
  const genreId = Number(id);
  const isTv = search.type === "tv";

  const [showFilters, setShowFilters] = useState(false);
  const [pages, setPages] = useState<number>(search.page);

  const genres = useQuery({
    queryKey: [isTv ? "tv-genres" : "genres", locale],
    queryFn: () => (isTv ? getTvGenres({ data: { lang: locale } }) : getGenres({ data: { lang: locale } })),
  });
  const genreName = genres.data?.find((g) => g.id === genreId)?.name ?? "";

  // Fetch all pages up to `pages`
  const pagesResult = useQuery({
    queryKey: [isTv ? "tv-by-genre" : "by-genre", genreId, search.sort, pages, search.minRating, search.year, search.ol, locale],
    queryFn: async () => {
      const collected: (MovieCard | TvCard)[] = [];
      let totalPages = 1;
      for (let p = 1; p <= pages; p++) {
        const args = {
          genreId,
          lang: locale,
          sort: search.sort as never,
          page: p,
          minRating: search.minRating,
          year: search.year,
          lang_original: search.ol,
        };
        const r = isTv
          ? await getTvByGenre({ data: args as never })
          : await getMoviesByGenre({ data: args as never });
        collected.push(...r.results);
        totalPages = r.totalPages;
        if (p >= totalPages) break;
      }
      return { results: collected, totalPages };
    },
  });

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ to: "/genre/$id", params: { id }, search: { ...search, ...patch, page: 1 } });

  const sortOptions = isTv
    ? ([
        ["popularity.desc", t("sort_popular")],
        ["vote_average.desc", t("sort_rating")],
        ["first_air_date.desc", t("sort_newest")],
      ] as const)
    : ([
        ["popularity.desc", t("sort_popular")],
        ["vote_average.desc", t("sort_rating")],
        ["primary_release_date.desc", t("sort_newest")],
      ] as const);

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition">
            <ArrowRight className="w-4 h-4" />
            {t("back")}
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isTv ? <TvIcon className="w-5 h-5 text-primary shrink-0" /> : <Tags className="w-5 h-5 text-primary shrink-0" />}
            <h1 className="text-xl font-bold truncate">
              {isTv ? t("tv_series") : t("tab_movies")} · {genreName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/genre/$id"
              params={{ id }}
              search={{ ...search, type: isTv ? "movie" : "tv", page: 1 }}
              className="text-xs px-3 py-1.5 rounded-full border bg-secondary/60 border-border hover:bg-secondary"
            >
              {isTv ? t("tab_movies") : t("tab_series")}
            </Link>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 border-border hover:bg-secondary"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {t("filters")}
            </button>
            <NavToggles />
          </div>
        </div>

        {/* Sort */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex flex-wrap items-center gap-2">
          {sortOptions.map(([val, label]) => (
            <button
              key={val}
              onClick={() => updateSearch({ sort: val })}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                search.sort === val
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/60 border-border hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-4 grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{t("year")}</span>
              <select
                value={search.year ?? ""}
                onChange={(e) => updateSearch({ year: e.target.value ? Number(e.target.value) : null })}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t("any")}</option>
                {Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{t("min_rating")}</span>
              <select
                value={search.minRating}
                onChange={(e) => updateSearch({ minRating: Number(e.target.value) })}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>{t("any")}</option>
                {[5, 6, 7, 7.5, 8, 8.5, 9].map((r) => (
                  <option key={r} value={r}>{r}+</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">{t("original_language")}</span>
              <select
                value={search.ol ?? ""}
                onChange={(e) => updateSearch({ ol: e.target.value || null })}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t("any")}</option>
                {LANGS.map((l) => (
                  <option key={l} value={l}>{t(`lang_${l}` as never)}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {pagesResult.isLoading && (
          <div className="py-16 flex items-center justify-center"><Spinner size={64} label={t("loading")} /></div>
        )}

        {!pagesResult.isLoading && (pagesResult.data?.results.length ?? 0) === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <img src="/icon-192.png" srcSet="/icon-192.png 1x, /icon-512.png 2x" alt="" aria-hidden className="w-16 h-16 md:w-20 md:h-20 opacity-70 mb-3" />
            <p className="text-base font-medium">{t("no_results")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("no_results_sub")}</p>
          </div>
        )}

        {pagesResult.data && pagesResult.data.results.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pagesResult.data.results.map((m) => (
                <Link
                  key={`${m.id}-${m.year}`}
                  to={isTv ? "/tv/$id" : "/movie/$id"}
                  params={{ id: String(m.id) }}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {m.poster ? (
                      <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8" /></div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {m.rating}
                    </div>
                    <FavoriteButton
                      movie={{ id: m.id, title: m.title, poster: m.poster, year: m.year, rating: m.rating }}
                      variant="icon"
                    />
                  </div>
                  <p className="mt-2 text-sm truncate group-hover:text-primary transition">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.year}</p>
                </Link>
              ))}
            </div>
            {pages < (pagesResult.data?.totalPages ?? 1) && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setPages(pages + 1)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
                >
                  {t("load_more")}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
