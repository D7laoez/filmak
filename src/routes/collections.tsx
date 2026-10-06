import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Flame, Star, Clock3, Heart, ArrowLeft, ArrowRight, LibraryBig, Film, Compass } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getPopular, getTopRated, getTrending, type MovieCard } from "@/lib/movies.functions";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
  head: () => ({
    meta: [
      { title: "مجموعات ومختارات فلمك التحريرية — Filmak Collections" },
      {
        name: "description",
        content: "مجموعات وقوائم أفلام منتقاة بعناية: اختيارات السهرة، أعمال الخيال العلمي، روائع السينما الكورية، وأفضل الأعمال تقييماً.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/collections" }],
  }),
});

const CURATED_LISTS = [
  {
    slug: "best-movies-2026",
    title_ar: "أفضل أفلام 2026",
    title_en: "Best Movies of 2026",
    desc_ar: "أبرز الإصدارات السينمائية الجديدة في 2026 المختارة بعناية.",
    desc_en: "The most notable new cinema releases of 2026.",
    badge: "جديد 2026",
  },
  {
    slug: "movies-like-inception",
    title_ar: "أفلام مثل Inception",
    title_en: "Movies Like Inception",
    desc_ar: "عوالم متداخلة وألغاز ذهنية وأفكار فلسفية كبيرة.",
    desc_en: "Mind-bending puzzles and layered realities.",
    badge: "إثارة ذهنية",
  },
  {
    slug: "sci-fi-movies",
    title_ar: "أفضل أفلام الخيال العلمي",
    title_en: "Best Sci-Fi Movies",
    desc_ar: "عوالم مستقبلية، أسرار الفضاء، وتحديات تتجاوز الزمان والمكان.",
    desc_en: "Futuristic frontiers, space mysteries, and cosmic wonder.",
    badge: "خيال علمي",
  },
  {
    slug: "horror-movies",
    title_ar: "أفضل أفلام الرعب والغموض",
    title_en: "Best Horror Movies",
    desc_ar: "أفلام رعب مظلمة وتوتر نفسي لمحبي الإثارة الحقيقية.",
    desc_en: "Dark atmosphere and psychological tension.",
    badge: "رعب",
  },
  {
    slug: "korean-movies",
    title_ar: "روائع السينما الكورية",
    title_en: "Best Korean Movies",
    desc_ar: "أفلام كورية مميزة تجمع بين الإثارة اللاهثة والدراما العميقة.",
    desc_en: "Unforgettable Korean cinema from thrillers to poignant drama.",
    badge: "سينما عالمية",
  },
  {
    slug: "comedy-movies",
    title_ar: "أفضل الأفلام الكوميدية",
    title_en: "Best Comedy Movies",
    desc_ar: "أعمال خفيفة وممتعة تضمن لك ضحكاً وأوقاتاً ممتعة.",
    desc_en: "Uplifting and hilarious comedies for an easy evening.",
    badge: "كوميديا",
  },
];

function MovieRail({
  title,
  icon,
  movies,
  dir,
}: {
  title: string;
  icon: React.ReactNode;
  movies: MovieCard[];
  dir: "rtl" | "ltr";
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
          {icon}
          {title}
        </h2>
        <Link
          to="/discover"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          {dir === "rtl" ? "اكتشف الكل" : "Explore all"}
          {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {movies.slice(0, 12).map((movie) => (
          <Link
            key={movie.id}
            to="/movie/$id"
            params={{ id: String(movie.id) }}
                      reloadDocument
            className="group min-w-0 block"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-muted border border-border/60 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Film className="w-8 h-8" />
                </div>
              )}
              <div className="absolute top-2 right-2 rounded-full bg-black/75 backdrop-blur px-2 py-1 text-[11px] text-white flex items-center gap-1 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {movie.rating?.toFixed(1) ?? "—"}
              </div>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary transition">
              {movie.title}
            </h3>
            {movie.year && <p className="text-xs text-muted-foreground mt-0.5">{movie.year}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CollectionsPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const trending = useQuery({
    queryKey: ["collections-trending", locale],
    queryFn: () => getTrending({ data: { lang: locale } }),
  });
  const popular = useQuery({
    queryKey: ["collections-popular", locale],
    queryFn: () => getPopular({ data: { lang: locale } }),
  });
  const topRated = useQuery({
    queryKey: ["collections-top-rated", locale],
    queryFn: () => getTopRated({ data: { lang: locale } }),
  });
  const loading = trending.isLoading || popular.isLoading || topRated.isLoading;

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <section className="relative overflow-hidden border-b border-border/40 bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.18),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs text-primary font-semibold">
            <LibraryBig className="w-3.5 h-3.5" />
            {ar ? "مختارات فلمك التحريرية" : "FILMAK Curated Collections"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {ar ? "مو عارف شتشوف الليلة؟" : "Not Sure What to Watch?"}
            <br />
            <span className="text-primary">{ar ? "ابدأ من هذه المجموعات." : "Start with Our Curated Collections."}</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-relaxed">
            {ar
              ? "قوائم منتقاة بعناية تختصر عليك عناء التردد وتأخذك مباشرة إلى أفضل الأعمال المصنفة حسب المزاج والنوع."
              : "Carefully curated movie lists organized by mood, genre, and thematic relevance to save your evening."}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/pick"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              {ar ? "اختارلي فيلم عشوائي" : "Pick a Movie"}
            </Link>
            <Link
              to="/movie-night"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-5 py-2.5 text-sm font-semibold hover:bg-secondary transition"
            >
              <Clock3 className="w-4 h-4" />
              {ar ? "مخطط سهرة الليلة" : "Movie Night Planner"}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {/* Curated Theme Collections Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {ar ? "مجموعات موضوعية منتقاة" : "Curated Thematic Collections"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CURATED_LISTS.map((list) => (
              <Link
                key={list.slug}
                to="/collections/$slug"
                params={{ slug: list.slug }}
                className="group rounded-3xl border border-border bg-card p-6 space-y-3 hover:border-primary/40 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {list.badge}
                  </span>
                  <h3 className="text-xl font-bold group-hover:text-primary transition">
                    {ar ? list.title_ar : list.title_en}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {ar ? list.desc_ar : list.desc_en}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1 group-hover:underline">
                  {ar ? "استعراض المجموعة ←" : "Explore Collection →"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Movie Rails */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <MovieRail
              title={ar ? "رائجة هذا الأسبوع" : "Trending This Week"}
              icon={<Flame className="w-5 h-5 text-primary" />}
              movies={trending.data ?? []}
              dir={dir}
            />
            <MovieRail
              title={ar ? "الأعلى تقييماً نقدياً" : "Top Rated Masterpieces"}
              icon={<Star className="w-5 h-5 text-primary" />}
              movies={topRated.data ?? []}
              dir={dir}
            />
            <MovieRail
              title={ar ? "الأكثر شعبية عالمياً" : "Most Popular Worldwide"}
              icon={<Heart className="w-5 h-5 text-primary" />}
              movies={popular.data ?? []}
              dir={dir}
            />
          </div>
        )}
      </div>
    </main>
  );
}
