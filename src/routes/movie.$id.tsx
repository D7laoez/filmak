import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowRight, Star, Clock, Calendar, Play, Loader2, Film } from "lucide-react";
import { getMovieDetails } from "@/lib/movies.functions";
import { FavoriteButton } from "@/components/FavoriteButton";

export const Route = createFileRoute("/movie/$id")({
  component: MoviePage,
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    await context.queryClient.ensureQueryData({
      queryKey: ["movie", id],
      queryFn: () => getMovieDetails({ data: { id } }),
    });
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold mb-2">تعذّر تحميل الفلم</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          >
            حاول مجدداً
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">غير موجود</div>,
});

function MoviePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}

function Content() {
  const { id } = Route.useParams();
  const numId = Number(id);
  const { data } = useSuspenseQuery({
    queryKey: ["movie", numId],
    queryFn: () => getMovieDetails({ data: { id: numId } }),
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Backdrop hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full">
        {data.backdrop && (
          <img
            src={data.backdrop}
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="max-w-6xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5 text-sm hover:bg-black/70 transition"
            >
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {data.poster ? (
            <img
              src={data.poster}
              alt={data.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl shrink-0 mx-auto md:mx-0"
            />
          ) : (
            <div className="w-48 md:w-64 aspect-[2/3] bg-muted rounded-xl flex items-center justify-center mx-auto md:mx-0">
              <Film className="w-10 h-10" />
            </div>
          )}

          <div className="flex-1 pt-4 md:pt-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">{data.title}</h1>
            {data.tagline && (
              <p className="text-muted-foreground italic mb-4">{data.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Star className="w-4 h-4 fill-primary" />
                {data.rating}
              </span>
              {data.year && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {data.year}
                </span>
              )}
              {data.runtime ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {data.runtime} د
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {data.genres.map((g: string) => (
                <span
                  key={g}
                  className="text-xs px-3 py-1 rounded-full bg-secondary border border-border"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="text-base leading-relaxed max-w-3xl">{data.overview}</p>

            {data.trailerKey && (
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://www.youtube.com/watch?v=${data.trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  شاهد الإعلان الرسمي
                </a>
                <FavoriteButton
                  movie={{
                    id: data.id,
                    title: data.title,
                    poster: data.poster,
                    year: data.year,
                    rating: data.rating,
                  }}
                />
              </div>
            )}
            {!data.trailerKey && (
              <div className="mt-6">
                <FavoriteButton
                  movie={{
                    id: data.id,
                    title: data.title,
                    poster: data.poster,
                    year: data.year,
                    rating: data.rating,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Watch providers */}
        {data.watch && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">
              أين تشاهد الفلم
              {data.watchCountry && (
                <span className="text-sm text-muted-foreground mr-2">({data.watchCountry})</span>
              )}
            </h2>
            <ProviderGroup label="بالاشتراك" items={data.watch.flatrate} />
            <ProviderGroup label="تأجير" items={data.watch.rent} />
            <ProviderGroup label="شراء" items={data.watch.buy} />
            {data.watch.link && (
              <a
                href={data.watch.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm underline"
              >
                عرض كل الخيارات على TMDB
              </a>
            )}
          </section>
        )}

        {/* Cast */}
        {data.cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">طاقم التمثيل</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {data.cast.map((c: { name: string; character: string; profile: string | null }) => (
                <div key={c.name} className="text-center">
                  {c.profile ? (
                    <img
                      src={c.profile}
                      alt={c.name}
                      className="w-full aspect-square object-cover rounded-full mb-2"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-full mb-2" />
                  )}
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {data.similar.length > 0 && (
          <section className="mt-12 mb-16">
            <h2 className="text-xl font-bold mb-4">أفلام مشابهة</h2>
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
    </div>
  );
}

function ProviderGroup({
  label,
  items,
}: {
  label: string;
  items: { name: string; logo: string }[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {items.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
          >
            <img src={p.logo} alt={p.name} className="w-8 h-8 rounded" />
            <span className="text-sm">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}