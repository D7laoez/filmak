import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Film, Play, Search, Loader2, Sparkles } from "lucide-react";
import {
  getFreePublicDomainMovies,
  getFreeMovieStream,
  type PublicDomainMovie,
} from "@/lib/free-movies.functions";
import { useLocale } from "@/lib/i18n";
import { AdSlot } from "@/components/AdSlot";

export const Route = createFileRoute("/free-movies")({
  head: () => ({
    meta: [
      { title: "سينما كلاسيكية مجانية — مشاهدة أفلام كاملة | فلمك Filmak" },
      {
        name: "description",
        content:
          "شاهد أفلاماً كلاسيكية كاملة ومجانية في الملكية العامة بجودة عالية مباشرة داخل فلمك.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/free-movies" }],
  }),
  component: FreeMoviesPage,
});

function FreeMoviesPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selected, setSelected] = useState<PublicDomainMovie | null>(null);

  const moviesQuery = useQuery({
    queryKey: ["free-public-domain", activeQuery],
    queryFn: () => getFreePublicDomainMovies({ data: { q: activeQuery || undefined, page: 1 } }),
    staleTime: 1000 * 60 * 30,
  });

  const streamQuery = useQuery({
    queryKey: ["free-movie-stream", selected?.id],
    queryFn: () => getFreeMovieStream({ data: { id: selected!.id } }),
    enabled: Boolean(selected?.id),
    staleTime: 1000 * 60 * 60,
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ar ? "تراخيص ملكية عامة معلنة" : "Declared Public-Domain Licenses"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {ar ? "سينما كلاسيكية مجانية — تشغيل مباشر" : "Free Classic Cinema — Direct Player"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {ar
              ? "نعرض فقط العناصر التي تتضمن بيانات Internet Archive ترخيص Public Domain Mark أو CC0. بيانات الترخيص يضيفها رافع الملف ولا تمثل تحققاً قانونياً مستقلاً؛ راجع صفحة المصدر قبل إعادة الاستخدام."
              : "We list only items whose Internet Archive metadata declares Public Domain Mark or CC0. License metadata is uploader-provided, not independent legal verification; check the source record before reuse."}
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={ar ? "ابحث في الأفلام الكلاسيكية…" : "Search classic movies…"}
                className="w-full rounded-full border border-border bg-card ps-10 pe-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition cursor-pointer"
            >
              {ar ? "بحث" : "Search"}
            </button>
          </form>
        </header>

        <AdSlot placement="free-movies-banner" />

        {selected && (
          <section className="rounded-3xl border border-primary/40 bg-card p-5 md:p-7 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-black">{selected.title}</h2>
                {selected.year && (
                  <p className="text-xs text-muted-foreground tabular-nums">{selected.year}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary cursor-pointer"
              >
                {ar ? "إغلاق المشغل" : "Close Player"}
              </button>
            </div>

            {streamQuery.isLoading ? (
              <div className="aspect-video rounded-2xl bg-black grid place-items-center text-white">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>{ar ? "جارٍ تجهيز البث…" : "Loading stream…"}</span>
                </div>
              </div>
            ) : streamQuery.data?.streamUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black border border-border">
                <video
                  key={streamQuery.data.streamUrl}
                  src={streamQuery.data.streamUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full"
                >
                  {streamQuery.data.subtitleUrl && (
                    <track
                      kind="subtitles"
                      src={streamQuery.data.subtitleUrl}
                      label="Subtitles"
                      default
                    />
                  )}
                </video>
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-secondary grid place-items-center text-sm text-muted-foreground">
                {ar
                  ? "تعذر العثور على ملف MP4 مباشر لهذا الفيلم."
                  : "No direct MP4 stream available for this title."}
              </div>
            )}
          </section>
        )}

        {moviesQuery.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[2/3] rounded-2xl bg-muted animate-pulse" />
                <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(moviesQuery.data ?? []).map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => {
                  setSelected(movie);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group text-start space-y-2 cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-sm group-hover:border-primary/60 transition">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-bold line-clamp-2 group-hover:text-primary transition">
                  {movie.title}
                </p>
                {movie.year && (
                  <p className="text-[11px] text-muted-foreground tabular-nums">{movie.year}</p>
                )}
                <p className="text-[10px] text-muted-foreground">{movie.rightsLabel}</p>
              </button>
            ))}
          </div>
        )}

        {!moviesQuery.isLoading && (moviesQuery.data?.length ?? 0) === 0 && (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <Film className="w-10 h-10 mx-auto opacity-50" />
            <p className="text-sm">{ar ? "لا توجد نتائج مطابقة." : "No matching classic films."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
