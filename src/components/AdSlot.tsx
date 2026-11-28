import { useEffect, useId, useState } from "react";

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
 * Isolated in-page Adsterra NativeBanner_1 slot.
 * Each slot runs in its own sandboxed iframe (allow-scripts allow-same-origin, no allow-popups)
 * so multiple slots and SPA route transitions always render independently without opening new tabs.
 */
export function AdSlot({ placement = "banner", className, style }: AdSlotProps) {
  const slotId = useId();
  const [height, setHeight] = useState(140);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.data &&
        typeof e.data === "object" &&
        e.data.type === "filmak-ad-resize" &&
        e.data.slotId === slotId &&
        typeof e.data.height === "number"
      ) {
        setHeight(Math.min(Math.max(Math.ceil(e.data.height), 100), 650));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slotId]);

  const safePlacement = encodeURIComponent(placement);
  const safeSlotId = JSON.stringify(slotId);
  const srcDoc = `<!doctype html>
<html>
<head>
<base target="_self" />
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;overflow:hidden;width:100%}
</style>
</head>
<body>
<div id="container-${NATIVE_KEY}"></div>
<script async data-cfasync="false" src="${NATIVE_SCRIPT_URL}?p=${safePlacement}"></script>
<script>
(function(){
  var sid=${safeSlotId};
  var lastH=0;
  function send(){
    var h=Math.max(document.body?document.body.scrollHeight:0,document.documentElement?document.documentElement.scrollHeight:0);
    if(h>20&&h!==lastH){
      lastH=h;
      parent.postMessage({type:"filmak-ad-resize",slotId:sid,height:h},"*");
    }
  }
  if(typeof ResizeObserver!=="undefined"&&document.body){
    new ResizeObserver(send).observe(document.body);
  }
  setInterval(send,600);
  window.addEventListener("load",send);
})();
</script>
</body>
</html>`;

  return (
    <div
      className={className}
      style={style}
      aria-label="Advertisement"
      data-ad-placement={placement}
    >
      <div className="rounded-2xl border border-border/50 bg-card/40 p-2 sm:p-3 overflow-hidden">
        <iframe
          key={placement}
          title={`ad-${placement}`}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          scrolling="no"
          className="w-full border-0 block bg-transparent"
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
}
