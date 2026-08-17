import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Brain, Film, Info, Sparkles, Target } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "من نحن — فلمك | About Filmak" }, { name: "description", content: "تعرف على فلمك، منصة اكتشاف الأفلام والمسلسلات المدعومة بالذكاء الاصطناعي." }] }),
  component: AboutPage,
});

function AboutPage() {
  const { t, dir } = useLocale();
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const cards = ["about_goal_1", "about_goal_2", "about_goal_3", "about_goal_4"];
  const icons = [Target, Sparkles, Film, Brain];
  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/.18),transparent_55%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-14 relative">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm hover:bg-secondary transition"><Arrow className="w-4 h-4" />{t("back")}</Link>
          <div className="mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm text-primary"><Info className="w-4 h-4" />{t("about_us")}</div>
            <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">{t("about_hero_title")}</h1>
            <p className="mt-5 text-lg md:text-xl leading-8 text-muted-foreground">{t("about_hero_sub")}</p>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-8">
        <section className="rounded-3xl border border-border bg-card/70 p-6 md:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-5"><Film className="w-6 h-6 text-primary" /><h2 className="text-2xl font-bold">{t("about_why_title")}</h2></div>
          <p className="text-muted-foreground leading-8 text-base md:text-lg">{t("about_why_content")}</p>
        </section>
        <section>
          <div className="mb-6"><p className="text-sm font-semibold text-primary">{t("our_vision")}</p><h2 className="text-3xl font-black mt-1">{t("about_goals_title")}</h2></div>
          <div className="grid md:grid-cols-2 gap-4">{cards.map((key, i) => { const Icon = icons[i]; return <div key={key} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"><Icon className="w-6 h-6 text-primary mb-4" /><p className="leading-7 text-muted-foreground">{t(key)}</p></div>; })}</div>
        </section>
        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-7 md:p-10">
          <div className="flex items-center gap-3 mb-4"><Brain className="w-6 h-6 text-primary" /><h2 className="text-2xl font-bold">{t("powered_by_ai")}</h2></div>
          <p className="leading-8 text-muted-foreground">{t("about_ai_content")}</p>
        </section>
      </div>
    </main>
  );
}
