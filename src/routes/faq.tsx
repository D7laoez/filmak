import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, CircleHelp } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { NavToggles } from "@/components/NavToggles";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — فلمك | Filmak FAQ" },
      { name: "description", content: "إجابات عن البحث والترشيحات والحساب والمفضلة في فلمك." },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/faq" }],
  }),
  component: FAQPage,
});

function FAQPage() {
  const { locale, dir } = useLocale();
  const items = locale === "ar" ? [
    ["شنو هو فلمك؟", "فلمك منصة لاكتشاف الأفلام والمسلسلات، وتستخدم البحث الذكي والترشيحات لمساعدتك على الوصول للعمل المناسب بسرعة."],
    ["هل فلمك يوفر الأفلام للمشاهدة؟", "لا. فلمك يعرض معلومات الأعمال وروابط وخيارات المشاهدة المتاحة عندما تكون البيانات متوفرة، ولا يستضيف المحتوى المحمي بحقوق النشر."],
    ["هل أحتاج حساب؟", "لاستخدام البحث والتصفح لا تحتاج حسابًا. الحساب يفيدك في مزامنة المفضلة وقائمة المشاهدة وسجل المشاهدة والإحصائيات عبر أجهزتك."],
    ["من أين تأتي بيانات الأفلام؟", "نستخدم بيانات TMDB لعرض معلومات الأفلام والمسلسلات، مع توضيح أن فلمك غير معتمد أو مصدق عليه من TMDB."],
    ["هل يدعم فلمك العربية والإنجليزية؟", "نعم. الواجهة والمحتوى النصي الأساسي يدعمان العربية والإنجليزية مع RTL وLTR."],
    ["كيف أبلغ عن مشكلة؟", "إذا واجهت صفحة مكسورة أو بيانات غير صحيحة، احتفظ برابط الصفحة والمعلومة التي ظهرت بشكل خاطئ ثم تواصل مع إدارة الموقع."],
  ] : [
    ["What is Filmak?", "Filmak is a movie and TV discovery platform that combines search and recommendations to help you find what to watch faster."],
    ["Does Filmak stream movies?", "No. Filmak provides movie information and available viewing options when data is available; it does not host copyrighted video content."],
    ["Do I need an account?", "Browsing and discovery do not require an account. An account lets you sync favorites, watchlist, watched items and stats across devices."],
    ["Where does movie data come from?", "Filmak uses TMDB data for movie and TV information and is not endorsed or certified by TMDB."],
    ["Does Filmak support Arabic and English?", "Yes. The interface supports Arabic and English with automatic RTL/LTR direction."],
    ["How do I report a problem?", "Keep the affected page URL and describe the issue or incorrect information, then contact the site administration."],
  ];
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return <main dir={dir} className="min-h-screen bg-background text-foreground pb-24"><div className="max-w-4xl mx-auto px-4 py-6"><div className="flex items-center justify-between mb-12"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link><NavToggles /></div><header className="text-center mb-10"><div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center text-primary"><CircleHelp /></div><h1 className="mt-5 text-4xl md:text-5xl font-black">{locale === "ar" ? "الأسئلة الشائعة" : "Frequently asked questions"}</h1><p className="mt-4 text-muted-foreground">{locale === "ar" ? "كل ما تحتاج تعرفه عن فلمك." : "Everything you need to know about Filmak."}</p></header><div className="space-y-3">{items.map(([q, a]) => <details key={q} className="group rounded-2xl border border-border bg-card p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold"><span>{q}</span><ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="pt-4 leading-7 text-muted-foreground">{a}</p></details>)}</div></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></main>;
}
