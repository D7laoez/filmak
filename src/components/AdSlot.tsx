import { useEffect, useRef } from "react";

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const NATIVE_KEY = env.VITE_ADSTERRA_NATIVE_KEY || "00079e251d8adc9df75fbf3115dcceb6";
const NATIVE_SCRIPT_URL =
  env.VITE_ADSTERRA_SCRIPT_URL ||
  "https://bancadeltempoidea.org/21/00079e251d8adc9df75fbf3115dcceb6";

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

/**
 * In-page Adsterra NativeBanner_1 slot only (no popunders or new-tab redirects).
 */
export function AdSlot({ placement = "banner", className, style }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      className={className}
      style={style}
      aria-label="Advertisement"
      data-ad-placement={placement}
    >
      <div className="rounded-2xl border border-border/50 bg-card/40 p-3 overflow-hidden">
        <div id={`container-${NATIVE_KEY}`} className="min-h-[90px] w-full" />
      </div>
    </div>
  );
}
