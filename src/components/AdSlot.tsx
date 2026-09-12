import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const ADSENSE_CLIENT = env.VITE_ADSENSE_CLIENT_ID || "";
const EDITORIAL_AD_SLOT = env.VITE_ADSENSE_ARTICLE_SLOT_ID || "";

type AdSlotProps = {
  slot?: string;
  format?: string;
  layout?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * AdSense is intentionally restricted to first-party editorial pages.
 * Movie/person/discovery pages contain third-party catalogue data and must not
 * receive Google ads unless they are substantially enriched with original content.
 */
export function AdSlot({
  slot,
  format = "auto",
  layout,
  responsive = true,
  className,
  style,
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    // Only monetize original, manually curated editorial articles for now.
    setEligible(path === "/articles" || path.startsWith("/articles/"));
  }, []);

  const resolvedSlot = slot || EDITORIAL_AD_SLOT;

  useEffect(() => {
    if (!eligible || !ADSENSE_CLIENT || !resolvedSlot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.debug("AdSense push failed", e);
    }
  }, [eligible, resolvedSlot]);

  if (!eligible || !ADSENSE_CLIENT || !resolvedSlot) return null;

  return (
    <div className={className} aria-label="Advertisement">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={resolvedSlot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
