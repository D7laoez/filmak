import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Heart, Compass, Languages, LogOut, User, Dices, Sparkles, LibraryBig, Loader2, Film, Tv, Menu, X } from "lucide-react";
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
  const [q, setQ] = useState(search?.q ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState(search?.q ?? "");

  useEffect(() => { setQ(search?.q ?? ""); }, [search?.q]);
  useEffect(() => {
    const value = q.trim();
    const timer = window.setTimeout(() => setDebouncedQ(value), 300);
    return () => window.clearTimeout(timer);
  }, [q]);
  useEffect(() => { setMobileMenu(false); }, [pathname]);

  if (pathname === "/auth") return null;

  const showSuggestions = searchFocused && debouncedQ.length >= 2;
  const movieSuggestions = useQuery({ queryKey: ["topbar-search-movies", debouncedQ, locale], queryFn: () => searchMovies({ data: { q: debouncedQ, lang: locale } }), enabled: showSuggestions, staleTime: 60_000, gcTime: 5 * 60_000 });
  const tvSuggestions = useQuery({ queryKey: ["topbar-search-tv", debouncedQ, locale], queryFn: () => searchTv({ data: { q: debouncedQ, lang: locale } }), enabled: showSuggestions, staleTime: 60_000, gcTime: 5 * 60_000 });

  const submitSearch = (value: string) => { const v = value.trim(); setSearchFocused(false); setMobileMenu(false); navigate({ to: "/", search: v ? { q: v } : {} }); };
  const openMovie = (id: number) => { setSearchFocused(false); navigate({ to: "/movie/$id", params: { id: String(id) } }); };
  const openTv = (id: number) => { setSearchFocused(false); navigate({ to: "/tv/$id", params: { id: String(id) } }); };
  const handleSignOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); toast.success(t("logout_toast")); };

  const movies = (movieSuggestions.data ?? []).slice(0, 4) as MovieCard[];
  const tvShows = (tvSuggestions.data ?? []).slice(0, 3) as TvCard[];
  const hasResults = movies.length > 0 || tvShows.length > 0;
  const loading = movieSuggestions.isLoading || tvSuggestions.isLoading;

  return (
    <header dir={dir} className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-2 px-3 py-2 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label={t("brand")}><Logo size={28} /></Link>
        <div className="relative min-w-0 flex-1 sm:max-w-md sm:mx-2" onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); submitSearch(q); }} className="relative" role="search">
            <Search className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none`} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setSearchFocused(true)} placeholder={t("search_placeholder")} dir="auto" aria-label={t("search_placeholder")} aria-expanded={showSuggestions} autoComplete="off" className="h-10 w-full rounded-full border border-border bg-secondary/60 px-9 text-sm outline-none focus:ring-2 focus:ring-primary/50 sm:h-9 sm:px-10" />
            {loading && showSuggestions && <Loader2 className={`absolute ${dir === "rtl" ? "left-3" : "right-3"} top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground`} />}
          </form>
          {showSuggestions && <div className={`absolute top-full z-50 mt-2 ${dir === "rtl" ? "right-0" : "left-0"} w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl backdrop-blur-xl`}>
            {hasResults ? <div className="max-h-[60vh] overflow-y-auto py-2">
              {movies.map((movie) => <button key={`movie-${movie.id}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openMovie(movie.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start hover:bg-secondary transition"><img src={movie.poster ?? ""} alt="" className="h-12 w-9 shrink-0 rounded-md object-cover" loading="lazy" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{movie.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{dir === "rtl" ? "فيلم" : "Movie"}{movie.year ? ` · ${movie.year}` : ""}</span></span></button>)}
              {tvShows.map((show) => <button key={`tv-${show.id}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openTv(show.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start hover:bg-secondary transition"><img src={show.poster ?? ""} alt="" className="h-12 w-9 shrink-0 rounded-md object-cover" loading="lazy" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{show.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{dir === "rtl" ? "مسلسل" : "TV"}{show.year ? ` · ${show.year}` : ""}</span></span></button>)}
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => submitSearch(q)} className="w-full border-t border-border px-3 py-3 text-center text-xs font-medium text-primary hover:bg-secondary/60">{dir === "rtl" ? `عرض كل النتائج لـ «${q.trim()}»` : `View all results for “${q.trim()}”`}</button>
            </div> : loading ? <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{dir === "rtl" ? "جاري البحث..." : "Searching..."}</div> : <div className="px-4 py-6 text-center text-sm text-muted-foreground">{dir === "rtl" ? "ما لقينا نتائج مطابقة" : "No matching results"}</div>}
          </div>}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/collections" className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs hover:bg-secondary"><LibraryBig className="h-4 w-4" />{dir === "rtl" ? "المجموعات" : "Collections"}</Link>
          <button onClick={() => navigate({ to: "/movie-night" })} className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary"><Sparkles className="h-4 w-4" />{dir === "rtl" ? "ليلة الفيلم" : "Movie Night"}</button>
          <button onClick={() => navigate({ to: "/pick" })} className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary"><Dices className="h-4 w-4" />{dir === "rtl" ? "اختارلي" : "Pick"}</button>
          <Link to="/discover" className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs hover:bg-secondary"><Compass className="h-4 w-4" />{t("discover")}</Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={toggle} className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs" aria-label="Switch language"><Languages className="h-4 w-4" /><span>{t("lang_switch")}</span></button>
          <ThemeToggle />
          {user ? <><Link to="/favorites" search={{ tab: "favorite" }} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-secondary/60 px-2" aria-label={t("my_favorites")}><Heart className="h-4 w-4 text-primary" /><span className="hidden lg:inline ml-1">{t("my_favorites")}</span></Link><button onClick={handleSignOut} className="hidden sm:inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-secondary/60 px-2" aria-label={t("logout")}><LogOut className="h-4 w-4" /></button></> : <button onClick={() => navigate({ to: "/auth" })} className="hidden sm:inline-flex min-h-9 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"><User className="h-4 w-4" /><span>{t("login")}</span></button>}
          <button onClick={() => setMobileMenu((v) => !v)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-secondary/60 md:hidden" aria-label={mobileMenu ? "Close menu" : "Open menu"} aria-expanded={mobileMenu}>{mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {mobileMenu && <div className="border-t border-border/40 bg-background/95 px-3 py-3 shadow-lg backdrop-blur md:hidden">
        <nav className="grid grid-cols-2 gap-2" aria-label="Mobile navigation">
          <Link to="/discover" className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm">{t("discover")}</Link>
          <Link to="/collections" className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-sm">{dir === "rtl" ? "المجموعات" : "Collections"}</Link>
          <button onClick={() => navigate({ to: "/movie-night" })} className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-3 text-start text-sm text-primary">{dir === "rtl" ? "✨ ليلة الفيلم" : "✨ Movie Night"}</button>
          <button onClick={() => navigate({ to: "/pick" })} className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-3 text-start text-sm text-primary">{dir === "rtl" ? "🎲 اختارلي" : "🎲 Pick"}</button>
          <button onClick={toggle} className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-start text-sm">{t("lang_switch")}</button>
          {user ? <button onClick={handleSignOut} className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-start text-sm">{t("logout")}</button> : <button onClick={() => navigate({ to: "/auth" })} className="rounded-xl bg-primary px-3 py-3 text-start text-sm text-primary-foreground">{t("login")}</button>}
        </nav>
      </div>}
    </header>
  );
}
