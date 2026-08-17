import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Heart, Compass, Languages, LogOut, User, Dices, Sparkles, LibraryBig, Loader2, Film, Tv } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { searchMovies, type MovieCard } from "@/lib/movies.functions";
import { searchTv, type TvCard } from "@/lib/tv.functions";

export function TopBar() {
  const { user } = useAuth();
  const { t, dir, toggle, locale } = useLocale();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as { q?: string } | undefined;
  const [q, setQ] = useState<string>(search?.q ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState<string>(search?.q ?? "");

  useEffect(() => { setQ(search?.q ?? ""); }, [search?.q]);

  // Avoid firing two server-function requests on every keystroke. Suggestions wait
  // briefly until the user pauses typing, while the visible input remains instant.
  useEffect(() => {
    const value = q.trim();
    const timer = window.setTimeout(() => setDebouncedQ(value), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  if (pathname === "/auth") return null;

  const normalizedQ = debouncedQ;
  const showSuggestions = searchFocused && normalizedQ.length >= 2;

  const movieSuggestions = useQuery({
    queryKey: ["topbar-search-movies", normalizedQ, locale],
    queryFn: () => searchMovies({ data: { q: normalizedQ, lang: locale } }),
    enabled: showSuggestions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const tvSuggestions = useQuery({
    queryKey: ["topbar-search-tv", normalizedQ, locale],
    queryFn: () => searchTv({ data: { q: normalizedQ, lang: locale } }),
    enabled: showSuggestions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  function submitSearch(value: string) {
    const v = value.trim();
    setSearchFocused(false);
    navigate({ to: "/", search: v ? { q: v } : {} });
  }

  function openMovie(id: number) {
    setSearchFocused(false);
    navigate({ to: "/movie/$id", params: { id: String(id) } });
  }

  function openTv(id: number) {
    setSearchFocused(false);
    navigate({ to: "/tv/$id", params: { id: String(id) } });
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success(t("logout_toast"));
  }

  const movies = (movieSuggestions.data ?? []).slice(0, 4) as MovieCard[];
  const tvShows = (tvSuggestions.data ?? []).slice(0, 3) as TvCard[];
  const hasResults = movies.length > 0 || tvShows.length > 0;
  const loading = movieSuggestions.isLoading || tvSuggestions.isLoading;

  return (
    <header dir={dir} className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/85">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={t("brand")}><Logo size={28} /></Link>
        <div
          className="relative flex-1 min-w-0 max-w-md mx-1 sm:mx-2"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
        >
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); submitSearch(q); }} className="relative" role="search">
            <Search className={`hidden sm:block absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t("search_placeholder")}
              dir="auto"
              aria-label={t("search_placeholder")}
              aria-expanded={showSuggestions}
              autoComplete="off"
              className="w-full bg-secondary/60 border border-border rounded-full py-2 px-3 sm:px-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-center"
            />
            {loading && showSuggestions && (
              <Loader2 className={`absolute ${dir === "rtl" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin`} />
            )}
          </form>

          {showSuggestions && (loading || hasResults || (!movieSuggestions.isFetching && !tvSuggestions.isFetching)) && (
            <div className={`absolute top-full mt-2 ${dir === "rtl" ? "right-0" : "left-0"} w-full min-w-[320px] overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl z-50`}>
              {hasResults ? (
                <div className="py-2">
                  {movies.map((movie) => (
                    <button key={`movie-${movie.id}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openMovie(movie.id)} className="w-full flex items-center gap-3 px-3 py-2 text-start hover:bg-secondary transition">
                      {movie.poster ? <img src={movie.poster} alt="" className="w-9 h-12 rounded-md object-cover shrink-0" loading="lazy" /> : <div className="w-9 h-12 rounded-md bg-secondary flex items-center justify-center shrink-0"><Film className="w-4 h-4 text-muted-foreground" /></div>}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{movie.title}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{dir === "rtl" ? "فيلم" : "Movie"}{movie.year ? ` · ${movie.year}` : ""}{movie.rating ? ` · ⭐ ${movie.rating}` : ""}</span>
                      </span>
                    </button>
                  ))}
                  {tvShows.map((show) => (
                    <button key={`tv-${show.id}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openTv(show.id)} className="w-full flex items-center gap-3 px-3 py-2 text-start hover:bg-secondary transition">
                      {show.poster ? <img src={show.poster} alt="" className="w-9 h-12 rounded-md object-cover shrink-0" loading="lazy" /> : <div className="w-9 h-12 rounded-md bg-secondary flex items-center justify-center shrink-0"><Tv className="w-4 h-4 text-muted-foreground" /></div>}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium truncate">{show.title}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{dir === "rtl" ? "مسلسل" : "TV"}{show.year ? ` · ${show.year}` : ""}{show.rating ? ` · ⭐ ${show.rating}` : ""}</span>
                      </span>
                    </button>
                  ))}
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => submitSearch(q)} className="w-full mt-1 border-t border-border px-3 pt-2 pb-1 text-center text-xs font-medium text-primary hover:bg-secondary/60 transition">
                    {dir === "rtl" ? `عرض كل النتائج لـ «${q.trim()}»` : `View all results for “${q.trim()}”`}
                  </button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{dir === "rtl" ? "جاري البحث..." : "Searching..."}</div>
              ) : (
                <div className="py-6 px-4 text-center text-sm text-muted-foreground">{dir === "rtl" ? "ما لقينا نتائج مطابقة" : "No matching results"}</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/collections" className="hidden xl:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"><LibraryBig className="w-4 h-4" />{dir === "rtl" ? "المجموعات" : "Collections"}</Link>
          <button onClick={() => navigate({ to: "/movie-night" })} className="hidden xl:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition" aria-label="Movie Night"><Sparkles className="w-4 h-4" />{dir === "rtl" ? "ليلة الفيلم" : "Movie Night"}</button>
          <button onClick={() => navigate({ to: "/pick" })} className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition" aria-label="Pick a movie"><Dices className="w-4 h-4" />{dir === "rtl" ? "اختارلي" : "Pick"}</button>
          <Link to="/discover" className="hidden lg:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"><Compass className="w-4 h-4" />{t("discover")}</Link>
          <button onClick={toggle} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition" aria-label="Switch language"><Languages className="w-4 h-4" /><span className="hidden sm:inline">{t("lang_switch")}</span></button>
          <ThemeToggle />
          {user ? <><Link to="/favorites" search={{ tab: "favorite" }} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition" aria-label={t("my_favorites")}><Heart className="w-4 h-4 text-primary" /><span className="hidden sm:inline">{t("my_favorites")}</span></Link><button onClick={handleSignOut} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition" aria-label={t("logout")}><LogOut className="w-4 h-4" /></button></> : <button onClick={() => navigate({ to: "/auth" })} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"><User className="w-4 h-4" /><span className="hidden sm:inline">{t("login")}</span></button>}
        </div>
      </div>
    </header>
  );
}
