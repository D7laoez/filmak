import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LocaleProvider, useT } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin.functions";
import { ThemeProvider } from "@/lib/theme";
import { BottomNav } from "@/components/BottomNav";

function NotFoundComponent() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
          alt={t("brand")}
          className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 opacity-90"
        />
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("page_not_found_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("page_not_found_sub")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("go_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
          alt={t("brand")}
          className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-90"
        />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error_sub")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("go_home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    const origin = await getRequestOrigin();
    return { origin };
  },
  head: ({ loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const ogImage = origin ? `${origin}/icon-512.png` : "/icon-512.png";
    const adsenseClient =
      (import.meta as unknown as { env: Record<string, string | undefined> }).env
        .VITE_ADSENSE_CLIENT_ID || "ca-pub-2237012686036777";
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0b0b12" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "فيلمك" },
      { title: "فيلمك — Filmak · AI movie recommender" },
      {
        name: "description",
        content: "اكتشف أفلاماً ومسلسلات تناسب مزاجك بالذكاء الاصطناعي. Discover movies and series that match your mood with AI, in Arabic and English.",
      },
      { property: "og:title", content: "فيلمك — Filmak" },
      {
        property: "og:description",
        content: "Describe what you want to watch, and AI finds the best movies and series for you. متاح بالعربية والإنجليزية.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "فيلمك — Filmak" },
      { property: "og:image", content: ogImage },
      { property: "og:image:secure_url", content: ogImage },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:alt", content: "فيلمك — Filmak" },
      { property: "og:image:width", content: "512" },
      { property: "og:image:height", content: "512" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "فيلمك — Filmak" },
      { name: "twitter:description", content: "AI movie & series recommendations in Arabic and English." },
      { name: "twitter:image", content: ogImage },
      { name: "google-site-verification", content: "Ba8-EE-ouLI8m2vv00Ci4LWeeHuGdKKhDu4iW-sSwHg" },
      ...(adsenseClient ? [{ name: "google-adsense-account", content: adsenseClient }] : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", href: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: adsenseClient
      ? [
          {
            async: true,
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`,
            crossOrigin: "anonymous",
          },
        ]
      : [],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <BottomNav />
          <Toaster position="top-center" theme="dark" richColors />
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
