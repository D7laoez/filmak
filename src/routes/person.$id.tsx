import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ArrowRight, Users, Film, Tv as TvIcon, Star, ExternalLink } from "lucide-react";
import { getPersonDetails, type PersonCredit } from "@/lib/person.functions";
import { useT, useLocale } from "@/lib/i18n";
import { Spinner } from "@/components/Spinner";
import { getRequestOrigin } from "@/lib/origin.functions";
import { NavToggles } from "@/components/NavToggles";

export const Route = createFileRoute("/person/$id")({
  component: PersonPage,
  loader: async ({ context, params }) => {
    const id = params.id;
    const [person, origin] = await Promise.all([
      context.queryClient
        .ensureQueryData({
          queryKey: ["person", id, "ar"],
          queryFn: () => getPersonDetails({ data: { id, lang: "ar" } }),
        })
        .catch(() => null),
      getRequestOrigin().catch(() => "https://filmak.site"),
    ]);
    return { person, origin };
  },
  head: ({ params, loaderData }) => {
    const origin = loaderData?.origin ?? "";
    const p = loaderData?.person;
    const img = p?.profile ?? `${origin}/icon-512.png`;
    const abs = img?.startsWith("http") ? img : `${origin}${img}`;
    const title = p ? `${p.name} — فلمك · السيرة الذاتية والأعمال` : "فلمك";
    const desc = p?.biography?.slice(0, 200) ?? "";
    const url = origin ? `${origin}/person/${params.id}` : `/person/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { property: "og:image", content: abs },
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
          <h1 className="text-2xl font-bold mb-2">{t("error_title")}</h1>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">404</div>,
});

function PersonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size={72} />
        </div>
      }
    >
      <PersonInner />
    </Suspense>
  );
}

function PersonInner() {
  const { id } = Route.useParams();
  const t = useT();
  const { dir, locale } = useLocale();
  const { data } = useSuspenseQuery({
    queryKey: ["person", id, "ar"],
    queryFn: () => getPersonDetails({ data: { id, lang: "ar" } }),
  });

  const [tab, setTab] = useState<"cast" | "crew">("cast");
  const credits = tab === "cast" ? data.cast : data.crew;
  const movies = credits.filter((c) => c.mediaType === "movie");
  const tvs = credits.filter((c) => c.mediaType === "tv");

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
            {t("back")}
          </Link>
          <NavToggles />
        </div>

        {/* Header */}
        <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8 mb-10">
          <div>
            {data.profile ? (
              <img
                src={data.profile}
                alt={data.name}
                className="w-full aspect-[2/3] object-cover rounded-2xl shadow-xl ring-1 ring-white/10"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-muted grid place-items-center">
                <Users className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{data.name}</h1>
              {data.knownFor && (
                <p className="text-sm text-muted-foreground mt-1">{data.knownFor}</p>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {data.birthday && (
                <div>
                  <dt className="text-muted-foreground">{locale === "ar" ? "تاريخ الميلاد" : "Born"}</dt>
                  <dd className="font-medium">{fmtDate(data.birthday)}</dd>
                </div>
              )}
              {data.deathday && (
                <div>
                  <dt className="text-muted-foreground">{locale === "ar" ? "تاريخ الوفاة" : "Died"}</dt>
                  <dd className="font-medium">{fmtDate(data.deathday)}</dd>
                </div>
              )}
              {data.placeOfBirth && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">{locale === "ar" ? "مكان الميلاد" : "Place of birth"}</dt>
                  <dd className="font-medium">{data.placeOfBirth}</dd>
                </div>
              )}
            </dl>
            {data.biography && (
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {locale === "ar" ? "نبذة" : "Biography"}
                </h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {data.biography}
                </p>
              </div>
            )}
            {data.imdbId && (
              <a
                href={`https://www.imdb.com/name/${data.imdbId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                IMDb <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border/50 mb-6">
          <button
            onClick={() => setTab("cast")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === "cast" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "ar" ? "كممثل" : "As Actor"}
            <span className="text-xs opacity-70">({data.cast.length})</span>
          </button>
          {data.crew.length > 0 && (
            <button
              onClick={() => setTab("crew")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                tab === "crew" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {locale === "ar" ? "كطاقم عمل" : "As Crew"}
              <span className="text-xs opacity-70">({data.crew.length})</span>
            </button>
          )}
        </div>

        {/* Movies */}
        {movies.length > 0 && (
          <CreditGrid
            title={locale === "ar" ? "الأفلام" : "Movies"}
            icon={<Film className="w-5 h-5 text-primary" />}
            items={movies}
          />
        )}

        <div className="my-8">
        </div>

        {/* TV */}
        {tvs.length > 0 && (
          <CreditGrid
            title={locale === "ar" ? "المسلسلات" : "TV Shows"}
            icon={<TvIcon className="w-5 h-5 text-primary" />}
            items={tvs}
          />
        )}

        {credits.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {locale === "ar" ? "لا توجد أعمال" : "No credits"}
          </div>
        )}
      </div>
    </div>
  );
}

function CreditGrid({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: PersonCredit[];
}) {
  return (
    <section className="mb-10">
      <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
        {icon}
        {title}
        <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((c) => (
          <Link
            key={`${c.mediaType}-${c.id}`}
            to={c.mediaType === "tv" ? "/tv/$id" : "/movie/$id"}
            params={{ id: String(c.id) }}
            className="group block"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {c.poster ? (
                <img
                  src={c.poster}
                  alt={c.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Film className="w-8 h-8" />
                </div>
              )}
              {c.rating > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {c.rating}
                </div>
              )}
            </div>
            <div className="mt-2">
              <h3 className="text-sm font-medium truncate group-hover:text-primary transition">
                {c.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {c.year}
                {c.character ? ` · ${c.character}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}