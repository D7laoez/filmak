import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Flame, Star, Clock3, Heart, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getPopular, getTopRated, getTrending, type MovieCard } from "@/lib/movies.functions";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
  head: () => ({
    meta: [
      { title: "مجموعات فلمك — Filmak" },
      { name: "description", content: "مجموعات أفلام مختارة بعناية: الأفضل تقييماً، الرائجة، ومختارات لسهرة الليلة." },
    ],
  }),
});

function MovieRail({ title, icon, movies, dir }: { title: string; icon: React.ReactNode; movies: MovieCard[]; dir: "rtl" | "ltr" }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">{icon}{title}</h2>
        <Link to="/discover" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          {dir === "rtl" ? "اكتشف الكل" : "Explore all"}<ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {movies.slice(0, 12).map((movie) => (
          <Link key={movie.id} to="/movie/$id" params={{ id: String(movie.id) }} className="group min-w-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted border border-border/60 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
              {movie.poster ? <img src={movie.poster} alt={movie.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full flex items-center justify-center text-muted-foreground">No poster</div>}
              <div className="absolute top-2 right-2 rounded-full bg-black/75 px-2 py-1 text-[11px] text-white flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{movie.rating?.toFixed(1) ?? "—"}</div>
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{movie.title}</h3>
            {movie.year && <p className="text-xs text-muted-foreground mt-0.5">{movie.year}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

function CollectionsPage() {
  const { locale, dir } = useLocale();
  const trending = useQuery({ queryKey: ["collections-trending", locale], queryFn: () => getTrending({ data: { lang: locale } }) });
  const popular = useQuery({ queryKey: ["collections-popular", locale], queryFn: () => getPopular({ data: { lang: locale } }) });
  const topRated = useQuery({ queryKey: ["collections-top-rated", locale], queryFn: () => getTopRated({ data: { lang: locale } }) });
  const loading = trending.isLoading || popular.isLoading || topRated.isLoading;

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.18),transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-medium"><Sparkles className="w-3.5 h-3.5" />مختارات فلمك</div>
          <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">مو عارف شتشوف؟<br /><span className="text-primary">ابدأ من هنا.</span></h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-base md:text-lg">مجموعات جاهزة تختصر عليك وقت البحث، من أكثر الأفلام رواجاً إلى الأعمال التي تستحق المشاهدة فعلاً.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/pick" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Sparkles className="w-4 h-4" />اختارلي فيلم</Link>
            <Link to="/movie-night" className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold hover:bg-secondary"><Clock3 className="w-4 h-4" />ليلة الفيلم</Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {loading ? <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />)}</div> : <>
          <MovieRail title="رائجة الآن" icon={<Flame className="w-5 h-5 text-primary" />} movies={trending.data ?? []} dir={dir} />
          <MovieRail title="الأعلى تقييماً" icon={<Star className="w-5 h-5 text-primary" />} movies={topRated.data ?? []} dir={dir} />
          <MovieRail title="الأكثر شعبية" icon={<Heart className="w-5 h-5 text-primary" />} movies={popular.data ?? []} dir={dir} />
        </>}
      </div>
    </main>
  );
}
