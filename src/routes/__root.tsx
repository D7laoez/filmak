import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  useNavigate,
  useLocation,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { createServerFn } from "@tanstack/react-start";
import { Loader2, Film, ShieldCheck, Heart, Sparkles, BookOpen, Mail, Scale } from "lucide-react";
import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { Toaster } from "sonner";
import { LocaleProvider, useT, useLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin.functions";
import { ThemeProvider } from "@/lib/theme";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AdBlockGate } from "@/components/AdBlockGate";
import { AdSlot } from "@/components/AdSlot";

import { safeJsonLd } from "@/lib/seo";

function NotFoundComponent() {
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
      const hp = new URLSearchParams(hash);
      const accessToken = hp.get("access_token");
      const refreshToken = hp.get("refresh_token");

      if (!code && !accessToken && !refreshToken && !error) return;
      setIsCompletingAuth(true);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const existing = await supabase.auth.getSession();
        if (!existing.data.session) {
          if (code) await supabase.auth.exchangeCodeForSession(code);
          else if (accessToken && refreshToken)
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
        }
      } catch {
        // Ignore invalid/expired auth callback params and redirect home
      } finally {
        if (!cancelled) navigate({ to: "/", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (isCompletingAuth)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          جارٍ إكمال تسجيل الدخول...
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي طلبته غير متوفر أو تم نقله.
        </p>
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
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

const getInitialLocale = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const cookie = getRequestHeader("cookie") ?? "";
  return /(?:^|;\\s*)filmak_locale=(ar|en)(?:;|$)/.exec(cookie)?.[1] === "en" ? "en" : "ar";
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const origin = await getRequestOrigin().catch(() => "https://filmak.site");
      const locale = await getInitialLocale();
      return { origin: origin || "https://filmak.site", locale };
    } catch {
      return { origin: "https://filmak.site", locale: "ar" as const };
    }
  },
  head: ({ loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const ogImage = origin ? `${origin}/icon-512.png` : "/icon-512.png";

    const websiteLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://filmak.site/",
      name: "فلمك — Filmak",
      inLanguage: ["ar", "en"],
      potentialAction: {
        "@type": "SearchAction",
        target: "https://filmak.site/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    };

    const organizationLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "فلمك — Filmak",
      url: "https://filmak.site/",
      logo: "https://filmak.site/icon-512.png",
      description:
        "منصة سينمائية عربية لاكتشاف وتحليل الأفلام والمسلسلات، تجمع بين أدوات الذكاء الاصطناعي وطبقة تحريرية أصلية ومختارات مشاهدة منظمة.",
    };

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0d0f17" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "فلمك" },
        { title: "فلمك — Filmak · دليل أفلام ومقالات سينمائية تحريرية" },
        {
          name: "description",
          content:
            "اكتشف أفضل الأفلام والمسلسلات التي تناسب ذوقك باستخدام الذكاء الاصطناعي والمراجعات التحريرية الأصلية.",
        },
        { property: "og:title", content: "فلمك — Filmak" },
        {
          property: "og:description",
          content:
            "منصة سينمائية ذكية لاكتشاف الأفلام والمسلسلات مع تحليلات نقدية وأدلة مشاهدة حصرية.",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "فلمك — Filmak" },
        { property: "og:image", content: ogImage },
        { property: "og:image:secure_url", content: ogImage },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:alt", content: "فلمك — Filmak" },
        { property: "og:image:width", content: "512" },
        { property: "og:image:height", content: "512" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "فلمك — Filmak" },
        {
          name: "twitter:description",
          content:
            "AI movie & series recommendations, editorial verdict scores, and viewing guides.",
        },
        { name: "twitter:image", content: ogImage },
        {
          name: "google-site-verification",
          content: "Ba8-EE-ouLI8m2vv00Ci4LWeeHuGdKKhDu4iW-sSwHg",
        },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://image.tmdb.org" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
        },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/icon-32.png", sizes: "32x32", type: "image/png" },
        { rel: "icon", href: "/icon-16.png", sizes: "16x16", type: "image/png" },
        { rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { rel: "icon", href: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
      scripts: [
        { type: "application/ld+json", children: safeJsonLd(websiteLd) },
        { type: "application/ld+json", children: safeJsonLd(organizationLd) },
        { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-0JV72533H2" },
        {
          children:
            "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-0JV72533H2');",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)filmak_locale=(ar|en)(?:;|$)/);var l=m?m[1]:'ar';var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var h=document.documentElement;h.lang=l;h.dir=l==='ar'?'rtl':'ltr';if(t==='dark')h.classList.add('dark');else h.classList.remove('dark');h.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { locale } = Route.useLoaderData();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        if (cancelled) return;
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") {
            if (typeof window !== "undefined" && window.location.pathname !== "/reset-password")
              window.location.replace(
                "/reset-password" + window.location.search + window.location.hash,
              );
            return;
          }
          if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
          router.invalidate();
          if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        // Auth listeners are non-critical for public page rendering.
      });

    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("type=recovery") && window.location.pathname !== "/reset-password")
        window.location.replace("/reset-password" + window.location.search + hash);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Ignore SW registration failure in restricted environments
        });
      }
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleProvider initialLocale={locale}>
          <RootContentWithLocale />
          <Toaster position="top-center" theme="dark" richColors />
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootContentWithLocale() {
  const { t, locale, dir } = useLocale();
  const { pathname } = useLocation();
  const ar = locale === "ar";

  const isPrivateRoute = [
    "/auth",
    "/reset-password",
    "/callback",
    "/favorites",
    "/watchlist",
    "/watched",
    "/stats",
    "/admin",
    "/messages",
  ].some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

  useEffect(() => {
    if (typeof window === "undefined" || isPrivateRoute) return;
    const socialBarSrc = "https://bancadeltempoidea.org/14/1c464a300c506375f159ae1863de50f8";
    if (!document.querySelector(`script[src="${socialBarSrc}"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.dataset.cfasync = "false";
      s.src = socialBarSrc;
      document.head.appendChild(s);
    }
  }, [pathname, isPrivateRoute]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const privatePrefixes = [
      "/auth",
      "/reset-password",
      "/callback",
      "/favorites",
      "/watchlist",
      "/watched",
      "/stats",
      "/admin",
      "/messages",
    ];
    if (
      privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
    ) {
      return;
    }

    let sessionId: string;
    try {
      sessionId = sessionStorage.getItem("filmak_analytics_session") ?? "";
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("filmak_analytics_session", sessionId);
      }
    } catch {
      sessionId = crypto.randomUUID();
    }

    let referrer: string | undefined;
    try {
      if (document.referrer) {
        const parsedReferrer = new URL(document.referrer);
        referrer = parsedReferrer.origin + parsedReferrer.pathname;
      }
    } catch {
      referrer = undefined;
    }

    void import("@/lib/site-analytics.functions")
      .then(({ recordSiteVisit }) =>
        recordSiteVisit({
          data: {
            path: pathname,
            sessionId,
            referrer,
          },
        }),
      )
      .catch(() => {
        // Analytics must never interfere with page navigation.
      });
  }, [pathname]);

  return (
    <>
      <TopBar />
      {!isPrivateRoute && pathname !== "/" && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <AdSlot key={`top-${pathname}`} placement={`top-${pathname}`} />
        </div>
      )}
      <Outlet />
      {!isPrivateRoute && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <AdSlot key={`bottom-${pathname}`} placement={`bottom-${pathname}`} />
        </div>
      )}
      {/* Comprehensive Trust & Editorial Footer */}
      <footer className="mt-auto border-t border-border/40 bg-card/40 py-16 px-4 pb-28 text-foreground">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand & About Statement */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <img src="/icon-192.png" alt="فلمك" className="w-8 h-8 rounded-lg" />
                <span className="font-black text-xl tracking-tight">
                  فلمك <span className="text-primary">Filmak</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ar
                  ? "منصة اكتشاف وتحليل سينمائي متكاملة، تجمع بين الترشيحات الذكية باللغة الطبيعية والمقالات النقدية وأدلة المشاهدة الأصلية المنتقاة بعناية."
                  : "An intelligent movie discovery and editorial platform combining natural-language AI recommendations with original editorial analysis and curated viewing guides."}
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{ar ? "محتوى تحريري مستقل وموثوق" : "Independent Editorial Curation"}</span>
              </div>
            </div>

            {/* Nav Column 1: Discover */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-foreground">{ar ? "استكشف" : "Discover"}</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-primary transition">
                    {ar ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link to="/discover" className="hover:text-primary transition">
                    {ar ? "تصفح الأفلام" : "Explore Movies"}
                  </Link>
                </li>
                <li>
                  <Link to="/collections" className="hover:text-primary transition">
                    {ar ? "مجموعات ومختارات" : "Collections"}
                  </Link>
                </li>
                <li>
                  <Link to="/movie-night" className="hover:text-primary transition">
                    {ar ? "ليلة الفيلم" : "Movie Night"}
                  </Link>
                </li>
                <li>
                  <Link to="/pick" className="hover:text-primary transition">
                    {ar ? "اختارلي فيلم" : "Random Pick"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Nav Column 2: Editorial & Magazine */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-foreground">
                {ar ? "المجلة والأدلة" : "Magazine & Guides"}
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/articles" className="hover:text-primary transition">
                    {ar ? "كل المقالات والأدلة" : "All Articles"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/articles/$slug"
                    params={{ slug: "movies-like-interstellar" }}
                    className="hover:text-primary transition"
                  >
                    {ar ? "أفلام مثل Interstellar" : "Like Interstellar"}
                  </Link>
                </li>
                <li>
                  <Link to="/editorial-policy" className="hover:text-primary transition">
                    {ar ? "معايير التقييم النقدية" : "Rating Criteria"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Nav Column 3: Trust & Legal */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-bold text-sm text-foreground">
                {ar ? "الشفافية والقانونية" : "Trust & Legal"}
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-primary transition">
                    {ar ? "من نحن" : "About Filmak"}
                  </Link>
                </li>
                <li>
                  <Link to="/editorial-policy" className="hover:text-primary transition">
                    {ar ? "السياسة التحريرية" : "Editorial Policy"}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition">
                    {ar ? "تواصل معنا" : "Contact Us"}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition">
                    {ar ? "سياسة الخصوصية" : "Privacy Policy"}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition">
                    {ar ? "شروط الاستخدام" : "Terms of Service"}
                  </Link>
                </li>
                <li>
                  <Link to="/dmca" className="hover:text-primary transition">
                    {ar ? "حقوق الملكية الفكرية (DMCA)" : "DMCA Policy"}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-primary transition">
                    {ar ? "الأسئلة الشائعة" : "FAQ"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* TMDB Notice & Copyright line */}
          <div className="border-t border-border/40 pt-8 space-y-3 text-center text-xs text-muted-foreground">
            <p className="leading-relaxed max-w-3xl mx-auto opacity-80">
              {ar
                ? "يستخدم هذا الموقع واجهة برمجة تطبيقات The Movie Database (TMDB) للحصول على البيانات الوصفية والإحصائية العامة، ولكنه غير معتمد أو مصدق عليه من قبل TMDB. المقالات التحريرية وحكم فلمك هي محتوى أصلي خاص."
                : "This product uses the TMDB API for factual metadata but is not endorsed or certified by TMDB. Editorial reviews, verdict ratings, and curated guides are original creations of FILMAK."}
            </p>
            <p>
              © {new Date().getFullYear()} فلمك — Filmak.{" "}
              {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
      <BottomNav />
      <AdBlockGate />
    </>
  );
}
