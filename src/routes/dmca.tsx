import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldAlert, FileCheck, Mail } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "حقوق الملكية الفكرية وسياسة DMCA — فلمك | Copyright & DMCA" },
      {
        name: "description",
        content: "بيان حقوق الملكية الفكرية وسياسة قانون الألفية الرقمية (DMCA) المتبع في منصة فلمك.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/dmca" }],
  }),
  component: DmcaPage,
});

function DmcaPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

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
            <ShieldAlert className="w-3.5 h-3.5" />
            {ar ? "حماية الملكية الفكرية" : "Copyright Protection"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {ar ? "سياسة حقوق الملكية الفكرية (DMCA)" : "DMCA & Copyright Policy"}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            {ar
              ? "بيان الامتثال لقوانين حماية حقوق المؤلف الرقمية وطرق إرسال الإشعارات التحريرية والقانونية."
              : "Statement of compliance with digital copyright protections and notice submission protocols."}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold">{ar ? "طبيعة محتوى منصة فلمك" : "Nature of Hosted Content"}</h2>
          <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
            {ar
              ? "فلمك (filmak.site) هي منصة دليل رقمي وتحليلات نقدية تهدف إلى مساعدة عشاق السينما على استكشاف الأعمال وتتبع مفضلاتهم. المنصة لا تستضيف، ولا توفر روابط بث مباشر، ولا ترفع أي ملفات وسائط محمية بحقوق الطبع والنشر على خوادمها الخاصة."
              : "FILMAK (filmak.site) is a digital discovery and editorial platform. We do not host, stream, or store any copyrighted video files on our servers."}
          </p>
          <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
            {ar
              ? "الصور والملصقات والمعلومات الوصفية تُعرض من خلال واجهات برمجية رسمية مثل TMDB وYouTube لغايات الاستعراض النقدي والتعريف بالأعمال."
              : "Posters, backdrops, and promotional trailers are displayed via official APIs (TMDB and YouTube) under fair informational use."}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold">{ar ? "إجراءات إرسال إشعار انتهاك (DMCA Notice)" : "Filing a DMCA Notice"}</h2>
          <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
            {ar
              ? "إذا كنت مالكاً لحق من حقوق الملكية الفكرية أو ممثلاً معتمداً له، وتعتقد أن هناك محتوى نصياً أو صورة معروضة تنتهك حقوقك، يرجى تزويدنا بالمعلومات التالية:"
              : "If you believe any content on FILMAK infringes your copyright, please submit an official notice containing:"}
          </p>
          <ul className="list-disc ps-6 space-y-2 text-sm text-muted-foreground">
            <li>{ar ? "تحديد العمل المحمي بحقوق الطبع والنشر بدقة." : "Identification of the copyrighted work claimed to be infringed."}</li>
            <li>{ar ? "الرابط الدقيق (URL) للصفحة المعنية على موقع فلمك." : "The exact URL of the material on FILMAK."}</li>
            <li>{ar ? "معلومات الاتصال الخاصة بك (الاسم، البريد الإلكتروني، والصفة القانونية)." : "Your contact information (name, email, legal status)."}</li>
            <li>{ar ? "إقرار رسمي بصحة البيانات الواردة في الإشعار." : "A statement confirming the accuracy of the notice under penalty of perjury."}</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">{ar ? "جهة استلام إشعارات الحقوق" : "Designated DMCA Agent"}</h3>
            <p className="text-xs text-muted-foreground mt-1 font-mono">contact@filmak.site</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Mail className="w-4 h-4" />
            {ar ? "نموذج التواصل السريع" : "Contact Form"}
          </Link>
        </section>
      </div>
    </main>
  );
}
