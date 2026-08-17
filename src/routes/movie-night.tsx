import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, Sparkles, Star, Clock3, RotateCw } from "lucide-react";
import { getPopular, getTopRated, type MovieCard } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/movie-night")({
  head: () => ({
    meta: [
      { title: "ليلة الفيلم — فلمك" },
      { name: "description", content: "خلّ فلمك يبني لك اختيارات مناسبة لليلة الفيلم خلال ثوانٍ." },
      { property: "og:title", content: "ليلة الفيلم — Filmak" },
      { property: "og:description", content: "اختيارات فيلم مناسبة لمزاجك ووقتك." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MovieNightPage,
});

function MovieNightPage() {
  const { locale, dir } = useLocale();
  const [mood, setMood] = useState("all");
  const [rating, setRating] = useState(7);
  const [duration, setDuration] = useState("any");
  const popular = useQuery({ queryKey: ["movie-night-popular", locale], queryFn: () => getPopular({ data: { lang: locale } }) });
  const top = useQuery({ queryKey: ["movie-night-top", locale], queryFn: () => getTopRated({ data: { lang: locale } }) });

  const movies = useMemo(() => {
    const map = new Map<number, MovieCard>();
    [...(popular.data ?? []), ...(top.data ?? [])].forEach((m) => map.set(m.id, m));
    let list = [...map.values()].filter((m) => m.rating >= rating);
    if (duration === "short") list = list.slice(0, Math.min(12, list.length));
    if (duration === "long") list = list.slice(Math.max(0, Math.floor(list.length / 4)));
    if (mood !== "all") {
      const terms: Record<string, string[]> = {
        action: ["action", "أكشن"],
        comedy: ["comedy", "كوميديا", "كوميدي"],
        horror: ["horror", "رعب"],
        romance: ["romance", "رومانسي"],
        sciFi: ["science fiction", "خيال علمي"],
      };
      const needles = terms[mood] ?? [];
      const filtered = list.filter((m) => needles.some((n) => `${m.title} ${m.overview}`.toLowerCase().includes(n)));
      if (filtered.length) list = filtered;
    }
    return list.slice(0, 8);
  }, [popular.data, top.data, rating, duration, mood]);

  const moods = [
    ["all", locale === "ar" ? "أي مزاج" : "Any mood"],
    ["action", locale === "ar" ? "أكشن 🔥" : "Action 🔥"],
    ["comedy", locale === "ar" ? "ضحك 😂" : "Comedy 😂"],
    ["horror", locale === "ar" ? "رعب 👻" : "Horror 👻"],
    ["romance", locale === "ar" ? "رومانسي ❤️" : "Romance ❤️"],
    ["sciFi", locale === "ar" ? "خيال علمي 🚀" : "Sci‑Fi 🚀"],
  ];

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground px-4 py-10 pb-28">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← {locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <section className="mt-6 rounded-3xl border border-border bg-card/70 p-6 md:p-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 text-primary"><Sparkles className="w-5 h-5" /><span className="text-xs font-semibold tracking-[0.18em] uppercase">FILMAK MOVIE NIGHT</span></div>
            <h1 className="mt-3 text-3xl md:text-5xl font-bold">{locale === "ar" ? "شنو جوّك الليلة؟ 🍿" : "What's the vibe tonight? 🍿"}</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">{locale === "ar" ? "حدد مزاجك والتقييم، وخلي فلمك يرتب لك اختيارات جاهزة بدل دوخة البحث." : "Set your mood and rating, then let Filmak build a shortlist for you."}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {moods.map(([value, label]) => <button key={value} onClick={() => setMood(value)} className={`rounded-full px-4 py-2 text-sm border transition ${mood === value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 border-border hover:bg-secondary"}`}>{label}</button>)}
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <label className="rounded-2xl border border-border bg-background/60 p-3 text-sm"><span className="text-muted-foreground">{locale === "ar" ? "أقل تقييم" : "Minimum rating"}: <b>{rating.toFixed(1)}</b></span><input type="range" min="6" max="9" step="0.1" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-2 w-full accent-primary" /></label>
              <label className="rounded-2xl border border-border bg-background/60 p-3 text-sm"><span className="text-muted-foreground">{locale === "ar" ? "مدة الجلسة" : "Session length"}</span><select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2"><option value="any">{locale === "ar" ? "أي مدة" : "Any"}</option><option value="short">{locale === "ar" ? "خفيفة" : "Short"}</option><option value="long">{locale === "ar" ? "طويلة" : "Long"}</option></select></label>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Film className="w-5 h-5 text-primary" />{locale === "ar" ? "اختيارات الليلة" : "Tonight's picks"}</h2><button onClick={() => { setMood("all"); setRating(7); setDuration("any"); }} className="inline-flex items-center gap-2 text-sm rounded-xl border border-border px-3 py-2 hover:bg-secondary"><RotateCw className="w-4 h-4" />{locale === "ar" ? "إعادة" : "Reset"}</button></div>
          {movies.length ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{movies.map((m) => <Link key={m.id} to="/movie/$id" params={{ id: String(m.id) }} className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/50 transition"><img src={m.poster ?? "/icon-192.png"} alt={m.title} className="w-full aspect-[2/3] object-cover group-hover:scale-[1.02] transition" loading="lazy"/><div className="p-3"><h3 className="font-semibold line-clamp-1">{m.title}</h3><div className="mt-1 flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-yellow-400" />{m.rating.toFixed(1)}</span><span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{m.year}</span></div></div></Link>)}</div> : <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">{locale === "ar" ? "ما لقينا اختيارات مطابقة، جرّب تقييم أقل." : "No matching picks. Try a lower rating."}</div>}
        </section>
      </div>
    </main>
  );
}
