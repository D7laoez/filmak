import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import {
  ArrowRight,
  Star,
  Clock,
  Calendar,
  Play,
  Film,
  Users,
  Globe,
  Languages as LanguagesIcon,
  Building2,
  DollarSign,
  Image as ImageIcon,
  Video,
  Info,
} from "lucide-react";
import { getMovieDetails } from "@/lib/movies.functions";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { useT } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin.functions";
import { NavToggles } from "@/components/NavToggles";
import { TrailerModal } from "@/components/TrailerModal";
import { MediaLightbox } from "@/components/MediaLightbox";
import { AdSlot } from "@/components/AdSlot";

export const Route = createFileRoute("/movie/$id")({
  component: MoviePage,
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    const [movie, origin] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["movie", id, "ar"],
        queryFn: () => getMovieDetails({ data: { id, lang: "ar" } }),
      }),
      getRequestOrigin(),
    ]);
    return { movie, origin };
  },
  head: ({ params, loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const movie = loaderData?.movie;
    const backdrop = movie?.backdrop ?? movie?.poster ?? `${origin}/icon-512.png`;
    const abs = backdrop?.startsWith("http") ? backdrop : `${origin}${backdrop}`;
    const title = movie ? `${movie.title} — فيلمك` : "فيلمك";
    const desc = movie?.overview?.slice(0, 200) ?? "";
    const url = origin ? `${origin}/movie/${params.id}` : `/movie/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "video.movie" },
        { property: "og:url", content: url },
        { property: "og:image", content: abs },
        { property: "og:image:secure_url", content: abs },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: abs },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    const t = useT();
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <img
            src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
            alt={t("brand")}
            className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-90"
          />
          <h1 className="text-2xl font-bold mb-2">{t("error_load_movie")}</h1>
          <p className="text-muted-foreground mb-4 text-sm">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: NotFoundInline,
});

function MoviePage() {
  const t = useT();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size={64} label={t("loading")} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

function NotFoundInline() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          decoding="async"
          alt={t("brand")}
          className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-90"
        />
        <h1 className="text-xl font-bold mb-2">{t("page_not_found_title")}</h1>
        <Link
          to="/"
          className="inline-block mt-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          {t("go_home")}
        </Link>
      </div>
    </div>
  );
}

function Content() {
  const { id } = Route.useParams();
  const numId = Number(id);
  const { locale, dir, t } = useLocale();
  const { data } = useSuspenseQuery({
    queryKey: ["movie", numId, locale],
    queryFn: () => getMovieDetails({ data: { id: numId, lang: locale } }),
  });
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ key: string; name: string } | null>(null);
  const [galleryTab, setGalleryTab] = useState<"backdrops" | "posters">("backdrops");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);

  const numberFmt = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US"),
    [locale],
  );
  const money = (n: number) =>
    n && n > 0
      ? new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      : "—";

  const overview = data.overview ?? "";
  const overviewLong = overview.length > 260;
  const galleryImages =
    galleryTab === "backdrops" ? data.images.backdrops : data.images.posters;

  // JSON-LD Movie schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: data.title,
    alternateName: data.originalTitle ?? undefined,
    description: overview,
    image: data.poster ?? undefined,
    datePublished: data.releaseDate ?? undefined,
    genre: data.genres,
    aggregateRating: data.voteCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: data.rating,
          ratingCount: data.voteCount,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    director: data.crew.director.map((n) => ({ "@type": "Person", name: n })),
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cinematic hero */}
      <div className="relative h-[70vh] min-h-[520px] w-full">
        {data.backdrop && (
          <img
            src={data.backdrop}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
        <div
          className={`absolute inset-0 ${
            dir === "rtl"
              ? "bg-gradient-to-l from-background/90 via-background/40 to-transparent"
              : "bg-gradient-to-r from-background/90 via-background/40 to-transparent"
          }`}
        />

        <div className="absolute top-0 inset-x-0 p-4 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5 text-sm hover:bg-black/70 transition text-white"
            >
              <ArrowRight className="w-4 h-4" />
              {t("back")}
            </Link>
            <NavToggles />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-56 md:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {data.poster ? (
            <img
              src={data.poster}
              alt={data.title}
              className="w-44 md:w-64 rounded-2xl shadow-2xl shrink-0 mx-auto md:mx-0 ring-1 ring-white/10"
            />
          ) : (
            <div className="w-44 md:w-64 aspect-[2/3] bg-muted rounded-2xl flex items-center justify-center mx-auto md:mx-0">
              <Film className="w-10 h-10" />
            </div>
          )}

          <div className="flex-1 pt-2 md:pt-24 min-w-0">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 drop-shadow-md">
              {data.title}
            </h1>
            {data.originalTitle && data.originalTitle !== data.title && (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="opacity-70">{t("original_title")}: </span>
                <span className="italic">{data.originalTitle}</span>
              </p>
            )}
            {data.tagline && (
              <p className="text-muted-foreground italic mb-4">"{data.tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 rounded-full px-2.5 py-1 font-semibold">
                <Star className="w-4 h-4 fill-primary" />
                {data.rating}
                <span className="text-[10px] opacity-70">/10</span>
              </span>
              {data.voteCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({numberFmt.format(data.voteCount)} {t("votes")})
                </span>
              )}
              {data.year && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {data.year}
                </span>
              )}
              {data.runtime ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {data.runtime} {t("minutes_short")}
                </span>
              ) : null}
              {data.status && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border bg-secondary/60">
                  {data.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {data.genres.map((g: string) => (
                <span
                  key={g}
                  className="text-xs px-3 py-1 rounded-full bg-secondary/70 border border-border"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="max-w-3xl">
              <p
                className={`text-base leading-relaxed text-foreground/90 ${
                  !overviewOpen && overviewLong ? "line-clamp-4" : ""
                }`}
              >
                {overview || "—"}
              </p>
              {overviewLong && (
                <button
                  type="button"
                  onClick={() => setOverviewOpen((o) => !o)}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  {overviewOpen ? t("less") : t("more")}
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {data.trailerKey && (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t("watch_trailer")}
                </button>
              )}
              <FavoriteButton
                movie={{
                  id: data.id,
                  title: data.title,
                  poster: data.poster,
                  year: data.year,
                  rating: data.rating,
                }}
              />
              <ShareButton title={data.title} text={overview?.slice(0, 120)} />
              {data.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${data.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-secondary/70 border border-border hover:bg-secondary transition"
                >
                  {t("imdb")}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Watch providers */}
        {data.watch && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">
              {t("where_to_watch")}
              {data.watchCountry && (
                <span className="text-sm text-muted-foreground mx-2">({data.watchCountry})</span>
              )}
            </h2>
            {(() => {
              const fallback = `https://www.themoviedb.org/movie/${data.id}/watch${
                data.watchCountry ? `?locale=${data.watchCountry}` : ""
              }`;
              const link = data.watch.link || fallback;
              return (
                <>
                  <ProviderGroup label={t("by_subscription")} items={data.watch.flatrate} link={link} />
                  <ProviderGroup label={t("rent")} items={data.watch.rent} link={link} />
                  <ProviderGroup label={t("buy")} items={data.watch.buy} link={link} />
                </>
              );
            })()}
            {data.watch.link && (
              <a
                href={data.watch.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm underline"
              >
                {t("view_all_tmdb")}
              </a>
            )}
          </section>
        )}

        {/* Videos */}
        {data.videos.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
              <Video className="w-5 h-5 text-primary" />
              {t("videos")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.videos.map((v: { key: string; name: string; type: string }) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setActiveVideo({ key: v.key, name: v.name })}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-muted text-left"
                >
                  <img
                    src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`}
                    alt={v.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/90 grid place-items-center shadow-xl">
                      <Play className="w-5 h-5 fill-current text-primary-foreground" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                    <p className="text-xs font-medium truncate">{v.name}</p>
                    <p className="text-[10px] opacity-70">{v.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {(data.images.backdrops.length > 0 || data.images.posters.length > 0) && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ImageIcon className="w-5 h-5 text-primary" />
                {t("gallery")}
              </h2>
              <div className="inline-flex rounded-full border border-border bg-secondary/40 p-1 text-xs">
                {(["backdrops", "posters"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    disabled={
                      (tab === "backdrops" && data.images.backdrops.length === 0) ||
                      (tab === "posters" && data.images.posters.length === 0)
                    }
                    className={`px-3 py-1 rounded-full transition disabled:opacity-40 ${
                      galleryTab === tab
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "backdrops" ? t("gallery") : t("original_title")}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`grid gap-3 ${
                galleryTab === "backdrops"
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-3 md:grid-cols-5 lg:grid-cols-6"
              }`}
            >
              {galleryImages.map((img: { url: string; thumb: string }, i: number) => (
                <button
                  key={img.url}
                  onClick={() => setLightboxIndex(i)}
                  className={`group relative overflow-hidden rounded-lg bg-muted ${
                    galleryTab === "backdrops" ? "aspect-video" : "aspect-[2/3]"
                  }`}
                >
                  <img
                    src={img.thumb}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Cast */}
        {data.cast.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
              <Users className="w-5 h-5 text-primary" />
              {t("cast")}
            </h2>
            <div className="flex md:grid md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
              {data.cast.map((c: { name: string; character: string; profile: string | null }) => (
                <div key={`${c.name}-${c.character}`} className="text-center shrink-0 w-24 md:w-auto snap-start">
                  {c.profile ? (
                    <img
                      src={c.profile}
                      alt={c.name}
                      loading="lazy"
                      className="w-full aspect-square object-cover rounded-full mb-2"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-full mb-2 grid place-items-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Crew */}
        {(data.crew.director.length +
          data.crew.writers.length +
          data.crew.composer.length +
          data.crew.cinematographer.length +
          data.crew.editor.length) > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">{t("crew")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <CrewCard label={t("director")} names={data.crew.director} />
              <CrewCard label={t("writers")} names={data.crew.writers} />
              <CrewCard label={t("composer")} names={data.crew.composer} />
              <CrewCard label={t("cinematographer")} names={data.crew.cinematographer} />
              <CrewCard label={t("editor")} names={data.crew.editor} />
            </div>
          </section>
        )}

        {/* Details / Production */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Info className="w-5 h-5 text-primary" />
              {t("details")}
            </h3>
            <dl className="space-y-2 text-sm">
              {data.status && <Row label={t("status")} value={data.status} />}
              {data.releaseDate && <Row label={t("year")} value={data.releaseDate} />}
              {data.originalLanguage && (
                <Row
                  label={t("original_language")}
                  value={data.originalLanguage.toUpperCase()}
                />
              )}
              {data.spokenLanguages.length > 0 && (
                <Row label={t("languages")} value={data.spokenLanguages.join(", ")} />
              )}
              {data.productionCountries.length > 0 && (
                <Row label={t("countries")} value={data.productionCountries.join(", ")} />
              )}
              {data.popularity > 0 && (
                <Row
                  label={t("popularity_label")}
                  value={numberFmt.format(data.popularity)}
                />
              )}
            </dl>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              {t("box_office")}
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label={t("budget")} value={money(data.budget)} />
              <Row label={t("revenue")} value={money(data.revenue)} />
              {data.budget > 0 && data.revenue > 0 && (
                <Row
                  label={t("profit")}
                  value={money(data.revenue - data.budget)}
                />
              )}
            </dl>
            {data.budget > 0 && data.revenue > 0 && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        (data.revenue / Math.max(data.revenue, data.budget)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Production companies */}
        {data.productionCompanies.length > 0 && (
          <section className="mt-8">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              {t("companies")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.productionCompanies.map((c: { name: string; logo: string | null }) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2"
                >
                  {c.logo ? (
                    <img src={c.logo} alt={c.name} className="h-6 max-w-[80px] object-contain" loading="lazy" />
                  ) : (
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{c.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {data.similar.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-xl font-bold mb-4">{t("similar")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.similar.map((m: { id: number; title: string; poster: string | null; year: string; rating: number }) => (
                <Link
                  key={m.id}
                  to="/movie/$id"
                  params={{ id: String(m.id) }}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {m.poster ? (
                      <img
                        src={m.poster}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {m.rating}
                    </div>
                  </div>
                  <p className="mt-2 text-sm truncate group-hover:text-primary transition">
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.year}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      {data.trailerKey && (
        <TrailerModal
          trailerKey={data.trailerKey}
          title={data.title}
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
        />
      )}
      {activeVideo && (
        <TrailerModal
          trailerKey={activeVideo.key}
          title={activeVideo.name}
          open={true}
          onClose={() => setActiveVideo(null)}
        />
      )}
      {lightboxIndex !== null && galleryImages.length > 0 && (
        <MediaLightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-foreground text-end">{value}</dd>
    </div>
  );
}

function CrewCard({ label, names }: { label: string; names: string[] }) {
  if (!names || names.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium leading-snug">{names.join("، ")}</p>
    </div>
  );
}

function ProviderGroup({
  label,
  items,
  link,
}: {
  label: string;
  items: { name: string; logo: string }[];
  link?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {items.map((p) => (
          link ? (
            <a
              key={p.name}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              title={p.name}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 hover:border-primary/50 hover:bg-secondary transition"
            >
              <img src={p.logo} alt={p.name} className="w-8 h-8 rounded" />
              <span className="text-sm">{p.name}</span>
            </a>
          ) : (
            <div
              key={p.name}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
            >
              <img src={p.logo} alt={p.name} className="w-8 h-8 rounded" />
              <span className="text-sm">{p.name}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}