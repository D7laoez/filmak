import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Heart, ListVideo, Sparkles, Star, Eye } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { getUserStats } from "@/lib/user-lists.functions";
import { NavToggles } from "@/components/NavToggles";

export const Route = createFileRoute("/taste")({
  head: () => ({ meta: [{ title: "ذوقي السينمائي — فلمك | My Taste" }, { name: "description", content: "ملخص شخصي لذوقك السينمائي ونشاطك في فلمك." }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TastePage,
});

function TastePage() {
  const { locale, dir } = useLocale();
  const { user, loading } = useAuth();
  const stats = useQuery({ queryKey: ["user-stats", user?.id], queryFn: () => getUserStats(), enabled: !!user, staleTime: 60_000 });
  const ar = locale === "ar";
  if (loading) return <div className="min-h-screen grid place-items-center" />;
  if (!user) return <main dir={dir} className="min-h-screen grid place-items-center bg-background px-4"><div className="text-center"><Sparkles className="mx-auto text-primary mb-4"/><h1 className="text-3xl font-black">{ar ? "اكتشف ذوقك السينمائي" : "Discover your movie taste"}</h1><p className="mt-3 text-muted-foreground">{ar ? "سجل الدخول حتى نحفظ نشاطك ونبني لك ملف ذوق شخصي." : "Sign in so we can save your activity and build your taste profile."}</p><Link to="/auth" className="inline-block mt-6 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">{ar ? "تسجيل الدخول" : "Sign in"}</Link></div></main>;
  const s = stats.data;
  const cards = [[Heart, ar ? "المفضلة" : "Favorites", s?.favorites ?? 0], [ListVideo, ar ? "شاهد لاحقًا" : "Watchlist", s?.watchlist ?? 0], [Eye, ar ? "شاهدتها" : "Watched", s?.watched ?? 0], [Star, ar ? "متوسط تقييمك" : "Your average rating", s?.averageRating ? Number(s.averageRating).toFixed(1) : "—"]] as const;
  return <main dir={dir} className="min-h-screen bg-background text-foreground pb-24"><div className="max-w-6xl mx-auto px-4 py-6"><div className="flex items-center justify-between mb-12"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{ar ? "العودة للرئيسية" : "Back home"}</Link><NavToggles /></div><header className="mb-10"><div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="w-4 h-4"/>{ar ? "ملف الذوق" : "Taste profile"}</div><h1 className="mt-5 text-4xl md:text-6xl font-black">{ar ? "ذوقك السينمائي" : "Your movie taste"}</h1><p className="mt-3 text-muted-foreground">{ar ? "ملخص يتطور مع نشاطك في فلمك." : "A profile that grows with your activity on Filmak."}</p></header><section className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([Icon,label,value]) => <article key={label} className="rounded-2xl border border-border bg-card p-6"><Icon className="w-5 h-5 text-primary mb-5"/><div className="text-3xl font-black">{value}</div><div className="mt-1 text-sm text-muted-foreground">{label}</div></article>)}</section><section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-7"><div className="flex items-center gap-3"><BarChart3 className="text-primary"/><h2 className="text-xl font-bold">{ar ? "بناء التوصيات" : "Recommendation profile"}</h2></div><p className="mt-4 leading-8 text-muted-foreground">{ar ? "كلما أضفت أعمالًا للمفضلة أو شاهدتها أو قيّمتها، تصبح لدينا إشارات أفضل لفهم الأنواع والسنوات واللغات التي تفضّلها. هذه الصفحة خاصة بحسابك." : "The more you favorite, watch and rate titles, the better the signals we have for understanding the genres, years and languages you prefer. This page is private to your account."}</p></section></div></main>;
}
