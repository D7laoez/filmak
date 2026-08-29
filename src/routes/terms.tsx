import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام — فلمك | Terms of Service" },
      {
        name: "description",
        content: "شروط وأحكام استخدام منصة فلمك لاكتشاف وتصفح الأفلام والمسلسلات والمقالات التحريرية.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const terms = ar
    ? [
        [
          "1. طبيعة المنصة",
          "فلمك هي منصة معلوماتية وتحريرية لاكتشاف الأفلام والمسلسلات وتقديم الترشيحات الذكية والمقالات النقدية. المنصة لا تستضيف، ولا تبث، ولا ترفع أي ملفات فيديو أو وسائط محمية بحقوق النشر.",
        ],
        [
          "2. استخدام البيانات الخارجية",
          "تستخدم المنصة واجهة برمجة تطبيقات The Movie Database (TMDB) للحصول على البيانات الوصفية والإحصائية العامة. جميع حقوق العلامات التجارية والبيانات الفنية تخضع لشروط المزود الأصلي.",
        ],
        [
          "3. المحتوى التحريري وحقوق الملكية",
          "جميع المقالات، المراجعات، أدلة المشاهدة، والتقييمات التحريرية المنشورة على فلمك هي ملكية فكرية خاصة بالمنصة ويحظر نسخها أو إعادة نشرها بدون إذن مسبق أو إسناد واضح.",
        ],
        [
          "4. الحسابات واستخدام الخدمة",
          "يلتزم المستخدم بالحفاظ على سرية بيانات حسابه واستخدام ميزات المنصة (مثل المفضلة وقوائم المشاهدة والبحث الذكي) لأغراض الاستخدام الشخصي المشروع.",
        ],
        [
          "5. حدود المسؤولية",
          "نبذل قصارى جهدنا لضمان دقة وتحديث البيانات التحريرية والتقنية، إلا أن المنصة تُقدم 'كما هي' دون أي ضمانات صريحة أو ضمنية بخصوص توفر المحتوى الخارجي أو خدمات البث التابعة لجهات خارجية.",
        ],
      ]
    : [
        [
          "1. Platform Nature",
          "FILMAK is an informational and editorial movie discovery platform providing intelligent recommendations, guides, and critical reviews. The platform does not host, stream, or upload copyrighted video media.",
        ],
        [
          "2. External Data Usage",
          "We utilize The Movie Database (TMDB) API for general metadata. All associated trademarks and metadata remain property of their respective owners.",
        ],
        [
          "3. Editorial Content & Copyright",
          "All original articles, editorial reviews, guides, and scores published on FILMAK constitute protected intellectual property and may not be reproduced without explicit attribution.",
        ],
        [
          "4. User Accounts & Acceptable Use",
          "Users are responsible for maintaining account security and utilizing discovery features (favorites, watchlists, search) for lawful, personal purposes.",
        ],
        [
          "5. Limitation of Liability",
          "While we strive for accuracy, FILMAK is provided 'as is' without warranties regarding external third-party streaming availability.",
        ],
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
            <FileText className="w-3.5 h-3.5" />
            {ar ? "الاتفاقية القانونية" : "Legal Agreement"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {ar ? "شروط الاستخدام" : "Terms of Service"}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            {ar
              ? "يرجى قراءة شروط استخدام منصة فلمك بعناية قبل تصفح الموقع أو استخدام ميزات الحساب والترشيحات."
              : "Please review these Terms of Service carefully before utilizing the FILMAK platform."}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {terms.map(([title, text]) => (
          <section key={title} className="rounded-2xl border border-border bg-card p-6 md:p-7 space-y-2">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm md:text-base leading-relaxed text-muted-foreground">{text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
