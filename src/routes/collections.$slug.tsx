import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles, Star, Film, BookOpen } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getCollectionMovies, COLLECTIONS_DATA } from "@/lib/editorial.functions";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }) => {
    try {
      const res = await getCollectionMovies({ data: { slug: params.slug } });
      return res;
    } catch {
      const c = COLLECTIONS_DATA[params.slug] ?? null;
      return { collection: c, items: [] };
    }
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.collection;
    const title = c ? `${c.ar} — مختارات فلمك | Filmak Collections` : "فلمك";
    const description = c?.descAr ?? "اكتشف أفلامك القادمة مع مجموعات فلمك التحريرية.";
    const url = `https://filmak.site/collections/${params.slug}`;

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://filmak.site/" },
        { "@type": "ListItem", position: 2, name: "المجموعات", item: "https://filmak.site/collections" },
        { "@type": "ListItem", position: 3, name: c?.ar || "مجموعة", item: url },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbLd),
        },
      ],
    };
  },
  component: CollectionDetailPage,
});

function CollectionDetailPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const loaderData = Route.useLoaderData();
  const collection = loaderData?.collection;
  const items = loaderData?.items ?? [];

  if (!collection) {
    return (
      <main dir={dir} className="min-h-screen grid place-items-center bg-background px-4">
        <div className="text-center max-w-md">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{ar ? "المجموعة غير موجودة" : "Collection Not Found"}</h1>
          <Link to="/collections" className="text-primary mt-4 inline-block font-semibold">
            {ar ? "الرجوع للمجموعات" : "Back to Collections"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="relative border-b border-border/40 bg-card/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <span>/</span>
            <Link to="/collections" className="hover:text-primary transition">
              {ar ? "المجموعات" : "Collections"}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{ar ? collection.ar : collection.en}</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1">
              <Sparkles className="w-3.5 h-3.5" />
              {ar ? "مختارات فلمك التحريرية" : "FILMAK Curated Selection"}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {ar ? collection.ar : collection.en}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {ar ? collection.descAr : collection.descEn}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Editorial Introduction Box */}
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8 space-y-2">
          <h2 className="text-base md:text-lg font-bold text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {ar ? "رأي هيئة التحرير حول هذه المجموعة" : "Curator's Editorial Note"}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-foreground/90">
            {ar ? collection.editorialIntroAr : collection.editorialIntroEn}
          </p>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {items.map((m: any) => (
            <Link
              key={m.id}
              to="/movie/$id"
              params={{ id: String(m.id) }}
              className="group block space-y-2"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm group-hover:-translate-y-1 group-hover:shadow-xl transition duration-300">
                <img
                  src={m.poster}
                  alt={`${m.title} — Filmak`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-2 right-2 rounded-full bg-black/75 backdrop-blur px-2 py-1 text-[11px] text-white flex items-center gap-1 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {m.rating}
                </div>
              </div>
              <h2 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition leading-tight">
                {m.title}
              </h2>
              <p className="text-xs text-muted-foreground">{m.year}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
