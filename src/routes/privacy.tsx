import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/i18n";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => {
    const title = "سياسة الخصوصية — فلمك";
    const description = "سياسة الخصوصية لمنصة فلمك. تعرف على كيفية تعاملنا مع بياناتك وحرصنا التام على خصوصية المستخدمين أثناء تصفح الموقع.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{t("privacy_policy")}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-3xl font-bold mb-6">{t("privacy_policy")}</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t("privacy_content")}
          </p>

          <div className="mt-8 space-y-8">
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                {t("data_protection")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                نحن نلتزم بحماية بياناتك الشخصية. المعلومات التي يتم جمعها تُستخدم فقط لتحسين تجربتك في الموقع. لن يتم بيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية دون موافقتك الصريحة.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                {t("user_rights")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                لك الحق في الوصول إلى بياناتك المخزنة محلياً، تعديلها، أو مسحها في أي وقت. كما يمكنك اختيار عدم تقديم أي معلومات اختيارية دون أن يؤثر ذلك على وظائف الموقع الأساسية.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                {t("terms_of_use")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                باستخدامك لموقع فلمك، فإنك توافق على شروط الاستخدام الموضحة هنا. الموقع مخصص للاستخدام الشخصي وغير التجاري. يمنع استخدام أي أدوات آلية لسحب البيانات من الموقع بشكل يضر بأدائه.
              </p>
            </section>

            <section className="pt-8 border-t border-border">
              <h3 className="text-xl font-semibold mb-3">TMDB API</h3>
              <p className="text-muted-foreground italic text-sm">
                {t("footer")}
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Cookies & Local Storage</h3>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم التخزين المحلي (Local Storage) لحفظ تفضيلاتك مثل المظهر (داكن/فاتح) واللغة، ولحفظ قائمة مفضلاتك. هذه البيانات تبقى على جهازك الخاص ولا يتم إرسالها إلى خوادمنا.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
