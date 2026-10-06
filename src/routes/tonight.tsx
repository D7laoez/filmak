import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { CalendarDays, Clock3, Dices, RefreshCw, Star, Sparkles } from "lucide-react";
import { getTrending } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";
import { NavToggles } from "@/components/NavToggles";
import { Spinner } from "@/components/Spinner";

export const Route = createFileRoute("/tonight")({
  head: () => ({
    meta: [
      { title: "فلمك الليلة — اختيار فيلم لك | Filmak Tonight" },
      { name: "description", content: "اختيار سريع من فلمك لفيلم يستحق المشاهدة الليلة." },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/tonight" }],
  }),
  component: TonightPage,
});

function TonightPage() {
  const { locale, dir } = useLocale();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tonight", locale],
    queryFn: () => getTrending({ data: { lang: locale } }),
    staleTime: 1000 * 60 * 15,
  });
  const selected = useMemo(() => {
    const list = data ?? [];
    if (!list.length) return undefined;
    return list[Math.floor(Math.random() * list.length)];
  }, [data, isFetching]);

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
          <NavToggles />
        </div>
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold"><Sparkles className="w-4 h-4" />Filmak Tonight</div>
          <h1 className="mt-5 text-4xl md:text-6xl font-black">{locale === "ar" ? "شنو نشوف الليلة؟" : "What should we watch tonight?"}</h1>
          <p className="mt-4 text-muted-foreground">{locale === "ar" ? "خلّ الاختيار علينا." : "Let Filmak make the choice."}</p>
        </section>
        {isLoading ? <div className="py-24 flex justify-center"><Spinner size={64} /></div> : selected ? (
          <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="grid md:grid-cols-[260px_1fr]">
              {selected.backdrop ? <img src={selected.backdrop} alt={selected.title} className="h-full min-h-[360px] w-full object-cover" /> : <div className="min-h-[360px] bg-muted" />}
              <div className="p-7 md:p-9">
                <div className="text-xs text-primary font-semibold mb-3">{locale === "ar" ? "اختيار الليلة" : "Tonight's pick"}</div>
                <h2 className="text-3xl md:text-4xl font-black">{selected.title}</h2>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" />{selected.rating?.toFixed?.(1) ?? selected.rating}</span>
                  {selected.year && <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{selected.year}</span>}
                  <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" />{locale === "ar" ? "اختيار سريع" : "Quick pick"}</span>
                </div>
                <p className="mt-6 leading-8 text-muted-foreground">{locale === "ar" ? "اخترناه من الأعمال الرائجة حاليًا حتى تحصل على اقتراح سريع بدون دوخة البحث." : "Picked from current trending titles so you can start watching without endless scrolling."}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/movie/$id" params={{ id: String(selected.id) }}
                      reloadDocument className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">{locale === "ar" ? "شوف التفاصيل" : "View details"}</Link>
                  <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold"><Dices className="w-4 h-4" />{locale === "ar" ? "اختيار ثاني" : "Pick another"}</button>
                </div>
              </div>
            </div>
          </article>
        ) : <div className="text-center py-20 text-muted-foreground">{locale === "ar" ? "ما قدرنا نجيب اختيارات الآن." : "We couldn't load picks right now."}<button onClick={() => refetch()} className="mx-2 underline"><RefreshCw className="inline w-4 h-4" /> {locale === "ar" ? "إعادة المحاولة" : "Retry"}</button></div>}
      </div>
    </main>
  );
}
