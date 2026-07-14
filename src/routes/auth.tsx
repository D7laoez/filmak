import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Filmak" },
      {
        name: "description",
        content: "سجّل دخولك أو أنشئ حساباً في فلمك.",
      },
      { name: "robots", content: "noindex, nofollow" },
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
      });
      if (result.error) throw result.error;
      if (result.redirected) return; // browser is redirecting
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
      className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(139,92,246,0.18), transparent 55%), #0b0e1a",
        colorScheme: "dark",
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/icon-192.png"
            srcSet="/icon-192.png 1x, /icon-512.png 2x"
            alt="Filmak"
            className="w-16 h-16"
            decoding="async"
          />
          <span className="text-2xl font-bold text-white">فلمك</span>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl bg-[#0f1324]/90 backdrop-blur border border-white/10 text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">تسجيل الدخول</h1>
          <p className="text-sm text-white/60 mb-8">
            سجّل دخولك بحساب Google لحفظ مفضلتك وقائمة المشاهدة عبر أجهزتك.
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-semibold bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-60 transition shadow-lg"
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

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <p className="mt-6 text-xs text-white/40 leading-relaxed">
            بتسجيلك تُخوّل فلمك بحفظ مفضلتك وقائمة المشاهدة على حسابك. لن نصل إلى إيميلك بأي طريقة أخرى.
          </p>
        </div>
      </div>
    </div>
  );
}
