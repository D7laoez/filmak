import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — فلمك | Privacy Policy" },
      {
        name: "description",
        content: "سياسة الخصوصية في فلمك وكيفية التعامل مع بيانات الحساب والقوائم والتفضيلات.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const sections = ar
    ? [
        [
          "البيانات التي نستخدمها",
          "عند تسجيل الدخول نستخدم معلومات الحساب التي يوفرها مزود المصادقة لإدارة الجلسة وربط القوائم بحسابك. نستخدم أيضًا بيانات الأفلام من TMDB لعرض المعلومات.",
        ],
        [
          "المفضلة والقوائم",
          "المفضلة وقائمة المشاهدة وسجل المشاهدة والتقييمات المرتبطة بالحساب تحفظ في قاعدة البيانات لتتمكن من الوصول إليها من أجهزتك. الوصول إليها محمي بحسب حساب المستخدم.",
        ],
        ["التفضيلات المحلية", "اللغة والمظهر وبعض إعدادات الواجهة قد تحفظ محليًا في متصفحك."],
        [
          "الإعلانات وملفات تعريف الارتباط",
          "قد تستخدم Google وشركاؤها ملفات تعريف الارتباط وتقنيات مشابهة لتقديم الإعلانات وقياسها، وقد تستند الإعلانات المخصصة إلى زياراتك السابقة لهذا الموقع أو مواقع أخرى. يمكنك إدارة تخصيص الإعلانات من إعدادات إعلانات Google أو إيقاف بعض الإعلانات المخصصة عبر AboutAds. قد تختلف الإعلانات وإعدادات الموافقة بحسب موقعك والقوانين المطبقة.",
          "https://support.google.com/adsense/answer/1348695?hl=ar",
        ],
        [
          "حقوقك",
          "يمكنك طلب حذف حسابك وبياناتك المرتبطة به، كما يمكنك حذف البيانات المحلية من إعدادات المتصفح.",
        ],
      ]
    : [
        [
          "Data we use",
          "When you sign in, we use account information supplied by the authentication provider to manage your session and associate lists with your account. Movie data comes from TMDB.",
        ],
        [
          "Favorites and lists",
          "Favorites, watchlist, watched items and ratings associated with your account are stored so you can access them across devices.",
        ],
        [
          "Local preferences",
          "Language, theme and some interface preferences may be stored locally in your browser.",
        ],
        [
          "Advertising cookies and personalization",
          "Google and its partners may use cookies or similar technologies to serve and measure ads. Personalized ads may be based on your previous visits to this site or other sites. You can manage personalized advertising in Google Ads Settings or opt out of some personalized ads through AboutAds. Ad delivery and consent options may vary by location and applicable law.",
          "https://support.google.com/adsense/answer/1348695?hl=en",
        ],
        [
          "Your rights",
          "You can request deletion of your account and associated data, and you can clear local browser data at any time.",
        ],
      ];
  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <Arrow className="w-4 h-4" />
            {ar ? "رجوع" : "Back"}
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
          </div>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-4xl font-black">{ar ? "خصوصيتك مهمة" : "Your privacy matters"}</h2>
        <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">
          {ar
            ? "نحاول إبقاء جمع البيانات في الحد اللازم لتشغيل الحساب وتحسين تجربة Filmak."
            : "We aim to keep data collection limited to what is needed to operate accounts and improve the Filmak experience."}
        </p>
        <div className="mt-10 space-y-5">
          {sections.map(([title, text, source]) => (
            <section key={title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 leading-8 text-muted-foreground">{text}</p>
              {source && (
                <p className="mt-3 text-sm">
                  <a
                    className="text-primary underline"
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {ar ? "معلومات إضافية من Google" : "More information from Google"}
                  </a>
                </p>
              )}
              {title ===
                (ar
                  ? "الإعلانات وملفات تعريف الارتباط"
                  : "Advertising cookies and personalization") && (
                <p className="mt-2 text-sm">
                  <a
                    className="text-primary underline"
                    href="https://adssettings.google.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Ads Settings
                  </a>
                  {" · "}
                  <a
                    className="text-primary underline"
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AboutAds opt-out
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
        <section className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6">
          <h3 className="font-bold">TMDB</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {ar
              ? "استخدم هذا الموقع بيانات TMDB ولكن لا يتم اعتماده أو التصديق عليه من قبل TMDB."
              : "This product uses the TMDB API but is not endorsed or certified by TMDB."}
          </p>
        </section>
      </article>
    </main>
  );
}
