import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  Tags,
  Film,
  Tv as TvIcon,
  Filter,
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  ChevronDown,
  Compass,
} from "lucide-react";
import { NavToggles } from "@/components/NavToggles";
import { getGenres, getMoviesByGenre, type MovieCard } from "@/lib/movies.functions";
import { getTvGenres, getTvByGenre, type TvCard } from "@/lib/tv.functions";
import { getGenreEditorial } from "@/lib/editorial.functions";
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
  ids: z.string().catch(""),
});

export const Route = createFileRoute("/genre/$id")({
  validateSearch: (raw) => searchSchema.parse(raw),
  head: ({ params }) => {
    const url = `https://filmak.site/genre/${params.id}`;
    const title = "دليل وتصنيف السينما — فلمك | Filmak Genre Guide";
    const description =
      "دليل شامل لأفلام ومسلسلات التصنيف: مقدمة نقدية، أبرز ما يميز النوع السينمائي، وأفضل الأعمال المختارة بعناية.";
    const image = "https://filmak.site/icon-512.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: GenrePage,
});

const LANGS = ["ar", "en", "ko", "ja", "tr", "hi", "fr", "es"] as const;
const CURRENT_YEAR = new Date().getFullYear();

function GenrePage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { locale, dir, t } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const genreId = Number(id);
  const isTv = search.type === "tv";

  const [showFilters, setShowFilters] = useState(false);
  const [pages, setPages] = useState<number>(search.page);

  const extraIds: number[] = (search.ids ?? "")
    .split(",")
    .map((s: string) => Number(s))
    .filter((n: number) => Number.isFinite(n) && n > 0 && n !== genreId);
  const selectedIds = [genreId, ...extraIds];

  const genres = useQuery({
    queryKey: [isTv ? "tv-genres" : "genres", locale],
    queryFn: () => (isTv ? getTvGenres({ data: { lang: locale } }) : getGenres({ data: { lang: locale } })),
  });

  const genreEditorial = useQuery({
    queryKey: ["genre-editorial", genreId],
    queryFn: () => getGenreEditorial({ data: { genreId } }),
  });

  const editorial = genreEditorial.data;
  const genreName = genres.data?.find((g) => g.id === genreId)?.name ?? (ar ? editorial?.name_ar : editorial?.name_en) ?? "";
  const selectedNames = selectedIds
    .map((gid) => genres.data?.find((g) => g.id === gid)?.name)
    .filter(Boolean)
    .join(" + ");

  // Fetch all pages up to `pages`
  const pagesResult = useQuery({
    queryKey: [isTv ? "tv-by-genre" : "by-genre", selectedIds.join(","), search.sort, pages, search.minRating, search.year, search.ol, locale],
    queryFn: async () => {
      const collected: (MovieCard | TvCard)[] = [];
      let totalPages = 1;
      for (let p = 1; p <= pages; p++) {
        const args = {
          genreIds: selectedIds,
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
    placeholderData: keepPreviousData,
  });

  const isRefetching = pagesResult.isFetching && !pagesResult.isLoading;

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ to: "/genre/$id", params: { id }, search: { ...search, ...patch, page: 1 } });

  const toggleExtra = (gid: number) => {
    if (gid === genreId) return;
    const set = new Set(extraIds);
    if (set.has(gid)) set.delete(gid);
    else set.add(gid);
    updateSearch({ ids: [...set].join(",") });
    setPages(1);
  };

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

  // JSON-LD FAQs schema
  const faqSchema = editorial?.faqs && editorial.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: editorial.faqs.map((f) => ({
          "@type": "Question",
          name: ar ? f.q_ar : f.q_en,
          acceptedAnswer: {
            "@type": "Answer",
            text: ar ? f.a_ar : f.a_en,
          },
        })),
      }
    : null;

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Header Sticky Bar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition"
          >
            <Arrow className="w-4 h-4" />
            {t("back")}
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isTv ? <TvIcon className="w-5 h-5 text-primary shrink-0" /> : <Tags className="w-5 h-5 text-primary shrink-0" />}
            <h1 className="text-xl font-bold truncate">
              {isTv ? t("tv_series") : t("tab_movies")} · {selectedNames || genreName}
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

        {/* Genre multi-select chips */}
        {(genres.data?.length ?? 0) > 0 && (
          <div className="max-w-7xl mx-auto pb-3">
            <div className="px-4 mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Tags className="w-3.5 h-3.5" />
                {t("browse_by_genre")}
                {extraIds.length > 0 && (
                  <span className="ms-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    +{extraIds.length}
                  </span>
                )}
              </span>
              {extraIds.length > 0 && (
                <button
                  onClick={() => {
                    updateSearch({ ids: "" });
                    setPages(1);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:bg-secondary shrink-0"
                >
                  {t("all_genres")}
                </button>
              )}
            </div>
            <div className="flex md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {genres.data!.map((g) => {
                const selected = selectedIds.includes(g.id);
                const isPrimary = g.id === genreId;
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleExtra(g.id)}
                    disabled={isPrimary}
                    className={`snap-start shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 border-border hover:bg-secondary"
                    } ${isPrimary ? "opacity-90 cursor-default" : ""}`}
                    title={isPrimary ? undefined : selected ? "remove" : "add"}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sort Chips */}
        <div className="max-w-7xl mx-auto pb-4">
          <div className="flex md:flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sortOptions.map(([val, label]) => (
              <button
                key={val}
                onClick={() => updateSearch({ sort: val })}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                  search.sort === val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 border-border hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

      {/* ========================================================================= */}
      {/* ORIGINAL EDITORIAL GENRE DEEP DIVE SECTION */}
      {/* ========================================================================= */}
      {editorial && (
        <section className="border-b border-border/40 bg-card/20 py-8">
          <div className="max-w-7xl mx-auto px-4 space-y-6">
            <div className="max-w-4xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {ar ? "دليل فلمك لهذا التصنيف" : "FILMAK Genre Guide"}
              </div>
              <h2 className="text-2xl md:text-3xl font-black">
                {ar ? `عالم سينما ${genreName}` : `The World of ${genreName} Cinema`}
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                {ar ? editorial.intro_ar : editorial.intro_en}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  {ar ? "ما الذي يمكنك توقعه في هذا النوع؟" : "What to Expect"}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {ar ? editorial.what_to_expect_ar : editorial.what_to_expect_en}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  {ar ? "أبرز السمات والأنماط المميزة" : "Signature Tropes & Motifs"}
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(ar ? editorial.signature_tropes_ar : editorial.signature_tropes_en).map((t, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-secondary/70 border border-border text-foreground font-medium">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Essential Picks */}
            {editorial.essential_picks.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-primary" />
                  {ar ? "مختارات كلاسيكية أساسية في هذا التصنيف" : "Essential Landmark Picks"}
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {editorial.essential_picks.map((pick) => (
                    <Link
                      key={pick.id}
                      to="/movie/$id"
                      params={{ id: String(pick.id) }}
                      className="group rounded-xl border border-border bg-card p-3 space-y-1 hover:border-primary/40 transition block"
                    >
                      <div className="font-bold text-sm text-foreground group-hover:text-primary transition flex items-center justify-between">
                        <span className="truncate">{ar ? pick.title_ar : pick.title_en}</span>
                        <span className="text-xs text-muted-foreground font-normal">{pick.year}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {ar ? pick.note_ar : pick.note_en}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Guides Links */}
            {editorial.related_guides.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-2">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  {ar ? "مقالات ذات صلة:" : "Related Guides:"}
                </span>
                {editorial.related_guides.map((g) => (
                  <Link
                    key={g.slug}
                    to="/articles/$slug"
                    params={{ slug: g.slug }}
                    className="text-primary hover:underline font-medium"
                  >
                    {ar ? g.title_ar : g.title_en}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Progress Bar */}
      <div
        aria-hidden
        className={`fixed top-0 inset-x-0 z-50 h-0.5 overflow-hidden pointer-events-none transition-opacity duration-200 ${
          pagesResult.isFetching ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 bg-primary animate-[genre-progress_1.1s_ease-in-out_infinite]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {pagesResult.isLoading && (
          <div
            aria-busy="true"
            aria-live="polite"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] rounded-2xl bg-muted animate-pulse" />
                <div className="mt-2 h-3.5 rounded bg-muted animate-pulse w-3/4" />
                <div className="mt-1.5 h-3 rounded bg-muted animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!pagesResult.isLoading && (pagesResult.data?.results.length ?? 0) === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <img src="/icon-192.png" srcSet="/icon-192.png 1x, /icon-512.png 2x" alt={t("brand")} aria-hidden className="w-16 h-16 md:w-20 md:h-20 opacity-70 mb-3" />
            <p className="text-base font-medium">{t("no_results")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("no_results_sub")}</p>
          </div>
        )}

        {pagesResult.data && pagesResult.data.results.length > 0 && (
          <div
            aria-busy={isRefetching || undefined}
            className={`transition-opacity duration-200 ${isRefetching ? "opacity-60" : "opacity-100"}`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pagesResult.data.results.map((m) => (
                <Link
                  key={`${m.id}-${m.year}`}
                  to={isTv ? "/tv/$id" : "/movie/$id"}
                  params={{ id: String(m.id) }}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm">
                    {m.poster ? (
                      <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
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
                  <p className="mt-2 text-sm font-semibold truncate group-hover:text-primary transition">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.year}</p>
                </Link>
              ))}
            </div>
            {pages < (pagesResult.data?.totalPages ?? 1) && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setPages(pages + 1)}
                  disabled={isRefetching}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-primary/20"
                >
                  {isRefetching ? (
                    <>
                      <Spinner size={16} />
                      {t("loading")}
                    </>
                  ) : (
                    t("load_more")
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Genre FAQ Accordion */}
        {editorial?.faqs && editorial.faqs.length > 0 && (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {ar ? `أسئلة شائعة حول أفلام ${genreName}` : `Frequently Asked Questions about ${genreName}`}
            </h3>
            <div className="space-y-3 pt-2">
              {editorial.faqs.map((faq, idx) => (
                <details key={idx} className="group rounded-xl border border-border/60 bg-secondary/20 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm">
                    <span>{ar ? faq.q_ar : faq.q_en}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-xs md:text-sm leading-relaxed text-muted-foreground">
                    {ar ? faq.a_ar : faq.a_en}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
