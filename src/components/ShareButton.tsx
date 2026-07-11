import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export function ShareButton({ title, text, url }: { title: string; text?: string; url?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const href = url ?? (typeof window !== "undefined" ? window.location.href : "");

  async function onClick() {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title, text, url: href });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("error_generic"));
    }
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-secondary text-foreground border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
      {t("share")}
      <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-2 ml-1">
        <Copy className="w-3 h-3 inline" />
      </span>
    </button>
  );
}
