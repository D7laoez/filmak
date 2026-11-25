import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, Clock, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";

export function BottomNav() {
  const { user } = useAuth();
  const { t } = useLocale();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as
    { tab?: string } | undefined;

  if (pathname === "/auth") return null;

  const isHome = pathname === "/";
  const isFav = pathname === "/favorites" && (!search?.tab || search.tab === "favorite");
  const isWatchlist = pathname === "/favorites" && search?.tab === "watchlist";
  const isStats = pathname === "/stats";

  const favTo = user ? "/favorites" : "/auth";
  const statsTo = user ? "/stats" : "/auth";

  const item = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-11 py-1.5 text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
      active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 pb-[max(env(safe-area-inset-bottom),0.25rem)]"
    >
      <div className="flex items-stretch max-w-md mx-auto">
        <Link
          to="/"
          className={item(isHome)}
          aria-label={t("brand")}
          aria-current={isHome ? "page" : undefined}
        >
          <Home className="w-5 h-5" aria-hidden />
          <span>{t("brand")}</span>
        </Link>
        <Link
          to={favTo}
          search={{ tab: "favorite" }}
          className={item(isFav)}
          aria-label={t("my_favorites")}
          aria-current={isFav ? "page" : undefined}
        >
          <Heart className={`w-5 h-5 ${isFav ? "fill-primary" : ""}`} aria-hidden />
          <span>{t("tab_favorites")}</span>
        </Link>
        <Link
          to={favTo}
          search={{ tab: "watchlist" }}
          className={item(isWatchlist)}
          aria-label={t("tab_watchlist")}
          aria-current={isWatchlist ? "page" : undefined}
        >
          <Clock className="w-5 h-5" aria-hidden />
          <span>{t("tab_watchlist")}</span>
        </Link>
        <Link
          to={statsTo}
          className={item(isStats)}
          aria-label={t("my_stats")}
          aria-current={isStats ? "page" : undefined}
        >
          <BarChart3 className="w-5 h-5" aria-hidden />
          <span>{t("my_stats")}</span>
        </Link>
      </div>
    </nav>
  );
}
