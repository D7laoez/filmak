import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Film,
  Info,
  Sparkles,
  Target,
  ShieldCheck,
  Award,
  Users,
  BookOpen,
  Scale,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — فلمك | About Filmak" },
      {
        name: "description",
        content:
          "تعرف على منصة فلمك، رؤيتنا في تقديم ترشيحات سينمائية ذكية ومقالات نقدية أصلية تجمع بين دقة البيانات وعمق التحليل التحريري.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const features = ar
    ? [
        {
          icon: Target,
          title: "ترشيحات ذكية باللغة الطبيعية",
          desc: "نحوّل وصفك العفوي ومزاجك إلى اقتراحات دقيقة تختصر ساعات التردد والتصفح الممل.",
        },
        {
          icon: Award,
          title: "محتوى تحريري أصلي",
          desc: "نكتب مقالات وأدلة مشاهدة معمقة ومراجعات أصلية تجيب عن: لماذا تشاهد هذا العمل؟ ولمن يناسب؟",
        },
        {
          icon: Scale,
          title: "شفافية مطلقة في البيانات",
          desc: "نفصل بوضوح بين البيانات الواقعية المستمدة من TMDB والآراء النقدية الخاصة بهيئة تحرير فلمك.",
        },
        {
          icon: Sparkles,
          title: "تجربة عربية متكاملة",
          desc: "مصممة بالكامل لتخدم المستخدم العربي باتجاه RTL ومصطلحات سينمائية أصيلة، مع دعم كامل للإنجليزية.",
        },
      ]
    : [
        {
          icon: Target,
          title: "Natural-Language Discovery",
          desc: "Transform your casual thoughts, moods, and specific preferences into precise, hand-picked recommendations.",
        },
        {
          icon: Award,
          title: "Original Editorial Content",
          desc: "Curated guides, in-depth breakdowns, and objective reviews answering: 'Why watch this?' and 'Who is it for?'.",
        },
        {
          icon: Scale,
          title: "Data Transparency",
          desc: "Clear distinction between factual metadata (TMDB) and original FILMAK critical analysis.",
        },
        {
          icon: Sparkles,
          title: "Arabic-First Global Platform",
          desc: "Engineered from the ground up for seamless Arabic RTL and English LTR international cinema lovers.",
        },
      ];

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border/40 bg-card/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs transition hover:bg-secondary mb-8"
          >
            <Arrow className="h-3.5 w-3.5" />
            {ar ? "الرئيسية" : "Home"}
          </Link>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold">
              <Info className="h-4 w-4" />
              {ar ? "عن المنصة" : "About Filmak"}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              {ar ? "منصة اكتشاف وتحليل سينمائي" : "A Movie Discovery & Editorial Platform"}{" "}
              <span className="text-primary">{ar ? "تحترم شغفك ووقتك" : "Built with Passion"}</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              {ar
                ? "تأسست فلمك لسد الفجوة بين قواعد بيانات الأفلام الجافة وبين القارئ والباحث عن تجربة سينمائية فريدة. نجمع بين قوة الذكاء الاصطناعي في الفهم الطبيعي لرغباتك وبين الرؤية النقدية والتحريرية لفريق من عشاق السينما."
                : "FILMAK bridges the gap between cold movie databases and cinema enthusiasts seeking authentic discovery. We combine natural language AI search with curated human editorial guides."}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
        {/* Features Grid */}
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              {ar ? "ما الذي يميزنا" : "What Makes Us Different"}
            </p>
            <h2 className="text-2xl md:text-3xl font-black">{ar ? "ركائز منصة فلمك" : "The Pillars of Filmak"}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="rounded-3xl border border-border bg-card p-6 md:p-7 space-y-3 transition hover:border-primary/40 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* How We Operate */}
        <section className="rounded-3xl border border-border bg-card p-7 md:p-10 space-y-6 shadow-sm">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {ar ? "كيف نصنع المحتوى التحريري والترشيحات؟" : "How We Create Content & Recommendations"}
          </h2>

          <div className="space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground">
            <p>
              {ar
                ? "1. **الترشيحات الذكية:** نستخدم نماذج لغوية متقدمة لفهم متطلباتك الدقيقة (مثال: 'أفلام خيال علمي فلسفية بدون عنف مفرط') ومطابقتها مع سجلات السينما العالمية المعتمدة."
                : "1. **Intelligent Recommendations:** We employ advanced natural language processing to match nuanced descriptions with real titles on verified cinematic databases."}
            </p>
            <p>
              {ar
                ? "2. **التحليل والمراجعات:** يقوم فريق التحرير بكتابة مراجعات 'حكم فلمك (FILMAK Verdict)' لأبرز الأعمال السينمائية، مع تفصيل نقاط القوة والضعف والجمهور المستهدف دون ادعاءات مضللة."
                : "2. **Editorial Analysis:** Our team crafts 'FILMAK Verdict' assessments detailing strengths, weaknesses, and audience suitability."}
            </p>
            <p>
              {ar
                ? "3. **الأدلة والمجلات:** ننشر مقالات دورية تستكشف التصنيفات الفرعية، سلاسل الأفلام، وروائع السينما العالمية المستقلة."
                : "3. **Guides & Magazine:** We publish deep-dive guides into subgenres, world cinema, and underappreciated classics."}
            </p>
          </div>
        </section>

        {/* TMDB Notice */}
        <section className="rounded-2xl border border-border/60 bg-secondary/30 p-6 space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">
            {ar ? "بيان الشفافية والإسناد (TMDB Attribution):" : "Attribution Statement:"}
          </p>
          <p>
            {ar
              ? "يستخدم هذا الموقع واجهة برمجة تطبيقات The Movie Database (TMDB) للحصول على البيانات الوصفية والإحصائية العامة، ولكنه غير معتمد أو مصدق عليه من قبل TMDB. جميع الآراء النقدية والمقالات المكتوبة هي نتاج هيئة تحرير فلمك الخاصة."
              : "This website uses the TMDB API for factual movie data but is not endorsed or certified by TMDB. All critical articles and verdict scores are original productions of the FILMAK editorial team."}
          </p>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            to="/articles"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/20"
          >
            {ar ? "تصفح المقالات والأدلة" : "Explore Editorial Guides"}
          </Link>
          <Link
            to="/editorial-policy"
            className="rounded-xl border border-border bg-secondary/70 px-6 py-3 text-sm font-semibold hover:bg-secondary transition"
          >
            {ar ? "السياسة التحريرية" : "Editorial Policy"}
          </Link>
          <Link
            to="/contact"
            className="rounded-xl border border-border bg-secondary/70 px-6 py-3 text-sm font-semibold hover:bg-secondary transition"
          >
            {ar ? "تواصل معنا" : "Contact Us"}
          </Link>
        </div>
      </div>
    </main>
  );
}
