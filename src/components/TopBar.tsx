import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Search, Heart, Compass, Languages, LogOut, User, Dices, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopBar() {
  const { user } = useAuth();
  const { t, dir, toggle } = useLocale();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as { q?: string } | undefined;
  const [q, setQ] = useState<string>(search?.q ?? "");
  useEffect(() => { setQ(search?.q ?? ""); }, [search?.q]);
  if (pathname === "/auth") return null;
  function submitSearch(value: string) { const v = value.trim(); navigate({ to: "/", search: v ? { q: v } : {} }); }
  async function handleSignOut() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); toast.success(t("logout_toast")); }
  return (
    <header dir={dir} className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/85">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={t("brand")}><Logo size={28} /></Link>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); submitSearch(q); }} className="relative flex-1 min-w-0 max-w-md mx-1 sm:mx-2" role="search">
          <Search className={`hidden sm:block absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} dir="auto" aria-label={t("search_placeholder")} className="w-full bg-secondary/60 border border-border rounded-full py-2 px-3 sm:px-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-center" />
        </form>
        <div className="flex items-center gap-2 shrink-0">
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
