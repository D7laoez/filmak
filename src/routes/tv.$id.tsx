import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ArrowRight, Star, Calendar, Play, Film, Tv as TvIcon } from "lucide-react";
import { getTvDetails } from "@/lib/tv.functions";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { useLocale, useT } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { getRequestOrigin } from "@/lib/origin.functions";
import { NavToggles } from "@/components/NavToggles";
import { TrailerModal } from "@/components/TrailerModal";

export const Route = createFileRoute("/tv/$id")({
  component: TvPage,
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    const [tv, origin] = await Promise.all([
      context.queryClient
        .ensureQueryData({
          queryKey: ["tv", id, "ar"],
          queryFn: () => getTvDetails({ data: { id, lang: "ar" } }),
        })
        .catch(() => null),
      getRequestOrigin().catch(() => "https://filmak.site"),
    ]);
    return { tv, origin };
  },
  head: ({ params, loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const tv = loaderData?.tv;
    const img = tv?.backdropLarge ?? tv?.poster ?? `${origin}/icon-512.png`;
    const abs = img?.startsWith("http") ? img : `${origin}${img}`;
    const title = tv ? `${tv.title} — فلمك · تفاصيل المسلسل` : "فلمك";
    const desc = tv?.overview?.slice(0, 200) ?? "";
    const url = origin ? `${origin}/tv/${params.id}` : `/tv/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "video.tv_show" },
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
          <img src="/icon-192.png" srcSet="/icon-192.png 1x, /icon-512.png 2x" alt={t("brand")} className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-bold mb-2">{t("error_load_movie")}</h1>
          <p className="text-muted-foreground mb-4 text-sm">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">{t("retry")}</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => {
    const t = useT();
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <img src="/icon-192.png" alt={t("brand")} className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-xl font-bold mb-2">{t("page_not_found_title")}</h1>
          <Link to="/" className="inline-block mt-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">{t("go_home")}</Link>
        </div>
      </div>
    );
  },
});

function TvPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size={64} label={t("loading")} /></div>}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const { id } = Route.useParams();
  const numId = Number(id);
  const { locale, dir, t } = useLocale();
  const { data } = useSuspenseQuery({
    queryKey: ["tv", numId, locale],
    queryFn: () => getTvDetails({ data: { id: numId, lang: locale } }),
  });
  const [trailerOpen, setTrailerOpen] = useState(false);

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <div className="relative h-[50vh] min-h-[400px] w-full">
        {data.backdrop && <img src={data.backdrop} alt={data.title} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <Link to="/" className="inline-flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5 text-sm hover:bg-black/70 transition">
              <ArrowRight className="w-4 h-4" />
              {t("back")}
            </Link>
            <NavToggles />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {data.poster ? (
            <img src={data.poster} alt={data.title} className="w-48 md:w-64 rounded-xl shadow-2xl shrink-0 mx-auto md:mx-0" />
          ) : (
            <div className="w-48 md:w-64 aspect-[2/3] bg-muted rounded-xl flex items-center justify-center mx-auto md:mx-0">
              <TvIcon className="w-10 h-10" />
            </div>
          )}
          <div className="flex-1 pt-4 md:pt-16">
            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/40 mb-2">
              <TvIcon className="w-3.5 h-3.5" /> {t("tv_series")}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{data.title}</h1>
            {data.tagline && <p className="text-muted-foreground italic mb-4">{data.tagline}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
              <span className="flex items-center gap-1 text-primary font-semibold"><Star className="w-4 h-4 fill-primary" />{data.rating}</span>
              {data.year && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-4 h-4" />{data.year}</span>}
              {data.seasons ? <span className="text-muted-foreground">{data.seasons} {t("seasons")}</span> : null}
              {data.episodes ? <span className="text-muted-foreground">{data.episodes} {t("episodes")}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {data.genres.map((g: string) => <span key={g} className="text-xs px-3 py-1 rounded-full bg-secondary border border-border">{g}</span>)}
            </div>
            <p className="text-base leading-relaxed max-w-3xl">{data.overview}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.trailerKey && (
                <button type="button" onClick={() => setTrailerOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition">
                  <Play className="w-4 h-4 fill-current" />{t("watch_trailer")}
                </button>
              )}
              <FavoriteButton mediaType="tv" movie={{ id: data.id, title: data.title, poster: data.poster, year: data.year, rating: data.rating }} />
              <ShareButton title={data.title} text={data.overview?.slice(0, 120)} />
            </div>
          </div>
        </div>

        {data.cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">{t("cast")}</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {data.cast.map((c: { id?: number; name: string; character: string; profile: string | null }) => (
                <Link
                  key={`${c.id ?? c.name}-${c.character}`}
                  to="/person/$id"
                  params={{ id: String(c.id ?? "") }}
                  disabled={!c.id}
                  className="text-center group"
                >
                  {c.profile ? (
                    <img src={c.profile} alt={c.name} className="w-full aspect-square object-cover rounded-full mb-2 group-hover:ring-2 group-hover:ring-primary/60 transition" />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-full mb-2" />
                  )}
                  <p className="text-sm font-medium truncate group-hover:text-primary transition">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.similar.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-xl font-bold mb-4">{t("similar")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.similar.map((m: { id: number; title: string; poster: string | null; year: string; rating: number }) => (
                <Link key={m.id} to="/tv/$id" params={{ id: String(m.id) }} className="group block">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {m.poster ? <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8" /></div>}
                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3 fill-primary text-primary" />{m.rating}</div>
                  </div>
                  <p className="mt-2 text-sm truncate group-hover:text-primary transition">{m.title}</p>
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
    </div>
  );
}
