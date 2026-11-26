import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const AD_PROBES = [
  "https://aarems.org/1/d348e1e70d1d9e1142a386c00cd28ff3",
  "https://bancadeltempoidea.org/21/00079e251d8adc9df75fbf3115dcceb6",
];

function checkDomBait(): boolean {
  if (typeof document === "undefined") return false;
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner pub_300x250 textads banner_ad";
  bait.style.cssText =
    "position:absolute;top:-9999px;left:-9999px;width:300px;height:250px;pointer-events:none;";
  bait.innerHTML = "&nbsp;";
  document.body.appendChild(bait);

  const style = window.getComputedStyle(bait);
  const blocked =
    bait.offsetHeight === 0 ||
    bait.offsetParent === null ||
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0";

  bait.remove();
  return blocked;
}

async function probeAdNetwork(url: string): Promise<boolean> {
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store" });
    return true;
  } catch {
    return false;
  }
}

export function AdBlockGate() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(false);

  const runCheck = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    const p = window.location.pathname;
    if (p.startsWith("/admin") || p.startsWith("/auth")) {
      setBlocked(false);
      return;
    }

    setChecking(true);
    try {
      const domBlocked = checkDomBait();
      const probeResults = await Promise.all(AD_PROBES.map(probeAdNetwork));
      const allScriptsBlocked = probeResults.every((ok) => !ok);
      setBlocked(domBlocked || allScriptsBlocked);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runCheck();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [runCheck]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!blocked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [blocked]);

  if (!blocked) return null;

  return (
    <div
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-gate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-xl p-4"
    >
      <div className="max-w-md w-full rounded-3xl border border-primary/40 bg-card p-6 md:p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center text-primary">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 id="adblock-gate-title" className="text-xl md:text-2xl font-black text-foreground">
            {ar ? "يرجى إيقاف مانع الإعلانات للمتابعة" : "Please Disable Your Ad Blocker"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ar
              ? "موقع فلمك مجاني بالكامل ويعتمد على الإعلانات لتغطية تكاليف الخوادم والذكاء الاصطناعي. أوقف مانع الإعلانات (AdBlock / uBlock / Brave Shields) لهذا الموقع ثم اضغط إعادة الفحص."
              : "Filmak is completely free and relies on ads to cover server and AI costs. Please disable your ad blocker (AdBlock / uBlock / Brave Shields) for this site, then click Re-check."}
          </p>
        </div>

        <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-start text-xs text-muted-foreground space-y-1.5">
          <p className="font-bold text-foreground">
            {ar ? "خطوات الإيقاف السريعة:" : "Quick steps:"}
          </p>
          <p>
            {ar
              ? "1. اضغط على أيقونة مانع الإعلانات في شريط المتصفح."
              : "1. Click the ad blocker icon in your browser bar."}
          </p>
          <p>
            {ar
              ? "2. اختر إيقاف مؤقت أو السماح لموقع filmak.site."
              : "2. Choose Pause or Allow on filmak.site."}
          </p>
          <p>{ar ? "3. اضغط على زر إعادة الفحص بالأسفل." : "3. Click Re-check below."}</p>
        </div>

        <button
          type="button"
          disabled={checking}
          onClick={() => window.location.reload()}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-primary/25 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          <span>
            {ar ? "لقد أوقفت مانع الإعلانات — إعادة الفحص" : "I Disabled AdBlock — Re-check"}
          </span>
        </button>
      </div>
    </div>
  );
}
