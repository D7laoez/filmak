import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";

export function NavToggles() {
  const { t, toggle } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border hover:bg-secondary transition"
        aria-label="Switch language"
      >
        <Languages className="w-4 h-4" />
        {t("lang_switch")}
      </button>
      <ThemeToggle />
    </div>
  );
}
