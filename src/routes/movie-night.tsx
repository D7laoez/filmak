import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Film, Sparkles, Star, Clock3, RotateCw, Loader2 } from "lucide-react";
import { getMovieNightPicks } from "@/lib/movie-night.functions";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/movie-night")({
  head: () => ({
    meta: [
      { title: "ليلة الفيلم — فلمك" },
      { name: "description", content: "اختيارات أفلام حقيقية تناسب مزاجك وتقييمك ومدة وقتك." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "ليلة الفيلم — Filmak" },
      { property: "og:description", content: "اختيارات فيلم مناسبة لمزاجك ووقتك." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://filmak.site/movie-night" },
      { property: "og:image", content: "https://filmak.site/icon-512.png" },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/movie-night" }],
  }),
  component: MovieNightPage,
});

type Mood = "all" | "action" | "comedy" | "horror" | "romance" | "sciFi";
type Duration = "any" | "short" | "medium" | "long";

const runtimeFor = (duration: Duration) => {
  if (duration === "short") return { minRuntime: null, maxRuntime: 100 };
  if (duration === "medium") return { minRuntime: 100, maxRuntime: 140 };
  if (duration === "long") return { minRuntime: 140, maxRuntime: null };
  return { minRuntime: null, maxRuntime: null };
};

function MovieNightPage() {
  const { locale, dir } = useLocale();
  const [mood, setMood] = useState<Mood>("all");
  const [rating, setRating] = useState(7);
  const [duration, setDuration] = useState<Duration>("any");
  const runtime = runtimeFor(duration);

  const movies = useQuery({
    queryKey: ["movie-night", locale, mood, rating, duration],
    queryFn: () => getMovieNightPicks({ data: { lang: locale, mood, minRating: rating, ...runtime, page: 1 } }),
    staleTime: 5 * 60 * 1000,
  });

  const moods: Array<[Mood, string]> = [
    ["all", locale === "ar" ? "أي مزاج" : "Any mood"],
    ["action", locale === "ar" ? "أكشن 🔥" : "Action 🔥"],
    ["comedy", locale === "ar" ? "ضحك 😂" : "Comedy 😂"],
    ["horror", locale === "ar" ? "رعب 👻" : "Horror 👻"],
    ["romance", locale === "ar" ? "رومانسي ❤️" : "Romance ❤️"],
    ["sciFi", locale === "ar" ? "خيال علمي 🚀" : "Sci‑Fi 🚀"],
  ];

  const reset = () => {
    setMood("all");
    setRating(7);
    setDuration("any");
  };

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground px-4 py-10 pb-28">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← {locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <section className="mt-6 rounded-3xl border border-border bg-card/70 p-6 md:p-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 text-primary"><Sparkles className="w-5 h-5" /><span className="text-xs font-semibold tracking-[0.18em] uppercase">FILMAK MOVIE NIGHT</span></div>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold">{locale === "ar" ? "شنو جوّك الليلة؟ 🍿" : "What's the vibe tonight? 🍿"}</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">{locale === "ar" ? "اختار المزاج والتقييم ومدة الفيلم، وفلمك يجيب لك أفلام مطابقة فعلًا." : "Choose a mood, rating and runtime, then Filmak finds movies that actually match."}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {moods.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setMood(value)} className={`rounded-full px-4 py-2 text-sm border transition ${mood === value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 border-border hover:bg-secondary"}`}>{label}</button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <label className="rounded-2xl border border-border bg-background/60 p-3 text-sm">
                <span className="text-muted-foreground">{locale === "ar" ? "أقل تقييم" : "Minimum rating"}: <b>{rating.toFixed(1)}</b></span>
                <input aria-label={locale === "ar" ? "أقل تقييم" : "Minimum rating"} type="range" min="6" max="9" step="0.1" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-2 w-full accent-primary" />
              </label>
              <label className="rounded-2xl border border-border bg-background/60 p-3 text-sm">
                <span className="text-muted-foreground">{locale === "ar" ? "مدة الفيلم" : "Movie runtime"}</span>
                <select aria-label={locale === "ar" ? "مدة الفيلم" : "Movie runtime"} value={duration} onChange={(e) => setDuration(e.target.value as Duration)} className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2">
                  <option value="any">{locale === "ar" ? "أي مدة" : "Any runtime"}</option>
                  <option value="short">{locale === "ar" ? "أقل من 100 دقيقة" : "Under 100 min"}</option>
                  <option value="medium">{locale === "ar" ? "100–140 دقيقة" : "100–140 min"}</option>
                  <option value="long">{locale === "ar" ? "أكثر من 140 دقيقة" : "Over 140 min"}</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Film className="w-5 h-5 text-primary" />{locale === "ar" ? "اختيارات الليلة" : "Tonight's picks"}</h2>
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-sm rounded-xl border border-border px-3 py-2 hover:bg-secondary"><RotateCw className="w-4 h-4" />{locale === "ar" ? "إعادة" : "Reset"}</button>
          </div>

          {movies.isLoading ? (
            <div className="rounded-2xl border border-border p-10 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />{locale === "ar" ? "جاري تجهيز اختيارات الليلة..." : "Building tonight's picks..."}</div>
          ) : movies.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">{locale === "ar" ? "صار خطأ أثناء جلب الأفلام. جرّب إعادة الصفحة." : "Something went wrong while loading movies. Please retry."}</div>
          ) : movies.data?.results.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {movies.data.results.map((m) => (
                <Link key={m.id} to="/movie/$id" params={{ id: String(m.id) }}
                      reloadDocument className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 transition">
                  <img src={m.poster ?? "/icon-192.png"} alt={m.title} className="w-full aspect-[2/3] object-cover group-hover:scale-[1.02] transition" loading="lazy" />
                  <div className="p-3">
                    <h3 className="font-semibold line-clamp-1">{m.title}</h3>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-yellow-400" />{m.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{m.year || "—"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">
              <p>{locale === "ar" ? "ما لقينا أفلام مطابقة بهالشروط." : "No movies match these filters."}</p>
              <button type="button" onClick={() => setRating((value) => Math.max(6, value - 0.5))} className="mt-4 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm">{locale === "ar" ? "خفّض التقييم" : "Lower rating"}</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
