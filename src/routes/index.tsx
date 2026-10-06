import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  Sparkles,
  Search,
  Star,
  Loader2,
  Film,
  TrendingUp,
  Award,
  Flame,
  Clapperboard,
  CalendarClock,
  Heart,
  LogOut,
  User,
  Tv,
  Tags,
  Compass,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Clock,
  LibraryBig,
} from "lucide-react";
import { X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import {
  getTrending,
  getTopRated,
  getPopular,
  getNowPlaying,
  getUpcoming,
  searchMovies,
  getGenres,
  type MovieCard,
} from "@/lib/movies.functions";
import {
  getTrendingTv,
  getPopularTv,
  getTopRatedTv,
  getOnAirTv,
  getAiringTodayTv,
  searchTv,
  getTvGenres,
  type TvCard,
} from "@/lib/tv.functions";
import { recommendMovies } from "@/lib/recommend.functions";
import { getEditorialPickOfTheWeek, getEditorialArticles } from "@/lib/editorial.functions";

import { FavoriteButton } from "@/components/FavoriteButton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroCarousel } from "@/components/HeroCarousel";
import { AdSlot } from "@/components/AdSlot";

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (r: Record<string, unknown>) =>
    z.object({ q: z.string().optional() }).parse(r),
  head: ({ search }) => {
    const title = "فلمك — Filmak · دليل أفلام ومقالات سينمائية تحريرية";
    const description =
      "منصة اكتشاف وتحليل سينمائي: ترشيحات بالذكاء الاصطناعي، مراجعات نقدية أصلية، وأدلة مشاهدة لأفضل الأفلام والمسلسلات.";
    const url = "https://filmak.site/";
    const image = "https://filmak.site/icon-512.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },\n        ...(search.q?.trim() ? [{ name: "robots", content: "noindex, follow" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:width", content: "512" },
        { property: "og:image:height", content: "512" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: async ({ context }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData({
          queryKey: ["trending", "ar"],
          queryFn: () => getTrending({ data: { lang: "ar" } }),
        }),
        context.queryClient.ensureQueryData({
          queryKey: ["top-rated", "ar"],
          queryFn: () => getTopRated({ data: { lang: "ar" } }),
        }),
        context.queryClient.ensureQueryData({
          queryKey: ["popular", "ar"],
          queryFn: () => getPopular({ data: { lang: "ar" } }),
        }),
        context.queryClient.ensureQueryData({
          queryKey: ["now-playing", "ar"],
          queryFn: () => getNowPlaying({ data: { lang: "ar" } }),
        }),
        context.queryClient.ensureQueryData({
          queryKey: ["upcoming", "ar"],
          queryFn: () => getUpcoming({ data: { lang: "ar" } }),
        }),
      ]);
    } catch (err) {
      console.warn("Home loader warning:", err);
    }
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
          alt="Filmak"
          className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-90"
        />
        <h1 className="text-2xl font-bold mb-2">Error / حدث خطأ</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">404</div>,
});

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { locale, dir, t, toggle } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const { q: urlQ } = Route.useSearch();

  const trending = useQuery({
    queryKey: ["trending", locale],
    queryFn: () => getTrending({ data: { lang: locale } }),
  });
  const topRated = useQuery({
    queryKey: ["top-rated", locale],
    queryFn: () => getTopRated({ data: { lang: locale } }),
  });
  const popular = useQuery({
    queryKey: ["popular", locale],
    queryFn: () => getPopular({ data: { lang: locale } }),
  });
  const nowPlaying = useQuery({
    queryKey: ["now-playing", locale],
    queryFn: () => getNowPlaying({ data: { lang: locale } }),
  });
  const upcoming = useQuery({
    queryKey: ["upcoming", locale],
    queryFn: () => getUpcoming({ data: { lang: locale } }),
  });

  const pickOfTheWeek = useQuery({
    queryKey: ["editorial-pick-of-week"],
    queryFn: () => getEditorialPickOfTheWeek(),
  });

  const articlesQuery = useQuery({
    queryKey: ["editorial-articles-home"],
    queryFn: () => getEditorialArticles({ data: { limit: 3 } }),
  });

  const [searchQ, setSearchQ] = useState(urlQ ?? "");
  const [activeSearch, setActiveSearch] = useState(urlQ ?? "");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchQ(urlQ ?? "");
  }, [urlQ]);

  useEffect(() => {
    const q = searchQ.trim();
    const h = setTimeout(() => setActiveSearch(q), 250);
    return () => clearTimeout(h);
  }, [searchQ]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileSearchOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileSearchOpen]);

  const searchRes = useQuery({
    queryKey: ["search", activeSearch, locale],
    queryFn: () => searchMovies({ data: { q: activeSearch, lang: locale } }),
    enabled: activeSearch.length > 0,
  });

  const [tab, setTab] = useState<"movie" | "tv">("movie");
  const searchTvRes = useQuery({
    queryKey: ["search-tv", activeSearch, locale],
    queryFn: () => searchTv({ data: { q: activeSearch, lang: locale } }),
    enabled: activeSearch.length > 0 && tab === "tv",
  });

  const movieGenres = useQuery({
    queryKey: ["genres", locale],
    queryFn: () => getGenres({ data: { lang: locale } }),
  });
  const tvGenres = useQuery({
    queryKey: ["tv-genres", locale],
    queryFn: () => getTvGenres({ data: { lang: locale } }),
  });

  const trendingTv = useQuery({
    queryKey: ["trending-tv", locale],
    queryFn: () => getTrendingTv({ data: { lang: locale } }),
    enabled: tab === "tv",
  });
  const popularTv = useQuery({
    queryKey: ["popular-tv", locale],
    queryFn: () => getPopularTv({ data: { lang: locale } }),
    enabled: tab === "tv",
  });
  const topRatedTv = useQuery({
    queryKey: ["top-rated-tv", locale],
    queryFn: () => getTopRatedTv({ data: { lang: locale } }),
    enabled: tab === "tv",
  });
  const onAirTv = useQuery({
    queryKey: ["on-air-tv", locale],
    queryFn: () => getOnAirTv({ data: { lang: locale } }),
    enabled: tab === "tv",
  });
  const airingTodayTv = useQuery({
    queryKey: ["airing-today-tv", locale],
    queryFn: () => getAiringTodayTv({ data: { lang: locale } }),
    enabled: tab === "tv",
  });

  const [prompt, setPrompt] = useState("");
  const recMutation = useMutation({
    mutationFn: (p: string) => recommendMovies({ data: { prompt: p, lang: locale } }),
  });

  const suggestions = t("suggestions");

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success(t("logout_toast"));
  }

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-20">
      {mobileSearchOpen && (
        <MobileSearchOverlay
          value={searchQ}
          onChange={setSearchQ}
          onClose={() => setMobileSearchOpen(false)}
          tab={tab}
          setTab={setTab}
          movieResults={searchRes.data ?? []}
          tvResults={searchTvRes.data ?? []}
          loading={tab === "tv" ? searchTvRes.isLoading : searchRes.isLoading}
          dir={dir}
        />
      )}

      {/* Hero Carousel */}
      <HeroCarousel
        movies={trending.data ?? []}
        searchValue={searchQ}
        onSearchChange={setSearchQ}
        onOpenMobileSearch={() => setMobileSearchOpen(true)}
      />

      {/* ========================================================================= */}
      {/* 1. FILMAK PICK OF THE WEEK (FEATURED EDITORIAL SPOTLIGHT) */}
      {/* ========================================================================= */}
      {pickOfTheWeek.data && (
        <section className="max-w-7xl mx-auto px-4 pt-10">
          <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl p-6 md:p-8">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3.5 py-1 text-xs text-primary font-bold">
                  <Award className="w-4 h-4" />
                  {ar ? pickOfTheWeek.data.badge_ar : pickOfTheWeek.data.badge_en}
                </div>
                <h2 className="text-2xl md:text-4xl font-black">
                  {pickOfTheWeek.data.title}
                </h2>
                <blockquote className="text-sm md:text-base leading-relaxed text-foreground/90 italic bg-secondary/30 rounded-2xl p-4 border-r-4 rtl:border-r-4 ltr:border-l-4 border-primary">
                  "{ar ? pickOfTheWeek.data.why_picked_ar : pickOfTheWeek.data.why_picked_en}"
                </blockquote>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/movie/$id"
                    params={{ id: String(pickOfTheWeek.data.movieId) }}
                    reloadDocument
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/20"
                  >
                    <Film className="w-4 h-4" />
                    {ar ? "قراءة حكم فلمك الكامل" : "Read Full Verdict"}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    ✍️ {ar ? "اختيار فريق التحرير" : "Curated by Editorial Board"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-lg">
                {pickOfTheWeek.data.backdrop ? (
                  <img
                    src={pickOfTheWeek.data.backdrop}
                    alt={pickOfTheWeek.data.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center bg-secondary">
                    <Film className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. LATEST EDITORIAL GUIDES & ARTICLES */}
      {/* ========================================================================= */}
      {articlesQuery.data && articlesQuery.data.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                {ar ? "أحدث الأدلة والمقالات السينمائية" : "Latest Cinema Guides & Articles"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? "تحليلات معمقة وقوائم منتقاة من هيئة تحرير فلمك."
                  : "Original critical deep dives and viewing roadmaps."}
              </p>
            </div>
            <Link
              to="/articles"
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              {ar ? "كل المقالات" : "All Articles"}
              <Arrow className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articlesQuery.data.map((art) => (
              <Link
                key={art.id}
                to="/articles/$slug"
                params={{ slug: art.slug }}
                className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div className="aspect-video bg-muted overflow-hidden relative">
                  {art.featured_image ? (
                    <img
                      src={art.featured_image}
                      alt={ar ? art.title_ar : art.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-secondary">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur text-[10px] text-white px-2.5 py-0.5 rounded-full font-semibold">
                    {ar ? art.category_label_ar : art.category_label_en}
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition line-clamp-2">
                      {ar ? art.title_ar : art.title_en}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {ar ? art.excerpt_ar : art.excerpt_en}
                    </p>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>✍️ {art.author_name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.reading_time_minutes} {ar ? "د" : "min"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. AI NATURAL LANGUAGE RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 pt-12">
        <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>{t("ask_ai")}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black">
            {t("describe_mood")}
          </h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (prompt.trim()) recMutation.mutate(prompt);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("ai_placeholder")}
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={recMutation.isPending || !prompt.trim()}
              className="bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-primary/20"
            >
              {recMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("searching_ai")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t("recommend_btn")}</span>
                </>
              )}
            </button>
          </form>

          {/* AI Quick Suggestions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s: string) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setPrompt(s);
                  recMutation.mutate(s);
                }}
                className="text-xs bg-secondary/60 hover:bg-secondary border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-foreground transition"
              >
                {s}
              </button>
            ))}
          </div>

          {/* AI Results */}
          {recMutation.isPending && (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{t("searching_ai")}</p>
            </div>
          )}

          {recMutation.isError && (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">
                {ar
                  ? "تعذر تنفيذ الترشيحات حالياً. جرّب مرة ثانية بعد قليل."
                  : "Recommendations are temporarily unavailable. Please try again."}
              </p>
              <button
                type="button"
                onClick={() => recMutation.mutate(prompt)}
                disabled={!prompt.trim()}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
              >
                {ar ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          )}

          {recMutation.data && (
            (() => {
              const recList = Array.isArray(recMutation.data)
                ? recMutation.data
                : (recMutation.data?.recommendations ?? []);
              const recIntro = !Array.isArray(recMutation.data) ? recMutation.data?.intro : null;

              return (
                <div className="pt-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{t("recommendations_for")}: "{prompt}"</h3>
                    {recIntro && (
                      <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/40 p-3.5 rounded-xl border border-border/60">
                        {recIntro}
                      </p>
                    )}
                  </div>
                  {recList.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      {ar ? "لم نتمكن من إيجاد أفلام تطابق هذا الوصف بدقة، جرّب صياغة أخرى." : "No matching movies found, please try another prompt."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {recList.map((r: any) => (
                        <Link
                          key={`${r.mediaType}:${r.id}`}
                          to={r.mediaType === "tv" ? "/tv/$id" : "/movie/$id"}
                          params={{ id: String(r.id) }}
                      reloadDocument
                          className="group block"
                        >
                          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm">
                            {r.poster ? (
                              <img
                                src={r.poster}
                                alt={r.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <Film className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              {r.rating}
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-semibold truncate group-hover:text-primary transition">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.year}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </section>

      {/* Live search results */}
      {activeSearch && (
        <Row
          title={`${t("search_results")}: "${activeSearch}"`}
          icon={<Search className="w-5 h-5" />}
          movies={
            tab === "tv"
              ? (searchTvRes.data ?? []).map(tvToCard)
              : (searchRes.data ?? [])
          }
          loading={tab === "tv" ? searchTvRes.isLoading : searchRes.isLoading}
          type={tab}
          emptyLabel={
            !(tab === "tv" ? searchTvRes.isLoading : searchRes.isLoading) &&
            (tab === "tv"
              ? (searchTvRes.data ?? []).length === 0
              : (searchRes.data ?? []).length === 0)
              ? t("no_results")
              : undefined
          }
          emptySub={t("no_results_sub")}
        />
      )}

      {/* Tabs: Movies / Series */}
      <section className="max-w-7xl mx-auto px-4 pt-10">
        <div className="flex items-center gap-2 border-b border-border/50 mb-6">
          <button
            onClick={() => setTab("movie")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === "movie"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="w-4 h-4" />
            {t("tab_movies")}
          </button>
          <button
            onClick={() => setTab("tv")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === "tv"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tv className="w-4 h-4" />
            {t("tab_series")}
          </button>
        </div>

        {/* Genre chips */}
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Tags className="w-4 h-4 text-primary" />
          {t("browse_by_genre")}
        </div>
        <div className="flex md:flex-wrap gap-2 mb-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {((tab === "tv" ? tvGenres.data : movieGenres.data) ?? []).map((g) => (
            <Link
              key={g.id}
              to="/genre/$id"
              params={{ id: String(g.id) }}
              search={{ type: tab, sort: "popularity.desc", page: 1, minRating: 0, year: null, ol: null, ids: "" }}
              className="snap-start shrink-0 text-xs px-3 py-1.5 rounded-full border bg-secondary/60 border-border hover:bg-secondary hover:border-primary/50 transition"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      {tab === "movie" ? (
        <>
          <Row title={t("trending")} icon={<Flame className="w-5 h-5 text-accent" />} movies={trending.data ?? []} />
          <Row title={t("now_playing")} icon={<Clapperboard className="w-5 h-5 text-accent" />} movies={nowPlaying.data ?? []} />
          <div className="max-w-7xl mx-auto px-4 my-4">
            <AdSlot slot="1234567890" className="min-h-[100px]" />
          </div>
          <Row title={t("upcoming")} icon={<CalendarClock className="w-5 h-5 text-primary" />} movies={upcoming.data ?? []} />
          <Row title={t("top_rated")} icon={<Award className="w-5 h-5 text-primary" />} movies={topRated.data ?? []} />
          <Row title={t("popular")} icon={<TrendingUp className="w-5 h-5" />} movies={popular.data ?? []} />
        </>
      ) : (
        <>
          <Row title={t("trending")} icon={<Flame className="w-5 h-5 text-accent" />} movies={(trendingTv.data ?? []).map(tvToCard)} type="tv" />
          <Row title={t("airing_today")} icon={<Clapperboard className="w-5 h-5 text-accent" />} movies={(airingTodayTv.data ?? []).map(tvToCard)} type="tv" />
          <div className="max-w-7xl mx-auto px-4 my-4">
            <AdSlot slot="1234567890" className="min-h-[100px]" />
          </div>
          <Row title={t("on_the_air")} icon={<CalendarClock className="w-5 h-5 text-primary" />} movies={(onAirTv.data ?? []).map(tvToCard)} type="tv" />
          <Row title={t("top_rated")} icon={<Award className="w-5 h-5 text-primary" />} movies={(topRatedTv.data ?? []).map(tvToCard)} type="tv" />
          <Row title={t("popular")} icon={<TrendingUp className="w-5 h-5" />} movies={(popularTv.data ?? []).map(tvToCard)} type="tv" />
        </>
      )}
    </div>
  );
}

function Row({
  title,
  icon,
  movies,
  loading,
  emptyLabel,
  emptySub,
  type = "movie",
}: {
  title: string;
  icon?: React.ReactNode;
  movies: MovieCard[];
  loading?: boolean;
  emptyLabel?: string | false;
  emptySub?: string;
  type?: "movie" | "tv";
}) {
  const t = useLocale().t;
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
        {icon}
        {title}
      </h2>
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <Spinner size={56} label={t("loading")} />
        </div>
      ) : emptyLabel ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <img
            src="/icon-192.png"
            srcSet="/icon-192.png 1x, /icon-512.png 2x"
            decoding="async"
            alt=""
            aria-hidden="true"
            className="w-16 h-16 md:w-20 md:h-20 opacity-70 mb-3"
          />
          <p className="text-base font-medium">{emptyLabel}</p>
          {emptySub && <p className="text-sm text-muted-foreground mt-1">{emptySub}</p>}
        </div>
      ) : movies.length === 0 ? null : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((m) => (
            <Link
              key={m.id}
              to={type === "tv" ? "/tv/$id" : "/movie/$id"}
              params={{ id: String(m.id) }}
              className="group block"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm">
                {m.poster ? (
                  <img
                    src={m.poster}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {m.rating}
                </div>
                <FavoriteButton movie={m} variant="icon" />
              </div>
              <p className="mt-2 text-sm font-semibold truncate group-hover:text-primary transition">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.year}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function MobileSearchOverlay({
  value,
  onChange,
  onClose,
  tab,
  setTab,
  movieResults,
  tvResults,
  loading,
  dir,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  tab: "movie" | "tv";
  setTab: (t: "movie" | "tv") => void;
  movieResults: MovieCard[];
  tvResults: TvCard[];
  loading: boolean;
  dir: "rtl" | "ltr";
}) {
  const { t } = useLocale();
  const results = tab === "tv" ? tvResults.map(tvToCard) : movieResults;

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={dir}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col p-4 md:hidden"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="relative flex-1">
          <Search
            className={`absolute ${
              dir === "rtl" ? "right-3" : "left-3"
            } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
          />
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("search_placeholder")}
            className={`w-full bg-secondary border border-border rounded-full py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${
              dir === "rtl" ? "pr-9 pl-8" : "pl-9 pr-8"
            }`}
          />
          {value && (
            <button
              onClick={() => onChange("")}
              className={`absolute ${
                dir === "rtl" ? "left-2.5" : "right-2.5"
              } top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-xs px-3 py-2 rounded-full border border-border bg-secondary"
        >
          {t("close")}
        </button>
      </div>

      {value && (
        <div className="flex items-center gap-2 py-2 border-b border-border/50">
          <button
            onClick={() => setTab("movie")}
            className={`text-xs px-3 py-1 rounded-full border ${
              tab === "movie"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {t("tab_movies")} ({movieResults.length})
          </button>
          <button
            onClick={() => setTab("tv")}
            className={`text-xs px-3 py-1 rounded-full border ${
              tab === "tv"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {t("tab_series")} ({tvResults.length})
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-3">
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Spinner size={48} label={t("loading")} />
          </div>
        ) : !value ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {t("type_to_search")}
          </p>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium">{t("no_results")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((m) => (
              <Link
                key={m.id}
                to={tab === "tv" ? "/tv/$id" : "/movie/$id"}
                params={{ id: String(m.id) }}
                onClick={onClose}
                className="group block"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Film className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 bg-black/75 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                    {m.rating}
                  </div>
                </div>
                <p className="mt-1 text-xs font-semibold truncate">{m.title}</p>
                <p className="text-[10px] text-muted-foreground">{m.year}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function tvToCard(t: TvCard): MovieCard {
  return {
    id: t.id,
    title: t.name,
    poster: t.poster,
    backdrop: t.backdrop,
    rating: t.rating,
    year: t.firstAirDate?.slice(0, 4) || "",
    overview: t.overview,
    voteCount: t.voteCount,
    genres: [],
  };
}
