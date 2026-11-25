import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star, Sparkles } from "lucide-react";
import type { MovieCard } from "@/lib/movies.functions";
import { useLocale } from "@/lib/i18n";

export function HeroCarousel({ movies }: { movies: MovieCard[] }) {
  const { dir, t } = useLocale();
  const items = (movies ?? []).filter((m) => m.backdrop).slice(0, 6);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const h = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(h);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const m = items[idx];

  return (
    <section
      dir={dir}
      className="relative overflow-hidden h-[70vh] min-h-[420px] max-h-[720px] w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((it, i) => (
        <div
          key={it.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== idx}
        >
          {it.backdrop && (
            <img
              src={it.backdrop}
              alt={it.title}
              className="w-full h-full object-cover scale-105"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div
            className={`absolute inset-0 ${
              dir === "rtl"
                ? "bg-gradient-to-l from-background/90 via-background/40 to-transparent"
                : "bg-gradient-to-r from-background/90 via-background/40 to-transparent"
            }`}
          />
        </div>
      ))}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-16 md:pb-24">
        <div className="max-w-2xl animate-fade-in" key={m.id}>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-medium mb-3 border border-primary/30 backdrop-blur">
            <Sparkles className="w-3 h-3" />
            {t("trending")}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3 drop-shadow-2xl">
            {m.title}
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 tabular-nums">
            <span className="inline-flex items-center gap-1 text-primary font-semibold">
              <Star className="w-4 h-4 fill-primary" />
              {m.rating}
            </span>
            <span>·</span>
            <span>{m.year}</span>
          </div>
          {m.overview && (
            <p className="text-sm md:text-base text-foreground/85 line-clamp-3 mb-6 max-w-xl">
              {m.overview}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/movie/$id"
              params={{ id: String(m.id) }}
              className="inline-flex items-center gap-2 min-h-[44px] bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30"
            >
              <Play className="w-4 h-4 fill-current" />
              {t("watch_trailer")}
            </Link>
            <Link
              to="/movie/$id"
              params={{ id: String(m.id) }}
              className="inline-flex items-center gap-2 min-h-[44px] bg-secondary/70 backdrop-blur border border-border rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition"
            >
              <Info className="w-4 h-4" />
              {t("discover")}
            </Link>
          </div>
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-1 mt-6" role="tablist" aria-label="Featured slides">
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
                    i === idx ? "w-8 bg-primary" : "w-4 bg-foreground/30 hover:bg-foreground/60"
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
