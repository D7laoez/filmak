import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/callback")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Filmak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const { dir } = useLocale();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code);
      } finally {
        if (!cancelled) navigate({ to: "/", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div dir={dir} className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        {dir === "rtl" ? "جارٍ إكمال تسجيل الدخول..." : "Completing sign in..."}
      </div>
    </div>
  );
}