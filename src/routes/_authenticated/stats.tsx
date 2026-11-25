import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Heart,
  Bookmark,
  CheckCircle2,
  Star,
  Film,
  Tv as TvIcon,
  Calendar,
} from "lucide-react";
import { getMyStats } from "@/lib/user-lists.functions";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "إحصائياتي — فلمك" },
      {
        name: "description",
        content:
          "شاهد ملخصاً لنشاطك السينمائي وإحصائيات الأفلام والمسلسلات التي تابعتها على منصة فلمك.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { dir, t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => getMyStats(),
  });

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/favorites"
              search={{ tab: "favorite" }}
              className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition"
            >
              <ArrowRight className="w-4 h-4" />
              {t("back")}
            </Link>
            <Logo size={32} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t("stats_title")}</h1>
        {isLoading || !data ? (
          <div className="py-12 flex items-center justify-center">
            <Spinner size={64} label={t("loading")} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Heart className="w-5 h-5" />}
                label={t("tab_favorites")}
                value={data.byStatus.favorite}
                accent="text-primary"
              />
              <StatCard
                icon={<Bookmark className="w-5 h-5" />}
                label={t("tab_watchlist")}
                value={data.byStatus.watchlist}
                accent="text-accent"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label={t("tab_watched")}
                value={data.byStatus.watched}
                accent="text-emerald-500"
              />
              <StatCard
                icon={<Star className="w-5 h-5 fill-current" />}
                label={t("total_items")}
                value={data.total}
                accent="text-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Film className="w-5 h-5" />}
                label={t("movies_count")}
                value={data.byType.movie}
                accent="text-primary"
              />
              <StatCard
                icon={<TvIcon className="w-5 h-5" />}
                label={t("tv_count")}
                value={data.byType.tv}
                accent="text-accent"
              />
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                label={t("top_year")}
                value={data.topYear ?? "—"}
                accent="text-foreground"
              />
              <div className="col-span-full">
                <StatCard
                  icon={<Star className="w-5 h-5 fill-current text-primary" />}
                  label={t("average_rating")}
                  value={data.averageRating != null ? `${data.averageRating} / 10` : "—"}
                  accent="text-primary"
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`flex items-center gap-2 text-xs mb-2 ${accent}`}>
        {icon}
        <span className="uppercase tracking-wide font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
