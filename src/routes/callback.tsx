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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled && session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/", replace: true });
      }
    });

    (async () => {
      try {
        const url = new URL(window.location.href);
        const authError =
          url.searchParams.get("error_description") || url.searchParams.get("error");
        if (authError) throw new Error(authError);

        // First check if supabase-js detectSessionInUrl already created the session
        const initial = await supabase.auth.getSession();
        if (initial.data.session) {
          if (!cancelled) navigate({ to: "/", replace: true });
          return;
        }

        const code = url.searchParams.get("code");
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          if (result.error) {
            // Re-check in case detectSessionInUrl completed concurrently
            const retry = await supabase.auth.getSession();
            if (!retry.data.session) throw result.error;
          }
        } else if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (result.error) throw result.error;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error(
            dir === "rtl"
              ? "لم يتم إنشاء جلسة دخول. تأكد من تفعيل رابط العودة في Supabase."
              : "No session created. Verify callback URL in Supabase Auth settings.",
          );
        }
        if (!cancelled) navigate({ to: "/", replace: true });
      } catch (err) {
        if (!cancelled) {
          setErrorMsg((err as Error).message || "Authentication failed");
        }
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, dir]);

  if (errorMsg)
    return (
      <div
        dir={dir}
        className="min-h-screen flex items-center justify-center bg-background text-foreground px-4"
      >
        <div className="max-w-sm text-center space-y-3">
          <AlertCircle className="mx-auto w-8 h-8 text-destructive" />
          <h1 className="font-bold text-xl">
            {dir === "rtl" ? "تعذر إكمال تسجيل الدخول" : "Couldn't complete sign in"}
          </h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/auth", replace: true })}
            className="mt-4 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold cursor-pointer"
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
