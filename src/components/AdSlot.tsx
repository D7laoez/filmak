import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_ADSENSE_CLIENT_ID || "ca-pub-2237012686036777";

type AdSlotProps = {
  slot: string;
  format?: string;
  layout?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Google AdSense ad unit. Renders nothing unless VITE_ADSENSE_CLIENT_ID
 * is configured. Set your ad slot ID from the AdSense dashboard.
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

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // AdSense not loaded yet or blocked by user — safe to ignore.
      console.debug("AdSense push failed", e);
    }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <div className={className} aria-label="Advertisement">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}