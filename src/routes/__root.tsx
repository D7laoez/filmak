import { QueryClient, QueryClientProvider } from "@tanstack/react-query";import {Outlet,Link,useNavigate,createRootRouteWithContext,useRouter,HeadContent,Scripts,} from "@tanstack/react-router";import { useEffect, useState, type ReactNode } from "react";import { Loader2 } from "lucide-react";

import appCss from "../styles.css?url";import { reportLovableError } from "../lib/lovable-error-reporting";import { Toaster } from "sonner";import { supabase } from "@/integrations/supabase/client";import { LocaleProvider, useT } from "@/lib/i18n";import { getRequestOrigin } from "@/lib/origin.functions";import { ThemeProvider } from "@/lib/theme";import { BottomNav } from "@/components/BottomNav";import { TopBar } from "@/components/TopBar";

function NotFoundComponent() {const navigate = useNavigate();const [isCompletingAuth, setIsCompletingAuth] = useState(false);

useEffect(() => {let cancelled = false;

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
    // Even if the token is expired/invalid, leave the broken callback URL.
  } finally {
    if (!cancelled) navigate({ to: "/", replace: true });
  }
})();

return () => {
  cancelled = true;
};

}, [navigate]);

if (isCompletingAuth) {return (<div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin text-primary" />جارٍ إكمال تسجيل الدخول...</div></div>);}

return (<div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><img
       src="/icon-192.png"
       srcSet="/icon-192.png 1x, /icon-512.png 2x"
       decoding="async"
       alt="Filmak"
       className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 opacity-90"
     /><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2><p className="mt-2 text-sm text-muted-foreground">الرابط اللي فتحته ما يقود لأي صفحة.</p><div className="mt-6"><Link
         to="/"
         className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
       >الرجوع للرئيسية</Link></div></div></div>);}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {console.error(error);const router = useRouter();const t = useT();useEffect(() => {reportLovableError(error, { boundary: "tanstack_root_error_component" });}, [error]);

return (<div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><imgsrc="/icon-192.png"srcSet="/icon-192.png 1x, /icon-512.png 2x"decoding="async"alt={t("brand")}className="w-16 h-16 md md mx-auto mb-4 opacity-90"/><h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error_title")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("error_sub")}</p><div className="mt-6 flex flex-wrap justify-center gap-2"><buttononClick={() => {router.invalidate();reset();}}className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover/90">{t("retry")}</button><a
         href="/"
         className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
       >{t("go_home")}</a></div></div></div>);}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({loader: async () => {const origin = await getRequestOrigin();return { origin };},head: ({ loaderData }) => {const origin = loaderData?.origin ?? "";const ogImage = origin ? ${origin}/icon-512.png : "/icon-512.png";const adsenseClient =(import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_ADSENSE_CLIENT_ID || "ca-pub-2237012686036777";return {meta: [{ charSet: "utf-8" },{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },{ name: "theme-color", content: "#0b0b12" },{ name: "apple-mobile-web-app-capable", content: "yes" },{ name: "mobile-web-app-capable", content: "yes" },{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },{ name: "apple-mobile-web-app-title", content: "فلمك" },{ title: "فلمك — Filmak · AI movie recommender" },{name: "description",content: "اكتشف أفلاماً ومسلسلات تناسب مزاجك بالذكاء الاصطناعي. Discover movies and series that match your mood with AI, in Arabic and English.",},{ property: "og", content: "فلمك — Filmak" },{property: "og",content: "Describe what you want to watch, and AI finds the best movies and series for you. متاح بالعربية والإنجليزية.",},{ property: "og", content: "website" },{ property: "og", content: "فلمك — Filmak" },{ property: "og", content: ogImage },{ property: "og:image", content: ogImage },{ property: "og:image", content: "image/png" },{ property: "og:image", content: "فلمك — Filmak" },{ property: "og:image", content: "512" },{ property: "og:image", content: "512" },{ name: "twitter", content: "summary_large_image" },{ name: "twitter", content: "فلمك — Filmak" },{ name: "twitter", content: "AI movie & series recommendations in Arabic and English." },{ name: "twitter", content: ogImage },{ name: "google-site-verification", content: "Ba8-EE-ouLI8m2vv00Ci4LWeeHuGdKKhDu4iW-sSwHg" },...(adsenseClient ? [{ name: "google-adsense-account", content: adsenseClient }] : []),],links: [{ rel: "stylesheet", href: appCss },{ rel: "icon", href: "/icon-32.png", sizes: "32x32", type: "image/png" },{ rel: "icon", href: "/icon-16.png", sizes: "16x16", type: "image/png" },{ rel: "icon", href: "/icon-192.png", sizes: "192x192", type: "image/png" },{ rel: "icon", href: "/icon-512.png", sizes: "512x512", type: "image/png" },{ rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },{ rel: "manifest", href: "/manifest.webmanifest" },],scripts: adsenseClient? [{type: "application/ld+json",children: JSON.stringify({"@context": "https://schema.org","@graph": [{"@type": "WebSite","@id": "https://filmak.site/#website",url: "https://filmak.site/",name: "فلمك — Filmak",description: "AI movie & series recommendations in Arabic and English.",inLanguage: ["ar", "en"],potentialAction: {"@type": "SearchAction",target: "https://filmak.site/?q={search_term_string}","query-input": "required name=search_term_string",},},{"@type": "Organization","@id": "https://filmak.site/#org",name: "Filmak",url: "https://filmak.site/",logo: "https://filmak.site/icon-512.png",},],}),},{async: true,src: "https://www.googletagmanager.com/gtag/js?id=G-0JV72533H2",},{children:"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-0JV72533H2');(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start' Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WKFD75K');",},{async: true,src: https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient},crossOrigin: "anonymous",},]: [{type: "application/ld+json",children: JSON.stringify({"@context": "https://schema.org","@graph": [{"@type": "WebSite","@id": "https://filmak.site/#website",url: "https://filmak.site/",name: "فلمك — Filmak",description: "AI movie & series recommendations in Arabic and English.",inLanguage: ["ar", "en"],potentialAction: {"@type": "SearchAction",target: "https://filmak.site/?q={search_term_string}","query-input": "required name=search_term_string",},},{"@type": "Organization","@id": "https://filmak.site/#org",name: "Filmak",url: "https://filmak.site/",logo: "https://filmak.site/icon-512.png",},],}),},{async: true,src: "https://www.googletagmanager.com/gtag/js?id=G-0JV72533H2",},{children:"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-0JV72533H2');(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start' Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WKFD75K');",},],};},shellComponent: RootShell,component: RootComponent,notFoundComponent: NotFoundComponent,errorComponent: ErrorComponent,});

function RootShell({ children }: { children: ReactNode }) {return (<html lang="ar" dir="rtl"><head><HeadContent /><scriptdangerouslySetInnerHTML={{__html:"(function(){try{var l=localStorage.getItem('locale');var t=localStorage.getItem('theme');if(!l){var n=(navigator.language||'ar').toLowerCase();l=n.indexOf('ar')===0?'ar':'en';}if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var h=document.documentElement;h.lang=l;h.dir=l==='ar'?'rtl':'ltr';if(t==='dark')h.classList.add('dark');else h.classList.remove('dark');h.style.colorScheme=t;}catch(e){}})();",}}/></head><body>{children}<Scripts /></body></html>);}

function RootComponent() {const { queryClient } = Route.useRouteContext();const router = useRouter();

useEffect(() => {const { data: sub } = supabase.auth.onAuthStateChange((event) => {if (event === "PASSWORD_RECOVERY") {if (typeof window !== "undefined" && window.location.pathname !== "/reset-password") {window.location.replace("/reset-password" + window.location.search + window.location.hash);}return;}if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;router.invalidate();if (event !== "SIGNED_OUT") queryClient.invalidateQueries();});// Fallback: only true recovery links (hash contains type=recovery) go to reset page.// Do NOT hijack generic ?code= params — Google OAuth's PKCE redirect also uses ?code=.if (typeof window !== "undefined") {const hash = window.location.hash || "";if (hash.includes("type=recovery") && window.location.pathname !== "/reset-password") {window.location.replace("/reset-password" + window.location.search + hash);}}return () => sub.subscription.unsubscribe();}, [router, queryClient]);

return (<QueryClientProvider client={queryClient}><ThemeProvider><LocaleProvider>{/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}<TopBar /><Outlet /><BottomNav /><Toaster position="top-center" theme="dark" richColors /></LocaleProvider></ThemeProvider></QueryClientProvider>);}
