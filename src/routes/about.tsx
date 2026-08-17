import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/i18n";
import { ArrowRight, Info } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => {
    const title = "من نحن — فلمك · تعرف على منصتنا";
    const description = "تعرف على منصة فلمك وكيف نستخدم تقنيات الذكاء الاصطناعي لمساعدتك في العثور على أفضل الأفلام والمسلسلات التي تناسب ذوقك الشخصي.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { t, dir } = useLocale();

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition group">
              <ArrowRight className={`w-4 h-4 transition-transform ${dir === 'rtl' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
              {t("back")}
            </Link>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">{t("about_us")}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-3xl font-bold mb-6">{t("brand")}</h2>
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("about_content")}
            </p>
            
            <section className="mt-8">
              <h3 className="text-xl font-bold mb-4">{t("why_filmak")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                في عالم مليء بملايين الأفلام والمسلسلات، نهدف في فلمك إلى تبسيط تجربة المشاهد العربي. نستخدم أحدث تقنيات الذكاء الاصطناعي لفهم ما تبحث عنه حقاً، سواء كنت تبحث عن فيلم يغير حالتك المزاجية أو مسلسل يشد أنفاسك حتى الحلقة الأخيرة.
              </p>
            </section>

            <section className="mt-8">
              <h3 className="text-xl font-bold mb-4">{t("our_vision")}</h3>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li>تقديم ترشيحات دقيقة ومخصصة لكل مستخدم.</li>
                <li>توفير واجهة مستخدم عربية سهلة وسريعة.</li>
                <li>تسهيل الوصول إلى معلومات الإنتاج، طاقم العمل، وأماكن المشاهدة.</li>
                <li>تطوير محرك بحث ذكي يفهم الأوصاف الطبيعية وليس فقط العناوين.</li>
              </ul>
            </section>

            <div className="mt-12 p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="text-xl font-bold mb-4 text-primary">{t("tagline_ai")}</h3>
              <p className="text-muted-foreground leading-relaxed italic">
                {t("hero_sub")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
