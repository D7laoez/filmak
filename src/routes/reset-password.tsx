import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";
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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
      setTimeout(() => navigate({ to: "/" }), 1200);
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
            <p className="text-sm text-muted-foreground text-center">
              {dir === "rtl" ? "افتح الرابط من بريدك للمتابعة." : "Open the link from your email to continue."}
            </p>
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
          {error && <p className="mt-3 text-destructive text-sm text-center">{error}</p>}
          {notice && <p className="mt-3 text-primary text-sm text-center">{notice}</p>}
        </div>
      </div>
    </div>
  );
}