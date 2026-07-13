import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
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
  const search = useRouterState({ select: (s) => s.location.search }) as
    | { q?: string }
    | undefined;

  // Home has its own richer header (with tabs + hero). Show TopBar everywhere else.
  const isHome = pathname === "/";
  const [q, setQ] = useState<string>(search?.q ?? "");

  // Keep the input in sync when the URL changes from elsewhere.
  useEffect(() => {
    if (!isHome) setQ(search?.q ?? "");
  }, [search?.q, isHome]);

  if (isHome) return null;

  function submitSearch(value: string) {
    const v = value.trim();
    navigate({ to: "/", search: v ? { q: v } : {} });
  }

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
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={t("brand")}>
          <Logo size={28} />
        </Link>

        {/* Inline search — submits to home with ?q= */}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            submitSearch(q);
          }}
          className="relative flex-1 max-w-md mx-2"
          role="search"
        >
          <Search
            className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            dir="auto"
            aria-label={t("search_placeholder")}
            className={`w-full bg-secondary/60 border border-border rounded-full py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
            aria-label="Switch language"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{t("lang_switch")}</span>
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
                className="hidden sm:inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
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