import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/callback")({
  head: () => ({
    meta: [
      { title: "جارٍ التحقق — فلمك | Completing sign in — Filmak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const { dir } = useLocale();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL(window.location.href);
        const authError =
          url.searchParams.get("error_description") || url.searchParams.get("error");
        if (authError) throw new Error(authError);
        const code = url.searchParams.get("code");
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          if (result.error) throw result.error;
        } else if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (result.error) throw result.error;
        }
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("No session created");
        if (!cancelled) navigate({ to: "/", replace: true });
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error)
    return (
      <div
        dir={dir}
        className="min-h-screen flex items-center justify-center bg-background text-foreground px-4"
      >
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-4 w-8 h-8 text-destructive" />
          <h1 className="font-bold text-xl">
            {dir === "rtl" ? "تعذر إكمال تسجيل الدخول" : "Couldn't complete sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dir === "rtl"
              ? "ارجع إلى صفحة تسجيل الدخول وحاول مرة أخرى."
              : "Return to sign in and try again."}
          </p>
          <button
            onClick={() => navigate({ to: "/auth", replace: true })}
            className="mt-6 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold"
          >
            {dir === "rtl" ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </button>
        </div>
      </div>
    );
  return (
    <div
      dir={dir}
      className="min-h-screen flex items-center justify-center bg-background text-foreground px-4"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        {dir === "rtl" ? "جارٍ إكمال تسجيل الدخول..." : "Completing sign in..."}
      </div>
    </div>
  );
}
