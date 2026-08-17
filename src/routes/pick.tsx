import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Dices, RotateCw, Star, Sparkles } from "lucide-react";
import { getPopular, getTopRated, type MovieCard } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/pick")({
  head: () => ({
    meta: [
      { title: "اختارلي فيلم — فلمك" },
      { name: "description", content: "خلّ فلمك يختار لك فيلم الليلة حسب ذوقك." },
      { property: "og:title", content: "اختارلي فيلم — Filmak" },
      { property: "og:description", content: "اختيار ذكي لفيلم الليلة خلال ثوانٍ." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://filmak.site/pick" },
      { property: "og:image", content: "https://filmak.site/icon-512.png" },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/pick" }],
  }),
  component: PickPage,
});

function PickPage() {
  const { locale, dir } = useLocale();
  const [ratingMode, setRatingMode] = useState<"any" | "high">("any");
  const popular = useQuery({ queryKey: ["pick-popular", locale], queryFn: () => getPopular({ data: { lang: locale } }) });
  const topRated = useQuery({ queryKey: ["pick-top", locale], queryFn: () => getTopRated({ data: { lang: locale } }) });
  const pool = useMemo(() => {
    const unique = new Map<number, MovieCard>();
    [...(popular.data ?? []), ...(topRated.data ?? [])].forEach((m) => unique.set(m.id, m));
    const all = [...unique.values()];
    return ratingMode === "high" ? all.filter((m) => m.rating >= 7.5) : all;
  }, [popular.data, topRated.data, ratingMode]);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const picked = pool.find((m) => m.id === pickedId) ?? pool[0];

  function pickAgain() {
    if (!pool.length) return;
    const choices = pool.filter((m) => m.id !== picked?.id);
    const source = choices.length ? choices : pool;
    setPickedId(source[Math.floor(Math.random() * source.length)].id);
  }

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground px-4 py-10 pb-28">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← {locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <section className="mt-8 text-center rounded-3xl border border-border bg-card/60 p-6 md:p-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center"><Dices className="w-7 h-7" /></div>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-primary font-semibold">FILMAK RANDOM PICK</p>
            <h1 className="mt-2 text-3xl md:text-5xl font-bold">{locale === "ar" ? "شنو جوّك الليلة؟ 🍿" : "What are you watching tonight? 🍿"}</h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{locale === "ar" ? "خلّ فلمك يختار لك فيلم بدل ما تضيع وقتك بالبحث." : "Let Filmak pick a movie so you can stop scrolling and start watching."}</p>
            <div className="mt-7 flex justify-center">
              <select value={ratingMode} onChange={(e) => { setRatingMode(e.target.value as typeof ratingMode); setPickedId(null); }} className="bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="any">{locale === "ar" ? "أي تقييم" : "Any rating"}</option>
                <option value="high">{locale === "ar" ? "7.5+ فقط" : "7.5+ only"}</option>
              </select>
            </div>
            {picked ? (
              <article className="mt-8 max-w-2xl mx-auto rounded-2xl border border-border bg-background/70 p-3 flex flex-col sm:flex-row gap-4 text-start shadow-2xl">
                <img src={picked.poster ?? "/icon-192.png"} alt={picked.title} className="w-full sm:w-40 h-56 object-cover rounded-xl" loading="eager" />
                <div className="flex-1 p-1 sm:py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="w-4 h-4 text-primary" /> {locale === "ar" ? "اختيار فلمك لك" : "Picked for you"}</div>
                  <h2 className="mt-2 text-2xl font-bold">{picked.title}</h2>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Star className="w-4 h-4 fill-current text-yellow-400" /> {picked.rating.toFixed(1)}</span><span>{picked.year}</span></div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-4">{picked.overview || (locale === "ar" ? "فيلم يستحق التجربة الليلة." : "A movie worth trying tonight.")}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/movie/$id" params={{ id: String(picked.id) }} className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">{locale === "ar" ? "شوف التفاصيل" : "View details"}</Link>
                    <button onClick={pickAgain} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"><RotateCw className="w-4 h-4" /> {locale === "ar" ? "اختيار ثاني" : "Pick again"}</button>
                  </div>
                </div>
              </article>
            ) : <div className="mt-8 text-sm text-muted-foreground">{locale === "ar" ? "جاري تحميل الاختيارات..." : "Loading picks..."}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
