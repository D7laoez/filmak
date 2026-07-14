import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — Filmak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { dir, t } = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Handle recovery link: PKCE (?code=...) or hash tokens (#access_token=...&type=recovery)
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
          setReady(true);
          return;
        }
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            window.history.replaceState({}, "", url.pathname + url.search);
            setReady(true);
            return;
          }
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) setReady(true);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const target = resendEmail.trim();
    if (!target.includes("@")) {
      setError(dir === "rtl" ? "أدخل بريدك الإلكتروني" : "Enter your email");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setNotice(
        dir === "rtl"
          ? "أرسلنا رابطاً جديداً إلى بريدك"
          : "We sent a new reset link to your email",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError(dir === "rtl" ? "كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(dir === "rtl" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNotice(dir === "rtl" ? "تم تحديث كلمة المرور" : "Password updated");
      // One-shot: end the recovery session and send them to sign-in.
      await supabase.auth.signOut();
      setTimeout(() => navigate({ to: "/auth" }), 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={dir} className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center justify-center gap-3 mb-8">
          <img src="/icon-192.png" alt={t("brand")} className="w-14 h-14 md:w-16 md:h-16" />
          <span className="text-2xl font-bold">{t("brand")}</span>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-1">
            {dir === "rtl" ? "كلمة مرور جديدة" : "New password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {dir === "rtl" ? "أدخل كلمة المرور الجديدة" : "Set a new password for your account"}
          </p>
          {!ready ? (
            <form onSubmit={handleResend} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                {dir === "rtl"
                  ? "الرابط منتهي أو غير صالح؟ أدخل بريدك لإرسال رابط جديد."
                  : "Link expired or invalid? Enter your email to receive a new one."}
              </p>
              <div className="relative">
                <Mail className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder={dir === "rtl" ? "بريدك الإلكتروني" : "Your email"}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {resending && <Loader2 className="w-4 h-4 animate-spin" />}
                {dir === "rtl" ? "إرسال رابط جديد" : "Send new link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dir === "rtl" ? "كلمة المرور الجديدة" : "New password"}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
              <div className="relative">
                <Lock className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={dir === "rtl" ? "تأكيد كلمة المرور" : "Confirm password"}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {dir === "rtl" ? "تحديث كلمة المرور" : "Update password"}
              </button>
            </form>
          )}
          {ready && (
            <form onSubmit={handleResend} className="mt-4 pt-4 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                {dir === "rtl" ? "لم يعمل الرابط؟ أرسل واحداً جديداً" : "Link not working? Send a new one"}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder={dir === "rtl" ? "بريدك الإلكتروني" : "Your email"}
                  className="flex-1 bg-secondary/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="inline-flex items-center justify-center gap-2 bg-secondary text-foreground rounded-xl px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : (dir === "rtl" ? "إعادة إرسال" : "Resend")}
                </button>
              </div>
            </form>
          )}
          {error && <p className="mt-3 text-destructive text-sm text-center">{error}</p>}
          {notice && <p className="mt-3 text-primary text-sm text-center">{notice}</p>}
        </div>
      </div>
    </div>
  );
}