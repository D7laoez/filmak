import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles, Star, Film, BookOpen, Compass } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { tmdbGet } from "@/lib/tmdb.server";

const COLLECTIONS = {
  "best-movies-2026": {
    ar: "أفضل أفلام 2026",
    en: "Best Movies of 2026",
    genre: "",
    year: 2026,
    descAr: "أبرز الإصدارات السينمائية الجديدة لعام 2026 المنتقاة بعناية لمساعدتك على متابعة أهم أعمال العام.",
    descEn: "A carefully curated selection of the most notable new cinematic releases from 2026.",
    editorialIntroAr: "شهد عام 2026 تنوعاً مبهراً في الإنتاجات السينمائية بين الخيال العلمي الملحمي، والدراما المستقلة المكثفة، والتجارب الإخراجية المبتكرة. اخترنا لك هنا الأعمال التي تستحق المشاهدة والتقييم.",
    editorialIntroEn: "2026 delivered an impressive array of cinematic achievements across science fiction, intimate independent drama, and visionary directing. Here are the defining releases of the year.",
  },
  "horror-movies": {
    ar: "أفضل أفلام الرعب والغموض",
    en: "Best Horror Movies",
    genre: "27",
    descAr: "أفلام رعب قوية لمحبي التوتر والأجواء المظلمة والرعب النفسي العميق.",
    descEn: "Horror masterworks for fans of psychological dread, atmosphere, and unrelenting suspense.",
    editorialIntroAr: "يتجاوز الرعب السينمائي الفزعات السطحية ليأخذنا في رحلة داخل أعمق المخاوف الإنسانية. هذه المجموعة تضم أعمالاً رائدة في بناء الأجواء الخانقة والتوتر النفسي الصاعد.",
    editorialIntroEn: "True horror transcends cheap jump scares into psychological dread and atmospheric terror. This collection highlights the finest films exploring the darker corners of human fear.",
  },
  "romantic-movies": {
    ar: "أفضل الأفلام الرومانسية",
    en: "Best Romantic Movies",
    genre: "10749",
    descAr: "اختيارات رومانسية عذبة تجمع بين دفء المشاعر والقصص الإنسانية الصادقة.",
    descEn: "Romantic cinema ranging from timeless classics to poignant modern relationships.",
    editorialIntroAr: "السينما الرومانسية حين تُصنع بصدق تلامس أوتار القلوب وتخلد لحظات الشوق واللقاء والتضحية. استمتع بأعمال تبتعد عن الابتذال وتقدم دراما عاطفية راقية.",
    editorialIntroEn: "Intimate, heartfelt, and resonant stories of human connection, longing, and romance crafted with genuine emotional honesty.",
  },
  "action-movies": {
    ar: "أفضل أفلام الأكشن والإثارة",
    en: "Best Action Movies",
    genre: "28",
    descAr: "أكشن ومطاردات ومعارك مصممة بحرفية عالية لمن يريد جرعة حماس وأدرينالين.",
    descEn: "High-octane choreography, breathtaking stunts, and non-stop momentum.",
    editorialIntroAr: "الأكشن ليس مجرد انفجارات؛ بل هو فن كوريغرافيا القتال وضبط إيقاع المطاردات وتصميم المجازفات الحية التي تحبس الأنفاس من اللقطة الأولى حتى الختام.",
    editorialIntroEn: "Action cinema at its peak: masterclass choreography, practical stunt mastery, and kinetic storytelling that keeps adrenaline pumping.",
  },
  "comedy-movies": {
    ar: "أفضل الأفلام الكوميدية",
    en: "Best Comedy Movies",
    genre: "35",
    descAr: "أفلام كوميدية ممتعة وذكية لسهرة خفيفة بدون تعقيد.",
    descEn: "Hilarious, uplifting, and smart comedies for an entertaining movie night.",
    editorialIntroAr: "الضحك فن رفيع، وهذه القائمة تجمع بين الكوميديا الذكية، والمواقف الطريفة، والحوارات الساخرة لتمنحك أمسية مريحة ترسم الابتسامة.",
    editorialIntroEn: "Laughter and brilliant situational wit: curated comedies that combine smart writing with genuine lighthearted entertainment.",
  },
  "sci-fi-movies": {
    ar: "أفضل أفلام الخيال العلمي",
    en: "Best Sci-Fi Movies",
    genre: "878",
    descAr: "عوالم مستقبلية، أسرار الفضاء، وأفكار فلسفية تتجاوز المألوف.",
    descEn: "Futuristic visions, cosmic mysteries, and mind-bending philosophical concepts.",
    editorialIntroAr: "مختبر الأفكار الكبرى؛ حيث يلتقي التفكير العلمي مع الأسئلة الوجودية حول الزمن، ومصير البشرية، وحدود الكون.",
    editorialIntroEn: "The ultimate frontier of speculative thought: where scientific concepts converge with existential inquiries about human destiny.",
  },
  "korean-movies": {
    ar: "أفضل الأفلام الكورية",
    en: "Best Korean Movies",
    genre: "",
    descAr: "اختيارات من السينما الكورية الجنوبية تجمع بين الإثارة والدراما والغموض.",
    descEn: "South Korean cinematic gems across gripping thrillers, domestic drama, and mystery.",
    language: "ko",
    editorialIntroAr: "السينما الكورية الجنوبية تشتهر بالحبكات غير المتوقعة والشخصيات المعقدة والجرأة الفنية النادرة. إليك أفضل ما أنتجته هذه السينما الرائدة.",
    editorialIntroEn: "South Korean cinema is renowned for fearless genre blending, intense psychological stakes, and unparalleled narrative surprises.",
  },
  "turkish-movies": {
    ar: "أفضل الأفلام التركية",
    en: "Best Turkish Movies",
    genre: "",
    descAr: "أعمال درامية وسينمائية تركية مميزة بالشخصيات القوية والقصص المؤثرة.",
    descEn: "Turkish cinema picks renowned for emotional resonance and evocative cinematography.",
    language: "tr",
    editorialIntroAr: "تتميز السينما التركية بعمقها الإنساني والدراما العاطفية الدافئة والتصوير البصري المستلهم من طبيعة وثقافة المنطقة.",
    editorialIntroEn: "Turkish cinema offers poetic visual beauty, intimate character studies, and profound emotional narratives.",
  },
  "arabic-movies": {
    ar: "أفضل الأفلام العربية",
    en: "Best Arabic Movies",
    genre: "",
    descAr: "أفلام عربية مختارة من مختلف المدارس السينمائية في المنطقة.",
    descEn: "Selected Arabic-language cinema representing diverse regional voices.",
    language: "ar",
    editorialIntroAr: "مختارات من أبرز إنتاجات السينما العربية التي تناولت الهوية والمجتمع وقصص الإنسان العربي برؤى إخراجية معاصرة ومتميزة.",
    editorialIntroEn: "A curated survey of modern Arabic cinema exploring identity, heritage, and compelling local stories.",
  },
  "movies-like-inception": {
    ar: "أفلام مثل Inception",
    en: "Movies Like Inception",
    genre: "878",
    descAr: "أفلام ذكية لمحبي الألغاز والواقع المتداخل والأفكار الذهنية الكبيرة.",
    descEn: "Smart thrillers for fans of layered realities, memory puzzles, and big concepts.",
    editorialIntroAr: "إذا كنت تعشق القصص التي تتلاعب بمفهوم الواقع وتجعلك تفكر في كل مشهد كأنه قطعة في لغز هندسي، فهذه هي القائمة المثالية لك.",
    editorialIntroEn: "If you thrive on non-linear narratives and reality-bending puzzles that reward active viewing, explore these mind-bending masterworks.",
  },
} as const;

type Collection = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }) => {
    const c = COLLECTIONS[params.slug as keyof typeof COLLECTIONS];
    if (!c) return { collection: null, items: [] };
    const p: Record<string, string> = {
      sort_by: "popularity.desc",
      include_adult: "false",
      page: "1",
      "vote_count.gte": "50",
    };
    if (c.genre) p.with_genres = c.genre;
    if ("year" in c && c.year) p.primary_release_year = String(c.year);
    if ("language" in c && c.language) p.with_original_language = c.language;
    const data = await tmdbGet<any>("/discover/movie", p, "en");
    return {
      collection: c,
      items: (data.results ?? [])
        .filter((x: any) => x.poster_path)
        .slice(0, 18)
        .map((x: any) => ({
          id: x.id,
          title: x.title || x.original_title,
          poster: `https://image.tmdb.org/t/p/w500${x.poster_path}`,
          year: (x.release_date || "").slice(0, 4),
          rating: Math.round((x.vote_average || 0) * 10) / 10,
          overview: x.overview || "",
        })),
    };
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
  const { dir, locale, t } = useLocale();
  const ar = locale === "ar";
  const { collection, items } = Route.useLoaderData();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

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

  const c = collection as Collection;

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
            <span className="text-foreground font-medium">{ar ? c.ar : c.en}</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1">
              <Sparkles className="w-3.5 h-3.5" />
              {ar ? "مختارات فلمك التحريرية" : "FILMAK Curated Selection"}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {ar ? c.ar : c.en}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {ar ? c.descAr : c.descEn}
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
            {ar ? c.editorialIntroAr : c.editorialIntroEn}
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
