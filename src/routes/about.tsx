import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Brain, Film, Info, Sparkles, Target } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "من نحن — فلمك | About Filmak" }, { name: "description", content: "تعرف على فلمك، منصة اكتشاف الأفلام والمسلسلات والترشيحات الذكية بالعربية والإنجليزية." }], links: [{ rel: "canonical", href: "https://filmak.site/about" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { t, dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const cards = ar ? [
    [Target, "ترشيحات أذكى", "نحوّل وصفك الطبيعي ومزاجك وتفضيلاتك إلى اقتراحات تساعدك تختار أسرع."],
    [Film, "معلومات منظمة", "نوفر معلومات الأفلام والمسلسلات والطاقم والتقييمات والأنواع في تجربة واحدة واضحة."],
    [Sparkles, "تجربة عربية أولاً", "نصمم Filmak ليكون سريعًا وواضحًا بالعربية، مع دعم كامل للإنجليزية واتجاه RTL/LTR."],
    [Brain, "اكتشاف مستمر", "نطوّر البحث والترشيحات والملف الشخصي حتى تصبح الاقتراحات أقرب لذوقك مع الوقت."],
  ] : [
    [Target, "Smarter discovery", "We turn natural-language descriptions, moods and preferences into useful recommendations."],
    [Film, "Structured information", "Movie and TV details, cast, ratings and genres are brought together in one clear experience."],
    [Sparkles, "Arabic-first experience", "Filmak is designed for Arabic users while providing full English and RTL/LTR support."],
    [Brain, "Continuous discovery", "Search, recommendations and taste signals improve as the product evolves."],
  ];
  return <main dir={dir} className="min-h-screen bg-background text-foreground pb-24"><header className="relative overflow-hidden border-b border-border/40"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/.18),transparent_55%)]"/><div className="relative mx-auto max-w-5xl px-4 py-8 md:py-14"><Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm transition hover:bg-secondary"><Arrow className="h-4 w-4"/>{t("back")}</Link><div className="mt-10 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary"><Info className="h-4 w-4"/>{ar ? "من نحن" : "About Filmak"}</div><h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{ar ? "خلّ البحث عن الفيلم المناسب أسهل" : "Make finding the right movie easier"}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">{ar ? "فلمك منصة لاكتشاف الأفلام والمسلسلات، تجمع البحث التقليدي مع الترشيحات الذكية حتى توصل للمحتوى المناسب بدون ساعات من التصفح." : "Filmak is a movie and TV discovery platform combining classic search with intelligent recommendations so you can find what fits without endless scrolling."}</p></div></div></header><div className="mx-auto max-w-5xl space-y-12 px-4 py-10 md:py-14"><section><div className="mb-6"><p className="text-sm font-semibold text-primary">{ar ? "رؤيتنا" : "Our vision"}</p><h2 className="mt-1 text-3xl font-black">{ar ? "منصة اكتشاف عربية بمستوى عالمي" : "A world-class Arabic discovery platform"}</h2></div><div className="grid gap-4 md:grid-cols-2">{cards.map(([Icon,title,text]) => <article key={title} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30"><Icon className="mb-4 h-6 w-6 text-primary"/><h3 className="font-bold text-lg">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{text}</p></article>)}</div></section><section className="rounded-3xl border border-primary/20 bg-primary/5 p-7 md:p-10"><div className="mb-4 flex items-center gap-3"><Brain className="h-6 w-6 text-primary"/><h2 className="text-2xl font-bold">{ar ? "مدعوم بالذكاء الاصطناعي" : "Powered by AI"}</h2></div><p className="leading-8 text-muted-foreground">{ar ? "يمكنك وصف الفيلم الذي في بالك بدل البحث عن عنوان محدد، وفلمك يحاول تحويل الوصف إلى اقتراحات مناسبة." : "Describe the kind of movie you have in mind instead of searching only by title, and Filmak turns that description into recommendations."}</p></section><div className="flex flex-wrap gap-3"><Link to="/discover" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("discover")}</Link><Link to="/faq" className="rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-semibold">{ar ? "الأسئلة الشائعة" : "FAQ"}</Link></div></div></main>;
}
