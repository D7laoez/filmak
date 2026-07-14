import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Sparkles, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Filmak" },
      { name: "description", content: "سجّل دخولك أو أنشئ حساباً في فلمك." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      setError((e as Error).message || "تعذر تسجيل الدخول");
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{
        background: "#1a1a1a",
        colorScheme: "dark",
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
        aria-label="الرجوع للرئيسية"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>الرئيسية</span>
      </button>

      <div className="min-h-full grid lg:grid-cols-[3fr_2fr]">
        <aside className="relative hidden lg:block overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(1000px 700px at 20% 30%, rgba(232,93,58,0.35), transparent 60%), radial-gradient(700px 500px at 80% 90%, rgba(232,93,58,0.18), transparent 55%), linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 55%, #1a1a1a 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div
            className="absolute -right-24 top-1/3 h-[420px] w-[520px] rounded-full blur-3xl opacity-70"
            style={{ background: "radial-gradient(closest-side, #e85d3a, transparent 70%)" }}
          />

          <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #e85d3a, #b8391a)" }}
              >
                <Film className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="text-2xl text-white tracking-tight"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
              >
                فلمك
              </span>
            </div>

            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs text-[#e85d3a]"
                style={{ background: "rgba(232,93,58,0.12)", border: "1px solid rgba(232,93,58,0.3)" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مدعوم بالذكاء الاصطناعي</span>
              </div>
              <h1
                className="text-white text-5xl xl:text-6xl leading-[1.05] tracking-tight mb-6"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
              >
                لقّي فلم يشبه
                <br />
                <span style={{ color: "#e85d3a" }}>مزاجك</span> بالضبط.
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-md">
                سجّل دخولك بحساب Google لحفظ مفضلتك وقائمة المشاهدة عبر أجهزتك، وتخصيص الترشيحات لك.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-white/40">
              <span>© فلمك</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>خصوصيتك أولاً</span>
            </div>
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-6 py-16 lg:px-12" style={{ background: "#2d2d2d" }}>
          <div className="absolute top-6 right-6 lg:hidden flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #e85d3a, #b8391a)" }}
            >
              <Film className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-lg text-white"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
            >
              فلمك
            </span>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-10">
              <div
                className="text-xs uppercase tracking-[0.2em] text-[#e85d3a] mb-3"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
              >
                Sign in
              </div>
              <h2
                className="text-white text-3xl mb-3 tracking-tight"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                أهلاً بك من جديد
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                طريقة وحدة، بدون كلمات مرور. اضغط الزر وخلص.
              </p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="group w-full relative inline-flex items-center justify-center gap-3 rounded-xl py-4 text-sm font-semibold bg-white text-[#1a1a1a] hover:bg-white/95 disabled:opacity-60 transition-all shadow-[0_10px_40px_-10px_rgba(232,93,58,0.5)] hover:shadow-[0_14px_50px_-8px_rgba(232,93,58,0.7)] hover:-translate-y-0.5"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              <span>الدخول بحساب Google</span>
            </button>

            {error && (
              <div
                className="mt-4 text-sm text-[#ffb4a2] rounded-lg px-3 py-2.5"
                style={{ background: "rgba(232,93,58,0.1)", border: "1px solid rgba(232,93,58,0.25)" }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 my-8" aria-hidden>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">آمن وسريع</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <ul className="space-y-3 text-xs text-white/50 leading-relaxed">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#e85d3a" }} />
                مفضلتك وقائمة مشاهدتك تتحفظ عبر كل أجهزتك.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#e85d3a" }} />
                ترشيحات ذكية مبنية على ذوقك بالفعل.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#e85d3a" }} />
                لا نصل لإيميلك ولا نرسل رسائل ترويجية.
              </li>
            </ul>

            <p className="mt-10 text-[11px] text-white/30 leading-relaxed">
              بمواصلتك فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}