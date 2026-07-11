import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Sparkles, Search, Star, Loader2, Film, TrendingUp, Award, Flame, Clapperboard, CalendarClock, Heart, LogOut, User, Tv } from "lucide-react";
import {
  getTrending,
  getTopRated,
  getPopular,
  getNowPlaying,
  getUpcoming,
  searchMovies,
  type MovieCard,
} from "@/lib/movies.functions";
import { recommendMovies } from "@/lib/recommend.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["trending"],
        queryFn: () => getTrending(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["top-rated"],
        queryFn: () => getTopRated(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["popular"],
        queryFn: () => getPopular(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["now-playing"],
        queryFn: () => getNowPlaying(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["upcoming"],
        queryFn: () => getUpcoming(),
      }),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">حدث خطأ</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">غير موجود</div>,
});

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const trending = useQuery({ queryKey: ["trending"], queryFn: () => getTrending() });
  const topRated = useQuery({ queryKey: ["top-rated"], queryFn: () => getTopRated() });
  const popular = useQuery({ queryKey: ["popular"], queryFn: () => getPopular() });
  const nowPlaying = useQuery({ queryKey: ["now-playing"], queryFn: () => getNowPlaying() });
  const upcoming = useQuery({ queryKey: ["upcoming"], queryFn: () => getUpcoming() });

  const [searchQ, setSearchQ] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const searchRes = useQuery({
    queryKey: ["search", activeSearch],
    queryFn: () => searchMovies({ data: { q: activeSearch } }),
    enabled: activeSearch.length > 0,
  });

  const [prompt, setPrompt] = useState("");
  const recMutation = useMutation({
    mutationFn: (p: string) => recommendMovies({ data: { prompt: p } }),
  });

  const suggestions = [
    "فلم إثارة نفسي مثل Inception بس أقصر",
    "افلام مصرية مضحكة قديمة",
    "مسلسلات تركية رومانسية",
    "مسلسلات كورية إثارة وغموض",
    "أفلام رعب حديثة مو مبتذلة",
    "أنمي أكشن قوي",
    "افلام هندية عائلية",
  ];

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">سينمائي</span>
          </Link>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setActiveSearch(searchQ.trim());
            }}
            className="relative flex-1 max-w-md mx-4"
          >
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث عن فلم…"
              className="w-full bg-secondary/60 border border-border rounded-full pr-10 pl-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/favorites"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
                >
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">مفضلتي</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
                  aria-label="تسجيل الخروج"
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
                <span className="hidden sm:inline">دخول</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero + AI */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            مدعوم بالذكاء الاصطناعي
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            صف الفلم اللي في بالك
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ونجيبه لك
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            بدل ما تضيع ساعة تدور، اكتب مزاجك أو نوع الفلم اللي تحبه واتركنا نرشح لك.
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
                placeholder="مثال: أبي فلم إثارة نفسي مثل Inception بس أقصر…"
                className="w-full bg-card border border-border rounded-2xl p-4 pb-14 text-base outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <button
                type="submit"
                disabled={recMutation.isPending || prompt.trim().length < 2}
                className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {recMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                رشّح لي
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
            <div className="mt-10 text-right">
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
                            {isTv ? "مسلسل" : "فلم"}
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
          title={`نتائج البحث: "${activeSearch}"`}
          icon={<Search className="w-5 h-5" />}
          movies={searchRes.data ?? []}
          loading={searchRes.isLoading}
        />
      )}

      <Row
        title="رائجة هذا الأسبوع"
        icon={<Flame className="w-5 h-5 text-accent" />}
        movies={trending.data ?? []}
      />
      <Row
        title="الجديد في السينما"
        icon={<Clapperboard className="w-5 h-5 text-accent" />}
        movies={nowPlaying.data ?? []}
      />
      <Row
        title="قريباً"
        icon={<CalendarClock className="w-5 h-5 text-primary" />}
        movies={upcoming.data ?? []}
      />
      <Row
        title="الأعلى تقييماً"
        icon={<Award className="w-5 h-5 text-primary" />}
        movies={topRated.data ?? []}
      />
      <Row
        title="شائعة الآن"
        icon={<TrendingUp className="w-5 h-5" />}
        movies={popular.data ?? []}
      />

      <footer className="border-t border-border/40 mt-16 py-8 text-center text-xs text-muted-foreground">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}

function Row({
  title,
  icon,
  movies,
  loading,
}: {
  title: string;
  icon?: React.ReactNode;
  movies: MovieCard[];
  loading?: boolean;
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
        {icon}
        {title}
      </h2>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> يحمّل…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((m) => (
            <Link
              key={m.id}
              to="/movie/$id"
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
