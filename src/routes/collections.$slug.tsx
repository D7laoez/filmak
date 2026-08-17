import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { tmdbGet } from "@/lib/tmdb.server";

const COLLECTIONS = {
  "best-movies-2026": { ar: "أفضل أفلام 2026", en: "Best Movies of 2026", genre: "", year: 2026, descAr: "أبرز الأفلام الجديدة في 2026 مرتبة لتساعدك تختار بسرعة.", descEn: "A curated selection of notable new movies from 2026." },
  "horror-movies": { ar: "أفضل أفلام الرعب", en: "Best Horror Movies", genre: "27", descAr: "أفلام رعب قوية لمحبي التوتر والغموض والأجواء المظلمة.", descEn: "Horror picks for fans of suspense, mystery and darker stories." },
  "romantic-movies": { ar: "أفضل الأفلام الرومانسية", en: "Best Romantic Movies", genre: "10749", descAr: "اختيارات رومانسية من الكلاسيكيات إلى الأعمال الحديثة.", descEn: "Romantic picks ranging from classics to modern favorites." },
  "action-movies": { ar: "أفضل أفلام الأكشن", en: "Best Action Movies", genre: "28", descAr: "أكشن ومطاردات ومعارك لمن يريد جرعة حماس عالية.", descEn: "Action, chases and high-energy stories for an adrenaline boost." },
  "comedy-movies": { ar: "أفضل الأفلام الكوميدية", en: "Best Comedy Movies", genre: "35", descAr: "أفلام كوميدية خفيفة وممتعة لسهرة بدون تعقيد.", descEn: "Fun comedy picks for an easy, entertaining movie night." },
  "sci-fi-movies": { ar: "أفضل أفلام الخيال العلمي", en: "Best Sci-Fi Movies", genre: "878", descAr: "عوالم مستقبلية وأفكار علمية وقصص تتجاوز المألوف.", descEn: "Futuristic worlds, science-driven ideas and imaginative stories." },
  "korean-movies": { ar: "أفضل الأفلام الكورية", en: "Best Korean Movies", genre: "", descAr: "اختيارات كورية متنوعة بين الإثارة والدراما والأكشن.", descEn: "Korean picks across thrillers, drama and action." , language:"ko"},
  "turkish-movies": { ar: "أفضل الأفلام التركية", en: "Best Turkish Movies", genre: "", descAr: "اختيارات من السينما التركية لعشاق القصص والشخصيات القوية.", descEn: "Turkish cinema picks for fans of character-driven stories.", language:"tr"},
  "arabic-movies": { ar: "أفضل الأفلام العربية", en: "Best Arabic Movies", genre: "", descAr: "أفلام عربية من مدارس سينمائية مختلفة.", descEn: "Arabic-language movie picks from across the region.", language:"ar"},
  "movies-like-inception": { ar: "أفلام مثل Inception", en: "Movies Like Inception", genre: "878", descAr: "أفلام ذكية لمحبي الألغاز والواقع المتداخل والأفكار الكبيرة.", descEn: "Smart sci-fi picks for fans of layered realities and big ideas."}
} as const;

type Collection = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }) => {
    const c = COLLECTIONS[params.slug as keyof typeof COLLECTIONS];
    if (!c) return { collection: null, items: [] };
    const p: Record<string,string> = { sort_by: "popularity.desc", include_adult: "false", page: "1", "vote_count.gte": "50" };
    if (c.genre) p.with_genres = c.genre;
    if ("year" in c && c.year) p.primary_release_year = String(c.year);
    if ("language" in c && c.language) p.with_original_language = c.language;
    const data = await tmdbGet<any>("/discover/movie", p, "en");
    return { collection: c, items: (data.results ?? []).filter((x:any)=>x.poster_path).slice(0,18).map((x:any)=>({ id:x.id, title:x.title||x.original_title, poster:`https://image.tmdb.org/t/p/w500${x.poster_path}`, year:(x.release_date||"").slice(0,4), rating:Math.round((x.vote_average||0)*10)/10 })) };
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.collection;
    const title = c ? `${c.ar} | Filmak` : "Filmak";
    const description = c?.descAr ?? "اكتشف أفلامك ومسلسلاتك القادمة مع فلمك.";
    return { meta: [{ title }, { name:"description", content:description }, { name:"robots", content:"index,follow,max-image-preview:large" }], links:[{ rel:"canonical", href:`https://filmak.site/collections/${params.slug}` }], scripts:[{ type:"application/ld+json", children: JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage",name:title,description,url:`https://filmak.site/collections/${params.slug}`}) }] };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const { collection, items } = Route.useLoaderData();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  if (!collection) return <main dir={dir} className="min-h-screen grid place-items-center"><div><h1 className="text-2xl font-bold">{ar ? "الصفحة غير موجودة" : "Collection not found"}</h1><Link className="text-primary mt-4 inline-block" to="/discover">{ar ? "اكتشف الأفلام" : "Discover movies"}</Link></div></main>;
  const c = collection as Collection;
  return <main dir={dir} className="min-h-screen bg-background text-foreground pb-24"><div className="max-w-7xl mx-auto px-4 py-10"><Link to="/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Arrow className="w-4 h-4"/>{ar ? "اكتشف" : "Discover"}</Link><div className="mt-8 max-w-3xl"><div className="inline-flex items-center gap-2 text-primary text-sm font-semibold"><Sparkles className="w-4 h-4"/>Filmak Collections</div><h1 className="mt-3 text-4xl md:text-5xl font-black">{ar ? c.ar : c.en}</h1><p className="mt-4 text-muted-foreground leading-8">{ar ? c.descAr : c.descEn}</p></div><div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">{items.map((m:any)=><Link key={m.id} to="/movie/$id" params={{id:String(m.id)}} className="group"><img src={m.poster} alt={`${m.title} — Filmak`} loading="lazy" className="aspect-[2/3] w-full object-cover rounded-2xl border border-border/50 group-hover:-translate-y-1 transition-transform"/><h2 className="mt-2 font-semibold line-clamp-2">{m.title}</h2><p className="text-xs text-muted-foreground mt-1">{m.year} · ⭐ {m.rating}</p></Link>)}</div></div></main>;
}
