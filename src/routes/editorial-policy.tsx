import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ShieldCheck, Scale, FileText, Brain, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/editorial-policy")({
  head: () => ({
    meta: [
      { title: "السياسة التحريرية ومعايير التقييم — فلمك | Editorial Policy" },
      {
        name: "description",
        content:
          "تعرف على السياسة التحريرية لمنصة فلمك، معايير التقييم الخمسة، منهجية كتابة المراجعات الأصلية، والشفافية في استخدام البيانات والذكاء الاصطناعي.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/editorial-policy" }],
  }),
  component: EditorialPolicyPage,
});

function EditorialPolicyPage() {
  const { dir, locale, t } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const scoreCriteria = ar
    ? [
        {
          name: "حبكة القصة (Story Score)",
          desc: "تماسك البناء الدرامي، تطور الشخصيات، قوة الحوارات، ومصداقية التحولات السردية.",
        },
        {
          name: "الأداء التمثيلي (Acting Score)",
          desc: "إقناع الممثلين، التناغم بين طاقم العمل، وقدرتهم على تجسيد مشاعر الشخصية بصدق.",
        },
        {
          name: "الإبهار البصري والإخراج (Visuals Score)",
          desc: "جماليات التصوير، الإضاءة، المؤثرات البصرية، وتصميم الكادرات والبيئة السينمائية.",
        },
        {
          name: "المتعة العامة والإيقاع (Entertainment Score)",
          desc: "جاذبية الفيلم للمشاهد، ضبط الإيقاع الزمني دون ملل، وقيمته الترفيهية والفكرية.",
        },
      ]
    : [
        {
          name: "Narrative & Screenplay (Story Score)",
          desc: "Structural integrity, character progression, dialogue resonance, and narrative pacing.",
        },
        {
          name: "Performances (Acting Score)",
          desc: "Emotional authenticity, cast chemistry, and the depth of character portrayal.",
        },
        {
          name: "Cinematography & Direction (Visuals Score)",
          desc: "Visual composition, camera craft, atmospheric lighting, and production design.",
        },
        {
          name: "Engagement & Pacing (Entertainment Score)",
          desc: "Pacing coherence, emotional engagement, re-watchability, and intellectual value.",
        },
      ];

  const pillars = ar
    ? [
        {
          icon: ShieldCheck,
          title: "الاستقلالية والمصداقية",
          desc: "جميع تقييماتنا ومراجعاتنا التحريرية تُكتب باستقلالية تامة ولا تتأثر برعايات تجارية أو شركات إنتاج.",
        },
        {
          icon: Scale,
          title: "فصل البيانات عن الآراء",
          desc: "نميز بوضوح بين البيانات الوصفية الواقعية (المستمدة من TMDB) وبين التحليلات النقدية والتقييمات التحريرية الأصلية لفلمك.",
        },
        {
          icon: Brain,
          title: "شفافية الذكاء الاصطناعي",
          desc: "نستخدم الذكاء الاصطناعي كأداة بحث ذكية لمساعدة المستخدمين في العثور على الأفلام باللغة الطبيعية، بينما تُكتب المقالات النقدية والتقييمات التحريرية بأيدي فريق تحرير سينمائي.",
        },
        {
          icon: Users,
          title: "مراعاة الجمهور والتنوع",
          desc: "نقدم في دليل المشاهدة توضيحات دقيقة حول نوع الجمهور المناسب لكل عمل، ومستوى الخبرة السينمائية المقترحة، والأجواء المثالية.",
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "Independence & Integrity",
          desc: "All editorial assessments are crafted independently without influence from production studios or commercial sponsorships.",
        },
        {
          icon: Scale,
          title: "Data vs. Editorial Separation",
          desc: "We strictly differentiate external factual metadata (from TMDB) from original FILMAK critical analysis and scores.",
        },
        {
          icon: Brain,
          title: "AI Transparency",
          desc: "AI is utilized solely for natural-language discovery queries, while critical articles and editorial verdict scores are created by film curators.",
        },
        {
          icon: Users,
          title: "Audience Suitability",
          desc: "Every review features a dedicated audience guide highlighting mood, viewing setup, and suitability notes.",
        },
      ];

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="relative border-b border-border/40 bg-card/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 relative">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs hover:bg-secondary transition mb-6"
          >
            <Arrow className="w-3.5 h-3.5" />
            {ar ? "الرئيسية" : "Home"}
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold mb-4">
            <Award className="w-3.5 h-3.5" />
            {ar ? "معايير التحرير والنقد" : "Editorial Standards"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {ar ? "السياسة التحريرية ومعايير التقييم" : "Editorial Policy & Rating Methodology"}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            {ar
              ? "نلتزم في فلمك بتقديم محتوى تحريري ذي قيمة حقيقية، يقوم على الشفافية والتحليل الرصين واحترام وقت المشاهد وذكائه."
              : "At FILMAK, we are committed to providing substantial original value grounded in transparency, critical rigor, and respect for our audience's time."}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Core Pillars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">{ar ? "المبادئ التحريرية الأساسية" : "Core Editorial Principles"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rating Breakdown */}
        <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{ar ? "كيف نحدد تقييم فلمك (FILMAK Score)؟" : "How We Calculate the FILMAK Score"}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ar
                ? "تقييم فلمك ليس رقماً عشوائياً، بل هو محصلة دراسة متوازنة لأربعة محاور رئيسية في كل عمل سينمائي:"
                : "The FILMAK Editorial Score is derived from a balanced assessment of four core cinematic pillars:"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {scoreCriteria.map((c) => (
              <div key={c.name} className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  {c.name}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* External Data Transparency */}
        <section className="space-y-4 rounded-2xl border border-border/60 bg-secondary/20 p-6">
          <h2 className="text-lg font-bold">{ar ? "الشفافية في استخدام بيانات TMDB" : "TMDB Metadata Transparency"}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ar
              ? "نستخدم واجهة برمجة تطبيقات The Movie Database (TMDB) للحصول على البيانات الوصفية الواقعية (مثل تاريخ الإصدار، أسماء طاقم التمثيل، وتصنيفات الأنواع). يتم تمييز هذه البيانات بوضوح تام، ولا ننسبها ككتابة أصلية لمنصة فلمك. إن فلمك غير معتمد أو مصدق عليه رسمياً من قِبل TMDB."
              : "We utilize The Movie Database (TMDB) API for factual metadata (such as release dates, cast rosters, and genre tags). This data is clearly delineated from original FILMAK critical assessments. FILMAK is not endorsed or certified by TMDB."}
          </p>
        </section>
      </div>
    </main>
  );
}
