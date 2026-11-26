import { useState } from "react";
import { Play, Tv, Sparkles, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { useLocale } from "@/lib/i18n";

type VideoItem = {
  key: string;
  name: string;
  type: string;
};

type WatchProvider = {
  name: string;
  logo: string;
};

type WatchInfo = {
  link?: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
} | null;

export function CinemaPlayer({
  title,
  trailerKey,
  videos = [],
  watch,
  watchCountry,
}: {
  title: string;
  trailerKey: string | null;
  videos?: VideoItem[];
  watch: WatchInfo;
  watchCountry?: string | null;
}) {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const allVideos: VideoItem[] =
    videos.length > 0
      ? videos
      : trailerKey
        ? [{ key: trailerKey, name: ar ? "العرض الرسمي" : "Official Trailer", type: "Trailer" }]
        : [];

  const [activeKey, setActiveKey] = useState<string | null>(allVideos[0]?.key ?? null);
  const [theater, setTheater] = useState(false);

  const hasWatch =
    watch && (watch.flatrate.length > 0 || watch.rent.length > 0 || watch.buy.length > 0);

  if (allVideos.length === 0 && !hasWatch) return null;

  const allProviders = [
    ...(watch?.flatrate ?? []),
    ...(watch?.rent ?? []),
    ...(watch?.buy ?? []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.name === p.name) === i);

  return (
    <section
      dir={dir}
      className={`rounded-3xl border border-primary/35 bg-card/95 p-5 md:p-7 shadow-2xl space-y-5 transition-all ${
        theater ? "ring-2 ring-primary/60 bg-black" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center text-primary">
            <Play className="w-4 h-4 fill-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black">
              {ar ? `مشغل فلمك السينمائي — ${title}` : `Filmak Cinema Player — ${title}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {ar
                ? "مشاهدة المقاطع الرسمية بدقة عالية مع الترجمة، بالإضافة لمنصات البث الرسمية"
                : "Watch official HD trailers with captions, plus licensed streaming platforms"}
            </p>
          </div>
        </div>

        {activeKey && (
          <button
            type="button"
            onClick={() => setTheater((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3.5 py-1.5 text-xs font-semibold hover:border-primary/50 transition cursor-pointer"
          >
            {theater ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>
              {theater ? (ar ? "الوضع العادي" : "Normal View") : ar ? "وضع المسرح" : "Theater Mode"}
            </span>
          </button>
        )}
      </div>

      {activeKey && (
        <div className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-xl">
            <iframe
              key={activeKey}
              src={`https://www.youtube-nocookie.com/embed/${activeKey}?rel=0&cc_load_policy=1&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {allVideos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {allVideos.slice(0, 8).map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setActiveKey(v.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    v.key === activeKey
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="max-w-[180px] truncate">{v.name || v.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasWatch && (
        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Tv className="w-3.5 h-3.5" />
              <span>
                {ar
                  ? `متوفر للمشاهدة الكاملة رسمياً (${watchCountry ?? "عالمي"})`
                  : `Available to Stream Officially (${watchCountry ?? "Global"})`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {allProviders.slice(0, 8).map((p) => (
                <div
                  key={p.name}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-2.5 py-1 text-xs font-medium"
                >
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="w-5 h-5 rounded object-cover"
                    loading="lazy"
                  />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {watch?.link && (
            <a
              href={watch.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{ar ? "مشاهدة كاملة عبر المنصة" : "Watch Full Title"}</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
