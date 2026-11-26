import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const NATIVE_KEY = env.VITE_ADSTERRA_NATIVE_KEY || "00079e251d8adc9df75fbf3115dcceb6";
const NATIVE_SCRIPT_URL =
  env.VITE_ADSTERRA_SCRIPT_URL ||
  "https://bancadeltempoidea.org/21/00079e251d8adc9df75fbf3115dcceb6";
const DIRECT_LINK_URL =
  env.VITE_AD_DIRECT_LINK_URL || "https://directyp.org/4/134b4e47cb5745ca9d7b8b6f8b2c3c32";

type AdSlotProps = {
  placement?: string;
  slot?: string;
  format?: string;
  layout?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  editorialEligible?: boolean;
};

export function AdSlot({ placement = "banner", className, style }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const ar = locale === "ar";

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const existing = containerRef.current.querySelector<HTMLScriptElement>(
      'script[data-filmak-native-ad="true"]',
    );
    if (existing) return;

    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("fetchpriority", "high");
    s.dataset.cfasync = "false";
    s.dataset.filmakNativeAd = "true";
    s.src = NATIVE_SCRIPT_URL;
    containerRef.current.appendChild(s);
  }, [placement]);

  return (
    <div
      ref={containerRef}
      className={`space-y-3 ${className ?? ""}`}
      style={style}
      aria-label="Sponsored advertisement"
      data-ad-placement={placement}
    >
      <div id={`container-${NATIVE_KEY}`} className="min-h-[90px] w-full" />
      {DIRECT_LINK_URL && (
        <div className="flex justify-center">
          <a
            href={DIRECT_LINK_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{ar ? "عروض ومحتوى برعاية" : "Sponsored Partner Offer"}</span>
          </a>
        </div>
      )}
    </div>
  );
}
