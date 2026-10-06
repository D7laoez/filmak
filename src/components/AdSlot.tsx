import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const ADSENSE_CLIENT = env.VITE_ADSENSE_CLIENT_ID || "ca-pub-2237012686036777";
const EDITORIAL_AD_SLOT = env.VITE_ADSENSE_ARTICLE_SLOT_ID || "";
const PLACEHOLDER_SLOT = "1234567890";

type AdSlotProps = {
  slot?: string;
  format?: string;
  layout?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Allow a substantially enriched first-party movie page to use an ad. */
  editorialEligible?: boolean;
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
  editorialEligible = false,
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    // Articles are always eligible. A movie page may opt in only when it has
    // a published first-party editorial review loaded by the route.
    setEligible(path === "/articles" || path.startsWith("/articles/") || editorialEligible);
  }, []);

  // Ignore the old placeholder slot so it can never accidentally be served.
  const resolvedSlot = slot && slot !== PLACEHOLDER_SLOT ? slot : EDITORIAL_AD_SLOT;

  useEffect(() => {
    if (!eligible || !ADSENSE_CLIENT || !resolvedSlot || pushed.current) return;

    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.debug("AdSense push failed", e);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-filmak-adsense="true"]',
    );

    if (existing) {
      if (window.adsbygoogle) pushAd();
      else existing.addEventListener("load", pushAd, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.dataset.filmakAdsense = "true";
    script.addEventListener("load", pushAd, { once: true });
    document.head.appendChild(script);
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
