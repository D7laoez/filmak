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
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition">
            <ArrowRight className="w-4 h-4" />
            {t("back")}
          </Link>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{t("about_us")}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-3xl font-bold mb-6">{t("brand")}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("about_content")}
          </p>
          
          <div className="mt-12 p-6 rounded-2xl bg-secondary/30 border border-border">
            <h3 className="text-xl font-bold mb-4">{t("tagline_ai")}</h3>
            <p className="text-muted-foreground">
              {t("hero_sub")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
