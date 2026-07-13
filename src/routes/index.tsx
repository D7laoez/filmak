import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Sparkles, Search, Star, Loader2, Film, TrendingUp, Award, Flame, Clapperboard, CalendarClock, Heart, LogOut, User, Tv, Tags, Compass } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useQueryClient } from "@tanstack/react-query";
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
  head: () => {
    const title = "فلمك — Filmak · توصيات أفلام ومسلسلات بالذكاء الاصطناعي";
    const description =
      "اكتشف أفلاماً ومسلسلات تناسب مزاجك بالذكاء الاصطناعي — بالعربية والإنجليزية. Discover movies and series that match your mood with AI.";
    const url = "https://filmak.site/";
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

  const [searchQ, setSearchQ] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Live search: debounce the input so typing "هوس" shows results instantly.
  useEffect(() => {
    const q = searchQ.trim();
    const h = setTimeout(() => setActiveSearch(q), 250);
    return () => clearTimeout(h);
  }, [searchQ]);

  // Prevent body scroll while the mobile search overlay is open.
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
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
          </Link>
          {/* Desktop / tablet inline search */}
          <form
            onSubmit={(e: FormEvent) => e.preventDefault()}
            className="relative flex-1 max-w-md mx-4 hidden sm:block"
          >
            <Search
              className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
            />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t("search_placeholder")}
              dir="auto"
              className={`w-full bg-secondary/60 border border-border rounded-full py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            />
          </form>
          <div className="flex items-center gap-2">
            {/* Mobile-only search trigger */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
              aria-label={t("search_placeholder")}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
              aria-label="Switch language"
            >
              <Languages className="w-4 h-4" />
              {t("lang_switch")}
            </button>
            <ThemeToggle />
            <Link
              to="/discover"
              className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
              aria-label={t("discover")}
            >
              <Compass className="w-4 h-4" />
              {t("discover")}
            </Link>
            {user ? (
              <>
                <Link
                  to="/favorites"
                  search={{ tab: "favorite" }}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
                >
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{t("my_favorites")}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
                  aria-label={t("logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t("login")}</span>
              </button>
            )}
          </div>
        </div>
      </header>

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


      {tab === "movie" && trending.data && trending.data.length > 0 && (
        <HeroCarousel movies={trending.data} />
      )}

      {/* AI prompt hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center relative">
          <img
            src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
            alt={t("brand")}
            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 drop-shadow-[0_8px_32px_rgba(168,85,247,0.35)]"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {t("tagline_ai")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {t("hero_1")}
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("hero_2")}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            {t("hero_sub")}
          </p>

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (prompt.trim().length < 2) return;
              recMutation.mutate(prompt.trim());
            }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={t("prompt_placeholder")}
                className="w-full bg-card border border-border rounded-2xl p-4 pb-14 text-base outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <button
                type="submit"
                disabled={recMutation.isPending || prompt.trim().length < 2}
                className={`absolute bottom-3 ${dir === "rtl" ? "left-3" : "right-3"} inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition`}
              >
                {recMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t("recommend_btn")}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>

          {recMutation.isError && (
            <p className="mt-6 text-destructive text-sm">
              {(recMutation.error as Error).message}
            </p>
          )}

          {recMutation.data && (
            <div className={`mt-10 ${dir === "rtl" ? "text-right" : "text-left"}`}>
              {recMutation.data.intro && (
                <p className="text-muted-foreground mb-4">{recMutation.data.intro}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recMutation.data.recommendations.map((r) => {
                  const isTv = r.mediaType === "tv";
                  const body = (
                    <>
                      {r.poster ? (
                        <img
                          src={r.poster}
                          alt={r.title}
                          className="w-20 h-28 object-cover rounded-md shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold truncate">{r.title}</h3>
                          <span className="text-xs text-muted-foreground">{r.year}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              isTv
                                ? "bg-accent/20 text-accent border border-accent/40"
                                : "bg-primary/15 text-primary border border-primary/30"
                            }`}
                          >
                            {isTv ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            {isTv ? t("tv_series") : t("movie")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary mb-2">
                          <Star className="w-3 h-3 fill-primary" />
                          {r.rating}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{r.reason}</p>
                      </div>
                    </>
                  );
                  const cls =
                    "group flex gap-4 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition";
                  if (isTv) {
                    return (
                      <a
                        key={`tv-${r.id}`}
                        href={`https://www.themoviedb.org/tv/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cls}
                      >
                        {body}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={`movie-${r.id}`}
                      to="/movie/$id"
                      params={{ id: String(r.id) }}
                      className={cls}
                    >
                      {body}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

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
      <section className="max-w-7xl mx-auto px-4 pt-8">
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

        {/* Genre chips → link to /genre/$id */}
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
              search={{ type: tab, sort: "popularity.desc", page: 1 }}
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

      <footer className="border-t border-border/40 mt-16 py-8 text-center text-xs text-muted-foreground">
        {t("footer")}
      </footer>
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
            className="w-14 h-14 md:w-16 md:h-16 opacity-70 mb-3"
          />
          <p className="text-sm font-medium">{emptyLabel}</p>
          {emptySub && (
            <p className="text-xs text-muted-foreground mt-1">{emptySub}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((m) => (
            <Link
              key={m.id}
              to={type === "tv" ? "/tv/$id" : "/movie/$id"}
              params={{ id: String(m.id) }}
              className="group block"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                {m.poster ? (
                  <img
                    src={m.poster}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Film className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {m.rating}
                </div>
                <FavoriteButton
                  movie={{
                    id: m.id,
                    title: m.title,
                    poster: m.poster,
                    year: m.year,
                    rating: m.rating,
                  }}
                  variant="icon"
                />
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium truncate group-hover:text-primary transition">
                  {m.title}
                </h3>
                <p className="text-xs text-muted-foreground">{m.year}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function tvToCard(t: TvCard): MovieCard {
  return t as unknown as MovieCard;
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
  const t = useLocale().t;
  const results: MovieCard[] = tab === "tv" ? tvResults.map(tvToCard) : movieResults;
  const trimmed = value.trim();

  return (
    <div dir={dir} className="fixed inset-0 z-[60] bg-background flex flex-col">
      <div className="sticky top-0 border-b border-border/40 bg-background/95 backdrop-blur px-3 py-3 flex items-center gap-2">
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative flex-1">
          <Search
            className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
          />
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("search_placeholder")}
            dir="auto"
            className={`w-full bg-secondary/60 border border-border rounded-full py-2.5 text-base outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border/50 px-4">
        <button
          onClick={() => setTab("movie")}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "movie" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <Film className="w-4 h-4" />
          {t("tab_movies")}
        </button>
        <button
          onClick={() => setTab("tv")}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "tv" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <Tv className="w-4 h-4" />
          {t("tab_series")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {trimmed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {t("search_placeholder")}
          </p>
        ) : loading ? (
          <div className="py-10 flex items-center justify-center">
            <Spinner size={48} label={t("loading")} />
          </div>
        ) : results.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium">{t("no_results")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("no_results_sub")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {results.map((m) => (
              <li key={`${tab}-${m.id}`}>
                <Link
                  to={tab === "tv" ? "/tv/$id" : "/movie/$id"}
                  params={{ id: String(m.id) }}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3"
                >
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.title}
                      loading="lazy"
                      className="w-12 h-16 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{m.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{m.year}</span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="w-3 h-3 fill-primary" />
                        {m.rating}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
