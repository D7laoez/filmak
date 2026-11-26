import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Film,
  ShieldCheck,
  Mail,
  Lock,
  UserPlus,
  LogIn,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — فلمك | Sign in — Filmak" },
      {
        name: "description",
        content: "سجّل دخولك إلى فلمك لحفظ المفضلة وقائمة المشاهدة والحصول على تجربة شخصية.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { t, dir } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isAr = dir === "rtl";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleEmailAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim();
    if (!cleanEmail.includes("@")) {
      setError(isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError(
        isAr
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
          : "Password must be at least 6 characters.",
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInErr) throw signInErr;
        toast.success(isAr ? "مرحباً بك في فلمك!" : "Welcome back to Filmak!");
        navigate({ to: "/", replace: true });
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback`,
          },
        });
        if (signUpErr) throw signUpErr;
        if (data.session) {
          toast.success(isAr ? "تم إنشاء حسابك في فلمك!" : "Your Filmak account is ready!");
          navigate({ to: "/", replace: true });
        } else {
          setNotice(
            isAr
              ? "تم إرسال رابط تأكيد إلى بريدك الإلكتروني لإكمال التسجيل في فلمك."
              : "Check your email for a confirmation link to activate your Filmak account.",
          );
        }
      }
    } catch (e) {
      setError((e as Error).message || t("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim();
    if (!cleanEmail.includes("@")) {
      setError(
        isAr
          ? "اكتب بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور."
          : "Enter your email first, then click Forgot Password.",
      );
      return;
    }
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetErr) throw resetErr;
      setNotice(
        isAr
          ? "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني."
          : "Password reset link sent to your email.",
      );
    } catch (e) {
      setError((e as Error).message || t("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setGoogleLoading(true);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthErr) throw oauthErr;
    } catch (e) {
      setError((e as Error).message || t("error_generic"));
      setGoogleLoading(false);
    }
  }

  return (
    <div
      dir={dir}
      lang={isAr ? "ar" : "en"}
      className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground"
    >
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="absolute top-5 start-5 z-20 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md hover:text-foreground hover:border-primary/40 transition cursor-pointer"
        aria-label={t("go_home")}
      >
        <BackIcon className="w-4 h-4" />
        <span>{t("go_home")}</span>
      </button>

      <div className="min-h-full grid lg:grid-cols-[1.1fr_.9fr]">
        <aside className="relative hidden lg:block overflow-hidden border-e border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,hsl(var(--primary)/.22),transparent_45%),radial-gradient(circle_at_80%_85%,hsl(var(--accent)/.14),transparent_38%)]" />
          <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary shadow-lg shadow-primary/20">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                فلمك <span className="text-primary">Filmak</span>
              </span>
            </div>
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs text-primary bg-primary/10 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                {t("tagline_ai")}
              </div>
              <h1 className="text-5xl xl:text-6xl leading-[1.08] tracking-tight mb-6 font-black">
                {t("hero_1")}
                <br />
                <span className="text-primary">{t("hero_2")}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                {t("auth_sub")}. {t("hero_sub")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t("data_protection")}
            </div>
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-6 py-20 lg:px-12">
          <div className="absolute top-6 start-6 lg:hidden flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary">
              <Film className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-black">
              فلمك <span className="text-primary">Filmak</span>
            </span>
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.15em] text-primary mb-2">
                {isAr ? "حساب فلمك — filmak.site" : "Filmak Account — filmak.site"}
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                {mode === "signin" ? t("signin") : isAr ? "إنشاء حساب جديد" : "Create Account"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("auth_sub")}</p>
            </div>

            {/* Mode switcher */}
            <div className="grid grid-cols-2 rounded-2xl bg-secondary/70 p-1 border border-border">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setNotice(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  mode === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setNotice(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isAr ? "حساب جديد" : "Sign Up"}
              </button>
            </div>

            {/* Direct Filmak Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  {isAr ? "البريد الإلكتروني" : "Email address"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[44px] rounded-xl border border-border bg-card ps-10 pe-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isAr ? "كلمة المرور" : "Password"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] rounded-xl border border-border bg-card ps-10 pe-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-primary/20 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === "signin" ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>
                  {mode === "signin"
                    ? isAr
                      ? "دخول إلى فلمك"
                      : "Sign in to Filmak"
                    : isAr
                      ? "إنشاء حساب في فلمك"
                      : "Create Filmak Account"}
                </span>
              </button>
            </form>

            {error && (
              <div
                role="alert"
                className="text-sm text-destructive rounded-xl px-4 py-3 bg-destructive/10 border border-destructive/20"
              >
                {error}
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="text-sm text-primary rounded-xl px-4 py-3 bg-primary/10 border border-primary/25"
              >
                {notice}
              </div>
            )}

            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">
                {isAr ? "أو المتابعة عبر" : "or continue with"}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:border-primary/40 hover:bg-secondary/50 disabled:opacity-60 transition cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden>
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              )}
              <span>{t("continue_google")}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
