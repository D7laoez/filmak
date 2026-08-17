import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Brain, Film, Info, Sparkles, Target } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "فلمك | Filmak — About Us" },
      {
        name: "description",
        content: "Learn more about Filmak, an AI-powered movie and TV discovery platform.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, dir } = useLocale();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const sections = [
    { icon: Target, text: t("about_content") },
    { icon: Sparkles, text: t("hero_sub") },
    { icon: Film, text: t("privacy_content") },
    { icon: Brain, text: t("data_protection") },
  ];

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm transition hover:bg-secondary"
          >
            <Arrow className="h-4 w-4" />
            {t("back")}
          </Link>

          <div className="mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary">
              <Info className="h-4 w-4" />
              {t("about_us")}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
              {t("why_filmak")}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">
              {t("about_content")}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 md:py-14">
        <section className="rounded-3xl border border-border bg-card/70 p-6 shadow-sm md:p-10">
          <div className="mb-5 flex items-center gap-3">
            <Film className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{t("about_us")}</h2>
          </div>
          <p className="text-base leading-8 text-muted-foreground md:text-lg">
            {t("about_content")}
          </p>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm font-semibold text-primary">{t("our_vision")}</p>
            <h2 className="mt-1 text-3xl font-black">{t("our_vision")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map(({ icon: Icon, text }, index) => (
              <article
                key={index}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <p className="leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-7 md:p-10">
          <div className="mb-4 flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{t("tagline_ai")}</h2>
          </div>
          <p className="leading-8 text-muted-foreground">{t("hero_sub")}</p>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/discover" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            {t("discover")}
          </Link>
          <Link to="/" className="rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-semibold transition hover:bg-secondary/80">
            {t("go_home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
