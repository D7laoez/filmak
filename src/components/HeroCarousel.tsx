import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieCard } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";

export function HeroCarousel({ movies }: { movies: MovieCard[] }) {
  const { dir, t, locale } = useLocale();
  const ar = locale === "ar";
  const items = (movies ?? []).filter((m) => m.backdrop).slice(0, 6);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const h = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(h);
  }, [items.length, paused]);

  if (items.length === 0) {
    return (
      <section
        dir={dir}
        aria-label={ar ? "الأفلام المميزة" : "Featured movies"}
        aria-busy="true"
        className="relative h-[70vh] min-h-[460px] max-h-[720px] w-full overflow-hidden border-b border-border/50 bg-gradient-to-br from-card via-background to-primary/10"
      >
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 md:px-8 md:pb-16">
          <div className="h-5 w-32 animate-pulse rounded-full bg-muted/70" />
          <div className="mt-4 h-10 w-3/4 max-w-xl animate-pulse rounded-xl bg-muted/70" />
          <div className="mt-3 h-4 w-1/2 max-w-md animate-pulse rounded bg-muted/60" />
          <div className="mt-6 h-11 w-40 animate-pulse rounded-full bg-muted/70" />
        </div>
      </section>
    );
  }
  const m = items[idx];

  const prevSlide = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const nextSlide = () => setIdx((i) => (i + 1) % items.length);

  return (
    <section
      dir={dir}
      className="relative overflow-hidden h-[70vh] min-h-[460px] max-h-[720px] w-full border-b border-border/50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((it, i) => (
        <div
          key={it.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== idx}
        >
          {it.backdrop && (
            <img
              src={it.backdrop}
              alt={it.title}
              className="w-full h-full object-cover scale-[1.03]"
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
          <div
            className={`absolute inset-0 ${
              dir === "rtl"
                ? "bg-gradient-to-l from-background/95 via-background/45 to-transparent"
                : "bg-gradient-to-r from-background/95 via-background/45 to-transparent"
            }`}
          />
        </div>
      ))}

      {items.length > 1 && (
        <div className="hidden md:flex items-center gap-2 absolute top-6 end-8 z-20">
          <button
            type="button"
            onClick={ar ? nextSlide : prevSlide}
            aria-label={ar ? "الشريحة السابقة" : "Previous slide"}
            className="w-10 h-10 rounded-full bg-background/70 backdrop-blur-md border border-border/80 grid place-items-center text-foreground hover:border-primary/60 hover:text-primary transition cursor-pointer"
          >
            {ar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={ar ? prevSlide : nextSlide}
            aria-label={ar ? "الشريحة التالية" : "Next slide"}
            className="w-10 h-10 rounded-full bg-background/70 backdrop-blur-md border border-border/80 grid place-items-center text-foreground hover:border-primary/60 hover:text-primary transition cursor-pointer"
          >
            {ar ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-12 md:pb-16">
        <div className="max-w-2xl" key={m.id}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-3 border border-primary/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("trending")}</span>
            <span className="text-primary/60">·</span>
            <span className="tabular-nums">
              {idx + 1} / {items.length}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3 drop-shadow-sm leading-tight">
            {m.title}
          </h2>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 tabular-nums">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary font-bold">
              <Star className="w-3.5 h-3.5 fill-primary" />
              {m.rating > 0 ? m.rating.toFixed(1) : ar ? "غير متاح" : "N/A"}
            </span>
            {m.year && <span className="font-medium text-foreground/80">{m.year}</span>}
          </div>

          {m.overview && (
            <p className="text-sm md:text-base text-foreground/85 line-clamp-3 mb-6 max-w-xl leading-relaxed">
              {m.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/movie/$id"
              params={{ id: String(m.id) }}
              className="inline-flex items-center gap-2 min-h-[44px] bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-lg shadow-primary/25"
            >
              <Play className="w-4 h-4 fill-current" />
              {t("watch_trailer")}
            </Link>
            <Link
              to="/movie/$id"
              params={{ id: String(m.id) }}
              className="inline-flex items-center gap-2 min-h-[44px] bg-card/80 backdrop-blur-md border border-border rounded-full px-6 py-2.5 text-sm font-semibold hover:border-primary/50 hover:bg-card transition"
            >
              <Info className="w-4 h-4" />
              {t("details")}
            </Link>
          </div>
        </div>

        {items.length > 1 && (
          <div
            className="flex items-center gap-1.5 mt-6"
            role="tablist"
            aria-label="Featured slides"
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === idx}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}: ${item.title}`}
                className="py-3 px-0.5 flex items-center cursor-pointer"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? "w-9 bg-primary" : "w-4 bg-foreground/25 hover:bg-foreground/55"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
