import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dices, RotateCw, Star, Sparkles, Loader2 } from "lucide-react";
import { getRandomMoviePick } from "@/lib/movie-night.functions";
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
  const [nonce, setNonce] = useState(0);
  const pick = useQuery({
    queryKey: ["pick-random", locale, ratingMode, nonce],
    queryFn: () => getRandomMoviePick({ data: { lang: locale, ratingMode, nonce } }),
    staleTime: 0,
  });

  const picked = pick.data;
  const pickAgain = () => setNonce((value) => value + 1);
  const changeRating = (value: "any" | "high") => {
    setRatingMode(value);
    setNonce((current) => current + 1);
  };

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground px-4 py-10 pb-28">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← {locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <section className="mt-8 text-center rounded-3xl border border-border bg-card/60 p-6 md:p-10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 pointer-events-none" />
          <div className="relative">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center"><Dices className="w-7 h-7" /></div>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-primary font-semibold">FILMAK RANDOM PICK</p>
            <h1 className="mt-2 text-3xl md:text-5xl font-bold">{locale === "ar" ? "اختارلي فيلم 🍿" : "Pick me a movie 🍿"}</h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{locale === "ar" ? "خلي فلمك يختار لك فيلم عشوائي من أفلام حقيقية ومفلترة، بدل ما تضيع وقتك بالبحث." : "Let Filmak randomly pick a real movie from a filtered TMDB catalogue."}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {(["any", "high"] as const).map((value) => (
                <button key={value} type="button" onClick={() => changeRating(value)} className={`rounded-full px-4 py-2 text-sm border transition ${ratingMode === value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 border-border hover:bg-secondary"}`}>
                  {value === "any" ? (locale === "ar" ? "أي تقييم" : "Any rating") : (locale === "ar" ? "7.5+ فقط" : "7.5+ only")}
                </button>
              ))}
            </div>

            {pick.isLoading ? (
              <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" />{locale === "ar" ? "جاري اختيار الفيلم..." : "Picking a movie..."}</div>
            ) : pick.isError ? (
              <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{locale === "ar" ? "تعذر جلب فيلم حاليًا. جرّب مرة ثانية." : "We couldn't fetch a movie right now. Try again."}<div className="mt-4"><button onClick={pickAgain} className="rounded-xl bg-primary text-primary-foreground px-4 py-2">{locale === "ar" ? "حاول مرة ثانية" : "Try again"}</button></div></div>
            ) : picked ? (
              <article className="mt-8 max-w-2xl mx-auto rounded-2xl border border-border bg-background/70 p-3 flex flex-col sm:flex-row gap-4 text-start shadow-2xl">
                <img src={picked.poster ?? "/icon-192.png"} alt={picked.title} className="w-full sm:w-40 h-56 object-cover rounded-xl" loading="eager" />
                <div className="flex-1 p-1 sm:py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="w-4 h-4 text-primary" /> {locale === "ar" ? "اختيار عشوائي من فلمك" : "Random pick from Filmak"}</div>
                  <h2 className="mt-2 text-2xl font-bold">{picked.title}</h2>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Star className="w-4 h-4 fill-current text-yellow-400" /> {picked.rating.toFixed(1)}</span><span>{picked.year || "—"}</span></div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-4">{picked.overview || (locale === "ar" ? "فيلم يستحق التجربة الليلة." : "A movie worth trying tonight.")}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/movie/$id" params={{ id: String(picked.id) }} className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">{locale === "ar" ? "شوف التفاصيل" : "View details"}</Link>
                    <button onClick={pickAgain} disabled={pick.isFetching} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"><RotateCw className={`w-4 h-4 ${pick.isFetching ? "animate-spin" : ""}`} /> {locale === "ar" ? "اختيار ثاني" : "Pick again"}</button>
                  </div>
                </div>
              </article>
            ) : (
              <div className="mt-10 text-sm text-muted-foreground">{locale === "ar" ? "ماكو فيلم متاح ضمن الفلتر الحالي." : "No movie is available for the current filter."}</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
