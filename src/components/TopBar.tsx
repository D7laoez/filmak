import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Heart, LogOut, User, Compass, Languages } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Shared sticky top bar used across secondary pages so the search and
 * sign-in controls remain visible while scrolling. The home and discover
 * routes render their own richer headers, so we hide this there.
 */
export function TopBar() {
  const { user } = useAuth();
  const { t, dir, toggle } = useLocale();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Home and Discover already render their own sticky headers.
  if (pathname === "/" || pathname === "/discover") return null;

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success(t("logout_toast"));
  }

  return (
    <header
      dir={dir}
      className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/85"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={t("brand")}>
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
            aria-label={t("search_placeholder")}
          >
            <Search className="w-4 h-4" />
          </Link>
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
                aria-label={t("my_favorites")}
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
  );
}