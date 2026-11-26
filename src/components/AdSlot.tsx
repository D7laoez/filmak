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
    const target = containerRef.current;
    if (typeof window === "undefined" || !target) return;

    const loadAd = () => {
      if (target.querySelector<HTMLScriptElement>('script[data-filmak-native-ad="true"]')) return;
      const script = document.createElement("script");
      script.async = true;
      script.dataset.cfasync = "false";
      script.dataset.filmakNativeAd = "true";
      script.src = NATIVE_SCRIPT_URL;
      target.appendChild(script);
    };

    if (!("IntersectionObserver" in window)) {
      loadAd();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadAd();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
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
