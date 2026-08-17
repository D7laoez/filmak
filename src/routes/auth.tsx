import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Film, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — فلمك | Sign in — Filmak" },
      { name: "description", content: "سجّل دخولك إلى فلمك لحفظ المفضلة وقائمة المشاهدة والحصول على تجربة شخصية." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { t, dir } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAr = dir === "rtl";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message || t("error_generic"));
      setLoading(false);
    }
  }

  return (
    <div dir={dir} lang={isAr ? "ar" : "en"} className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground">
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute top-5 start-5 z-20 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md hover:text-foreground hover:border-primary/40 transition"
        aria-label={t("go_home")}
      >
        <BackIcon className="w-4 h-4" />
        <span>{t("go_home")}</span>
      </button>

      <div className="min-h-full grid lg:grid-cols-[1.15fr_.85fr]">
        <aside className="relative hidden lg:block overflow-hidden border-e border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,hsl(var(--primary)/.28),transparent_42%),radial-gradient(circle_at_80%_85%,hsl(var(--accent)/.18),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[.035] bg-[linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"><Film className="w-5 h-5 text-primary-foreground" /></div>
              <span className="text-2xl font-black tracking-tight">{t("brand")}</span>
            </div>
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs text-primary bg-primary/10 border border-primary/20"><Sparkles className="w-3.5 h-3.5" />{t("tagline_ai")}</div>
              <h1 className="text-5xl xl:text-6xl leading-[1.05] tracking-tight mb-6 font-black">{t("hero_1")}<br /><span className="text-primary">{t("hero_2")}</span></h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">{t("auth_sub")}. {t("hero_sub")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4" />{t("data_protection")}</div>
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-6 py-20 lg:px-12">
          <div className="absolute top-6 start-6 lg:hidden flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-accent"><Film className="w-4 h-4 text-primary-foreground" /></div><span className="text-lg font-black">{t("brand")}</span></div>
          <div className="w-full max-w-sm">
            <div className="mb-9">
              <div className="text-xs uppercase tracking-[.2em] text-primary mb-3">{t("signin")}</div>
              <h2 className="text-3xl font-black tracking-tight mb-3">{t("signin")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("auth_sub")}</p>
            </div>

            <button onClick={handleGoogle} disabled={loading} className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-60 transition-all shadow-xl hover:-translate-y-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
              <span>{t("continue_google")}</span>
            </button>

            {error && <div role="alert" className="mt-4 text-sm text-destructive rounded-xl px-4 py-3 bg-destructive/10 border border-destructive/20">{error}</div>}

            <div className="flex items-center gap-3 my-8" aria-hidden><span className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">{t("tagline_ai")}</span><span className="h-px flex-1 bg-border" /></div>

            <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-primary" />{t("favorites_title")}</li>
              <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-primary" />{t("auth_sub")}</li>
              <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-primary" />{t("data_protection")}</li>
            </ul>

            <p className="mt-10 text-[11px] text-muted-foreground/70 leading-relaxed">{t("privacy_content")}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
