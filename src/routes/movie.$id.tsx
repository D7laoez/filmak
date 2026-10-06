import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
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
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Compass,
  Lightbulb,
  ShieldCheck,
  Tag,
  Share2,
} from "lucide-react";
import { getMovieDetails } from "@/lib/movies.functions";
import { getEditorialReview, hasSubstantialEditorial, type EditorialReview } from "@/lib/editorial.functions";
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
import { safeJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/movie/$id")({
  component: MoviePage,
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    const [movie, origin, editorial] = await Promise.all([
      context.queryClient
        .ensureQueryData({
          queryKey: ["movie", id, "ar"],
          queryFn: () => getMovieDetails({ data: { id, lang: "ar" } }),
        })
        .catch(() => null),
      getRequestOrigin().catch(() => "https://filmak.site"),
      context.queryClient
        .ensureQueryData({
          queryKey: ["movie-editorial", id],
          queryFn: () => getEditorialReview({ data: { movieId: id } }),
        })
        .catch(() => null),
    ]);
    return { movie, origin, editorial };
  },
  head: ({ params, loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const movie = loaderData?.movie;
    const editorial = loaderData?.editorial;
    const backdrop = movie?.backdrop ?? movie?.poster ?? `${origin}/icon-512.png`;
    const abs = backdrop?.startsWith("http") ? backdrop : `${origin}${backdrop}`;
    const monetizableEditorial = hasSubstantialEditorial(editorial);
    const scoreText = monetizableEditorial ? ` | تقييم فلمك: ${editorial!.editorial_score}/10` : "";
    const title = movie ? `${movie.title} (${movie.year || ""}) — فلمك · مراجعة وتفاصيل الفيلم${scoreText}` : "فلمك";
    const desc = editorial
      ? `${editorial.verdict} — ${movie?.overview?.slice(0, 140) ?? ""}`
      : (movie?.overview?.slice(0, 200) ?? "");
    const url = origin ? `${origin}/movie/${params.id}` : `https://filmak.site/movie/${params.id}`;

    const breadcrumbLd = movie
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "الرئيسية",
              item: "https://filmak.site/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: movie.genres[0] || "أفلام",
              item: "https://filmak.site/discover",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: movie.title,
              item: url,
            },
          ],
        }
      : undefined;

    const movieLd = movie
      ? {
          "@context": "https://schema.org",
          "@type": "Movie",
          name: movie.title,
          alternateName: movie.originalTitle || undefined,
          description: movie.overview || undefined,
          image: abs,
          datePublished: movie.releaseDate || undefined,
          genre: movie.genres,
          url,
          aggregateRating:
            movie.rating && movie.voteCount
              ? {
                  "@type": "AggregateRating",
                  ratingValue: Number(movie.rating).toFixed(1),
                  ratingCount: movie.voteCount,
                  bestRating: 10,
                  worstRating: 0,
                }
              : undefined,
          review: editorial
            ? {
                "@type": "Review",
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: editorial.editorial_score,
                  bestRating: 10,
                  worstRating: 0,
                },
                author: {
                  "@type": "Organization",
                  name: editorial.author_name,
                },
                reviewBody: editorial.verdict,
              }
            : undefined,
        }
      : undefined;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        // TMDB-only movie pages are not index-worthy; only pages with original FILMAK editorial are indexable.
        { name: "robots", content: monetizableEditorial ? "index, follow" : "noindex, follow" },
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
      scripts: [
        ...(movieLd ? [{ type: "application/ld+json", children: safeJsonLd(movieLd) }] : []),
        ...(breadcrumbLd ? [{ type: "application/ld+json", children: safeJsonLd(breadcrumbLd) }] : []),
      ],
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
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const { data } = useSuspenseQuery({
    queryKey: ["movie", numId, locale],
    queryFn: () => getMovieDetails({ data: { id: numId, lang: locale } }),
  });

  const editorialQuery = useQuery({
    queryKey: ["movie-editorial", numId],
    queryFn: () => getEditorialReview({ data: { movieId: numId } }),
  });

  const editorial = editorialQuery.data;

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

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {/* Cinematic Hero */}
      <div className="relative h-[72vh] min-h-[540px] w-full">
        {data.backdrop && (
          <img
            src={data.backdrop}
            alt={data.title}
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

        {/* Top Floating Nav */}
        <div className="absolute top-0 inset-x-0 p-4 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-3.5 py-1.5 text-sm hover:bg-black/80 transition text-white border border-white/10"
            >
              <Arrow className="w-4 h-4" />
              {t("back")}
            </Link>
            <NavToggles />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-56 md:-mt-64 relative z-10 space-y-12">
        {/* Breadcrumb Bar */}
        <nav
          className="inline-flex items-center gap-2 text-xs bg-black/60 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-white/80"
          aria-label="Breadcrumbs"
        >
          <Link to="/" className="hover:text-primary transition">
            {ar ? "الرئيسية" : "Home"}
          </Link>
          <span>/</span>
          <Link to="/discover" className="hover:text-primary transition">
            {ar ? "الأفلام" : "Movies"}
          </Link>
          {data.genres[0] && (
            <>
              <span>/</span>
              <span className="text-white/60">{data.genres[0]}</span>
            </>
          )}
          <span>/</span>
          <span className="text-primary font-medium truncate max-w-[180px] sm:max-w-none">
            {data.title}
          </span>
        </nav>

        {/* Main Header & Poster Grid */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {data.poster ? (
            <img
              src={data.poster}
              alt={data.title}
              className="w-44 md:w-64 rounded-3xl shadow-2xl shrink-0 mx-auto md:mx-0 ring-1 ring-white/15"
            />
          ) : (
            <div className="w-44 md:w-64 aspect-[2/3] bg-muted rounded-3xl flex items-center justify-center mx-auto md:mx-0">
              <Film className="w-10 h-10" />
            </div>
          )}

          <div className="flex-1 min-w-0 pt-2 md:pt-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {editorial ? (
                <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-black px-3 py-1 rounded-full text-xs shadow-md shadow-primary/20">
                  <Award className="w-4 h-4" />
                  {ar ? "تقييم فلمك:" : "FILMAK Score:"} {editorial.editorial_score}/10
                </div>
              ) : null}

              <div className="inline-flex items-center gap-1 bg-secondary/80 border border-border px-2.5 py-1 rounded-full text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{data.rating}</span>
                <span className="text-[10px]">TMDB ({numberFmt.format(data.voteCount)})</span>
              </div>
            </div>

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
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border border-border bg-secondary/60">
                  {data.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {data.genres.map((g: string) => (
                <span
                  key={g}
                  className="text-xs px-3 py-1 rounded-full bg-secondary/70 border border-border font-medium"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis / TMDB Factual Overview */}
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {ar ? "الملخص القصصي (بيانات TMDB الرسمية)" : "Synopsis (Factual Database)"}
              </p>
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
                  className="mt-1 text-sm text-primary hover:underline font-medium"
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

        {/* 30-second viewing decision: a compact editorial tool built from reviewed FILMAK fields */}
        {editorial && hasSubstantialEditorial(editorial) ? (
          <section
            aria-label={ar ? "قرار المشاهدة خلال 30 ثانية" : "30-second viewing decision"}
            className="rounded-3xl border border-border bg-card/80 backdrop-blur p-5 md:p-7 shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  {ar ? "قرار سريع قبل المشاهدة" : "Quick viewing decision"}
                </div>
                <h2 className="text-xl md:text-2xl font-black">
                  {ar ? "هل يستحق وقتك؟" : "Is it worth your time?"}
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <CheckCircle2 className="w-4 h-4" />
                {ar ? "حكم فلمك" : "FILMAK Verdict"}: {editorial.editorial_score}/10
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DecisionCard icon={<ThumbsUp className="w-4 h-4" />} label={ar ? "أنصح به إذا" : "Watch if"} value={editorial.who_should_watch} />
              <DecisionCard icon={<ThumbsDown className="w-4 h-4" />} label={ar ? "قد لا يناسبك إذا" : "Skip if"} value={editorial.who_may_not_enjoy} />
              <DecisionCard icon={<Lightbulb className="w-4 h-4" />} label={ar ? "أفضل سبب للمشاهدة" : "Best reason"} value={editorial.why_watch} />
              <DecisionCard icon={<Clock className="w-4 h-4" />} label={ar ? "أفضل جلسة مشاهدة" : "Best setup"} value={editorial.recommended_viewing} />
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* PROMINENT ORIGINAL FILMAK EDITORIAL SECTION: FILMAK VERDICT & SCORES */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-primary/30 bg-card/90 backdrop-blur p-6 md:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                {ar ? "رؤية فلمك النقدية والتحريرية" : "FILMAK Original Editorial Analysis"}
              </div>
              <h2 className="text-2xl md:text-3xl font-black">{ar ? "حكم فلمك (FILMAK Verdict)" : "The FILMAK Verdict"}</h2>
            </div>

            {editorial ? (
              <div className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-2xl px-5 py-3 shrink-0">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-primary leading-none">
                    {editorial.editorial_score}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">
                    {ar ? "من 10" : "Out of 10"}
                  </div>
                </div>
                <div className="h-10 w-px bg-border/60" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-foreground">{ar ? "تقييم المحرر" : "Editorial Rating"}</div>
                  <div className="text-muted-foreground">{editorial.author_name}</div>
                </div>
              </div>
            ) : null}
          </div>

          {editorial ? (
            <div className="space-y-8">
              {/* Verdict Summary Text */}
              <blockquote className="text-lg md:text-xl font-semibold leading-relaxed text-foreground/95 bg-secondary/30 rounded-2xl p-5 border-r-4 rtl:border-r-4 ltr:border-l-4 border-primary">
                "{editorial.verdict}"
              </blockquote>

              {/* Editorial Breakdown Progress Bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreBar label={ar ? "القصة والسيناريو" : "Story & Script"} score={editorial.story_score} />
                <ScoreBar label={ar ? "الأداء التمثيلي" : "Acting"} score={editorial.acting_score} />
                <ScoreBar label={ar ? "الإخراج والبصريات" : "Visuals & Craft"} score={editorial.visuals_score} />
                <ScoreBar label={ar ? "المتعة العامة" : "Entertainment"} score={editorial.entertainment_score} />
              </div>

              {/* Long-form review body */}
              {editorial.review_content && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-bold text-foreground">{ar ? "التحليل السينمائي والنقدي" : "Critical Analysis"}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                    {editorial.review_content}
                  </p>
                </div>
              )}

              {/* Why Watch This Movie? */}
              {editorial.why_watch && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 md:p-6 space-y-2">
                  <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-primary">
                    <Lightbulb className="w-5 h-5" />
                    {ar ? "لماذا تشاهد هذا الفيلم؟" : "Why Watch This Movie?"}
                  </h3>
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                    {editorial.why_watch}
                  </p>
                </div>
              )}

              {/* Strengths & Weaknesses Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-emerald-400 text-sm md:text-base">
                    <ThumbsUp className="w-4 h-4" />
                    {ar ? "أبرز نقاط القوة (Strengths)" : "Core Strengths"}
                  </h4>
                  <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    {editorial.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <h4 className="flex items-center gap-2 font-bold text-amber-400 text-sm md:text-base">
                    <ThumbsDown className="w-4 h-4" />
                    {ar ? "ملاحظات ونقاط الضعف (Weaknesses)" : "Weaknesses / Critiques"}
                  </h4>
                  <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    {editorial.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Audience Suitability Guide */}
              <div className="rounded-2xl border border-border bg-secondary/20 p-5 md:p-6 space-y-4">
                <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  {ar ? "دليل المشاهد والجمهور المستهدف" : "FILMAK Audience Guide"}
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-sm">
                  {editorial.who_should_watch && (
                    <div className="space-y-1">
                      <span className="font-semibold text-emerald-400 block">
                        {ar ? "من يُنصح بمشاهدته:" : "Best For:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.who_should_watch}</p>
                    </div>
                  )}
                  {editorial.who_may_not_enjoy && (
                    <div className="space-y-1">
                      <span className="font-semibold text-amber-400 block">
                        {ar ? "من قد لا يناسبه:" : "May Not Enjoy:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.who_may_not_enjoy}</p>
                    </div>
                  )}
                  {editorial.mood && (
                    <div className="space-y-1">
                      <span className="font-semibold text-primary block">
                        {ar ? "المزاج العام:" : "Atmospheric Mood:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.mood}</p>
                    </div>
                  )}
                  {editorial.recommended_viewing && (
                    <div className="space-y-1">
                      <span className="font-semibold text-primary block">
                        {ar ? "جلسة المشاهدة المقترحة:" : "Viewing Setup:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.recommended_viewing}</p>
                    </div>
                  )}
                  {editorial.experience_level && (
                    <div className="space-y-1">
                      <span className="font-semibold text-primary block">
                        {ar ? "مستوى الخبرة السينمائية:" : "Cinematic Level:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.experience_level}</p>
                    </div>
                  )}
                  {editorial.content_notes && (
                    <div className="space-y-1">
                      <span className="font-semibold text-primary block">
                        {ar ? "ملاحظات المحتوى:" : "Content Notes:"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">{editorial.content_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Clear, honest placeholder when editorial review is not yet written */
            <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-6 md:p-8 text-center space-y-3">
              <Award className="w-10 h-10 text-muted-foreground mx-auto opacity-70" />
              <h3 className="text-lg font-bold text-foreground">
                {ar ? "المراجعة التحريرية قيد الإعداد" : "FILMAK Editorial Review Coming Soon"}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {ar
                  ? "هذا العمل مسجل حالياً في دليل فلمك بالاعتماد على البيانات الوصفية الرسمية من TMDB. يقوم فريقنا النقدي بمشاهدة وتقييم الأعمال تباعاً لإضافة حكم فلمك الأصلي. لديك رأي حول هذا الفيلم؟ شاركنا ملاحظاتك!"
                  : "This movie is cataloged using factual metadata from TMDB. An original critical assessment by our team is pending. Have thoughts on this title? Let us know!"}
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-2"
              >
                {ar ? "إرسال اقتراح أو رأي حول الفيلم ←" : "Submit feedback on this title →"}
              </Link>
            </div>
          )}
        </section>

        {/* AdSense Slot (placed below the main high-value editorial verdict) */}
        <div className="my-6">
          <AdSlot
            slot="1234567890"
            editorialEligible={hasSubstantialEditorial(editorial)}
            className="min-h-[100px]"
          />
        </div>

        {/* Watch providers */}
        {data.watch && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">
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
                className="text-primary text-xs underline"
              >
                {t("view_all_tmdb")}
              </a>
            )}
          </section>
        )}

        {/* Videos */}
        {data.videos.length > 0 && (
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Video className="w-5 h-5 text-primary" />
              {t("videos")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.videos.map((v: { key: string; name: string; type: string }) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setActiveVideo({ key: v.key, name: v.name })}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-muted text-left shadow-sm"
                >
                  <img
                    src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`}
                    alt={v.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="w-11 h-11 rounded-full bg-primary/90 grid place-items-center shadow-xl group-hover:scale-110 transition">
                      <Play className="w-4 h-4 fill-current text-primary-foreground" />
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
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
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
                  className={`group relative overflow-hidden rounded-xl bg-muted ${
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
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users className="w-5 h-5 text-primary" />
              {t("cast")}
            </h2>
            <div className="flex md:grid md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2">
              {data.cast.map((c: { id?: number; name: string; character: string; profile: string | null }) => (
                <Link
                  key={`${c.id ?? c.name}-${c.character}`}
                  to="/person/$id"
                  params={{ id: String(c.id ?? "") }}
                  disabled={!c.id}
                  className="text-center shrink-0 w-24 md:w-auto snap-start group"
                >
                  {c.profile ? (
                    <img
                      src={c.profile}
                      alt={c.name}
                      loading="lazy"
                      className="w-full aspect-square object-cover rounded-full mb-2 group-hover:ring-2 group-hover:ring-primary/60 transition"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-full mb-2 grid place-items-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-sm font-medium truncate group-hover:text-primary transition">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.character}</p>
                </Link>
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
          <section className="space-y-4">
            <h2 className="text-xl font-bold">{t("crew")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <CrewCard label={t("director")} names={data.crew.director} />
              <CrewCard label={t("writers")} names={data.crew.writers} />
              <CrewCard label={t("composer")} names={data.crew.composer} />
              <CrewCard label={t("cinematographer")} names={data.crew.cinematographer} />
              <CrewCard label={t("editor")} names={data.crew.editor} />
            </div>
          </section>
        )}

        {/* Details & Box Office */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
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
                    <span className="inline-flex items-center justify-center bg-white rounded-md px-1.5 py-1">
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="h-5 max-w-[80px] object-contain"
                        loading="lazy"
                      />
                    </span>
                  ) : (
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SIMILAR MOVIES WITH ORIGINAL EDITORIAL REASONING */}
        {/* ========================================================================= */}
        {data.similar.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {ar ? "أعمال مقترحة مع أسباب الترشيح" : "Curated Similar Movies & Recommendations"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? "ترشيحات منتقاة تشارك هذا العمل في الطابع البصري، الثيمة الفلسفية، أو البناء الدرامي."
                  : "Curated selections sharing narrative themes, director styles, or atmospheric tension."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.similar.map((m: { id: number; title: string; poster: string | null; year: string; rating: number }) => {
                const reason = editorial?.similar_reasons?.[String(m.id)];
                return (
                  <div key={m.id} className="flex flex-col justify-between">
                    <Link
                      to="/movie/$id"
                      params={{ id: String(m.id) }} reloadDocument
                      className="group block flex-1"
                    >
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm">
                        {m.poster ? (
                          <img
                            src={m.poster}
                            alt={m.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center">
                            <Film className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          {m.rating}
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-semibold truncate group-hover:text-primary transition">
                        {m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.year}</p>
                    </Link>

                    {reason && (
                      <div className="mt-2 text-[11px] leading-tight text-primary/90 bg-primary/10 border border-primary/20 rounded-xl p-2 font-medium">
                        💡 {reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* External Data Attribution Notice at bottom */}
        <section className="rounded-2xl border border-border/60 bg-secondary/30 p-5 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {ar ? "إشعار الشفافية ومصادر البيانات:" : "Transparency & Attribution Notice:"}
          </div>
          <p>
            {ar
              ? "البيانات الواقعية (تاريخ الإصدار، طاقم العمل، الملصقات، وبيانات شباك التذاكر) مستمدة من TMDB. التحليلات النقدية، حكم فلمك، ونقاط القوة والضعف وأسباب الترشيح هي محتوى تحريري أصلي خاص بمنصة فلمك."
              : "Factual metadata is provided by TMDB. FILMAK Verdict scores, critical commentary, strengths/weaknesses, and recommendation reasons are original editorial creations of FILMAK."}
          </p>
        </section>
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

function DecisionCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-primary">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xs md:text-sm leading-relaxed text-muted-foreground">{value}</p>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number | null | undefined }) {
  if (!score || score <= 0) return null;
  const percentage = Math.min(100, Math.max(0, (score / 10) * 100));
  const getColor = (val: number) => {
    if (val >= 8.5) return "from-amber-400 to-emerald-400";
    if (val >= 7.0) return "from-primary to-emerald-500";
    if (val >= 5.0) return "from-amber-500 to-primary";
    return "from-rose-500 to-amber-500";
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-3.5 space-y-2 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-foreground/90">{label}</span>
        <span className="text-primary font-bold">{score.toFixed(1)}/10</span>
      </div>
      <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor(score)} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
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
        {items.map((p) =>
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
          ),
        )}
      </div>
    </div>
  );
}