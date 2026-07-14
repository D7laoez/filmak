import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — Filmak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CatchAllPage,
});

function CatchAllPage() {
  const navigate = useNavigate();
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error") || url.searchParams.get("error_description");
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const isAuthReturn = Boolean(code || accessToken || refreshToken || error);

      if (!isAuthReturn) return;
      setIsCompletingAuth(true);

      try {
        if (code) await supabase.auth.exchangeCodeForSession(code);
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      } catch {
        // Leave broken/expired OAuth callback URLs instead of showing a 404.
      } finally {
        if (!cancelled) navigate({ to: "/", replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (isCompletingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground" dir="rtl">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          جارٍ إكمال تسجيل الدخول...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
          alt="Filmak"
          className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 opacity-90"
        />
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط اللي فتحته ما يقود لأي صفحة.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}