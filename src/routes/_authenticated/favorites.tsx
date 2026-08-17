import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Heart, Star, Film, Bookmark, CheckCircle2, BarChart3, Tv as TvIcon } from "lucide-react";
import { listMyItems, type ListStatus } from "@/lib/user-lists.functions";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";

const searchSchema = z.object({
  tab: z.enum(["favorite", "watchlist", "watched"]).catch("favorite"),
});

export const Route = createFileRoute("/_authenticated/favorites")({
  validateSearch: (r) => searchSchema.parse(r),
  head: () => ({
    meta: [
      { title: "مفضلتي وقوائمي — فلمك" },
      { name: "description", content: "استعرض قائمتك المفضلة، قائمة المشاهدة لاحقاً، والأفلام التي شاهدتها في فلمك." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { dir, t } = useLocale();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["user-lists", tab],
    queryFn: () => listMyItems({ data: { status: tab } }),
  });

  const tabs: { key: ListStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "favorite", label: t("tab_favorites"), icon: <Heart className="w-4 h-4" />, color: "text-primary border-primary" },
    { key: "watchlist", label: t("tab_watchlist"), icon: <Bookmark className="w-4 h-4" />, color: "text-accent border-accent" },
    { key: "watched", label: t("tab_watched"), icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500 border-emerald-500" },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2"><Logo size={32} /></Link>
          <div className="flex items-center gap-2">
            <Link to="/stats" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("my_stats")}</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/50 mb-6 overflow-x-auto">
          {tabs.map((x) => (
            <button
              key={x.key}
              onClick={() => navigate({ to: "/favorites", search: { tab: x.key } })}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                tab === x.key ? x.color : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center"><Spinner size={64} label={t("loading")} /></div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-16">
            <img
              src="/icon-192.png"
              srcSet="/icon-192.png 1x, /icon-512.png 2x"
              decoding="async"
              alt={t("brand")}
              className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 opacity-80"
            />
            <p className="text-muted-foreground mb-4">{t("favorites_empty")}</p>
            <Link to="/" className="inline-block bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium">
              {t("discover")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.map((m) => (
              <Link
                key={m.id}
                to={m.media_type === "tv" ? "/tv/$id" : "/movie/$id"}
                params={{ id: String(m.media_id) }}
                className="group block"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                  {m.poster ? (
                    <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {m.media_type === "tv" ? <TvIcon className="w-8 h-8 text-muted-foreground" /> : <Film className="w-8 h-8 text-muted-foreground" />}
                    </div>
                  )}
                  {m.tmdb_rating != null && (
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {m.tmdb_rating}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-[10px] px-1.5 py-0.5 rounded-full">
                    {m.media_type === "tv" ? t("tv_series") : t("movie")}
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium truncate group-hover:text-primary transition">{m.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{m.year}</span>
                  {m.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-primary">
                      <Star className="w-3 h-3 fill-primary" />
                      {m.rating}
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
