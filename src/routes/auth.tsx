import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Film, Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { dir, t } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setNotice(t("check_email"));
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div
      dir={dir}
      className="min-h-screen flex items-center justify-center bg-background text-foreground px-4"
    >
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center justify-center gap-3 mb-8">
          <img src="/icon-192.png" srcSet="/icon-192.png 1x, /icon-512.png 2x" decoding="async" alt={t("brand")} className="w-14 h-14 md:w-16 md:h-16" />
          <span className="text-2xl font-bold">{t("brand")}</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "signin" ? t("signin") : t("signup")}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth_sub")}
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white text-black rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              <GoogleIcon />
              {t("continue_google")}
            </button>
            <button
              onClick={() => handleOAuth("apple")}
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-black text-white border border-border rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              <AppleIcon />
              {t("continue_apple")}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            {t("or")}
            <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div className="relative">
              <Mail className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
              />
            </div>
            <div className="relative">
              <Lock className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? t("signin_btn") : t("signup_btn")}
            </button>
          </form>

          {error && <p className="mt-3 text-destructive text-sm text-center">{error}</p>}
          {notice && <p className="mt-3 text-primary text-sm text-center">{notice}</p>}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="w-full text-sm text-muted-foreground mt-5 hover:text-foreground transition"
          >
            {mode === "signin" ? t("no_account") : t("have_account")}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4">
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
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12-1.15.484-2.29 1.145-3.05.744-.83 2.005-1.46 3.019-1.6zm4.565 15.71c-.03.07-.463 1.58-1.518 3.15-.906 1.35-1.848 2.7-3.335 2.7-1.457 0-1.926-.83-3.608-.83-1.72 0-2.238.83-3.615.83-1.487 0-2.552-1.42-3.478-2.77-2.017-2.95-3.557-8.3-1.489-11.9 1.019-1.79 2.847-2.92 4.831-2.95 1.464-.02 2.844.98 3.741.98.912 0 2.583-1.21 4.348-1.04.734.03 2.788.31 4.108 2.32-.11.07-2.454 1.44-2.427 4.29.03 3.4 2.977 4.53 3.017 4.55z" />
    </svg>
  );
}