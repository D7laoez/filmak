import { useEffect, useRef } from "react";

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const ADSTERRA_NATIVE_KEY = env.VITE_ADSTERRA_NATIVE_KEY || "";
const ADSTERRA_SCRIPT_URL = env.VITE_ADSTERRA_SCRIPT_URL || "";
const MONETAG_SCRIPT_URL = env.VITE_MONETAG_SCRIPT_URL || "";

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
 * Multi-network profitable ad slot supporting Adsterra (Native / Display Banners)
 * and Monetag (Popunder / In-Page Push / Vignette), designed for movie discovery sites.
 */
export function AdSlot({ placement = "banner", className, style }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load global Monetag script once if configured
    if (MONETAG_SCRIPT_URL) {
      const existingMonetag = document.querySelector<HTMLScriptElement>(
        'script[data-filmak-monetag="true"]',
      );
      if (!existingMonetag) {
        const s = document.createElement("script");
        s.async = true;
        s.dataset.cfasync = "false";
        s.dataset.filmakMonetag = "true";
        s.src = MONETAG_SCRIPT_URL;
        document.head.appendChild(s);
      }
    }

    // Load Adsterra Native/Banner script into this slot if configured
    if (ADSTERRA_NATIVE_KEY && ADSTERRA_SCRIPT_URL && containerRef.current) {
      const existing = containerRef.current.querySelector<HTMLScriptElement>(
        'script[data-filmak-adsterra="true"]',
      );
      if (!existing) {
        const s = document.createElement("script");
        s.async = true;
        s.dataset.cfasync = "false";
        s.dataset.filmakAdsterra = "true";
        s.src = ADSTERRA_SCRIPT_URL;
        containerRef.current.appendChild(s);
      }
    }
  }, [placement]);

  if (!ADSTERRA_NATIVE_KEY || !ADSTERRA_SCRIPT_URL) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      aria-label="Sponsored advertisement"
      data-ad-placement={placement}
    >
      <div id={`container-${ADSTERRA_NATIVE_KEY}`} className="min-h-[90px] w-full" />
    </div>
  );
}
