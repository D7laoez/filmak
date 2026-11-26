import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DEVICE = (ua: string) =>
  /mobile|android|iphone|ipad/i.test(ua)
    ? /ipad|tablet/i.test(ua)
      ? "Tablet"
      : "Mobile"
    : "Desktop";
const BROWSER = (ua: string) =>
  /Edg\\//i.test(ua)
    ? "Edge"
    : /OPR\\//i.test(ua)
      ? "Opera"
      : /Chrome\\//i.test(ua)
        ? "Chrome"
        : /Firefox\\//i.test(ua)
          ? "Firefox"
          : /Safari\\//i.test(ua)
            ? "Safari"
            : "Other";
const OS = (ua: string) =>
  /Windows/i.test(ua)
    ? "Windows"
    : /Android/i.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(ua)
        ? "iOS"
        : /Mac OS/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Other";

const isLikelyBot = (ua: string) =>
  /bot|crawler|spider|slurp|headless|facebookexternalhit|meta-externalagent|gptbot|semrush|mj12bot|applebot/i.test(
    ua,
  );

async function getUserId(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.split(".").length !== 3) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export const recordSiteVisit = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        path: z.string().max(500).optional(),
        sessionId: z.string().max(128).optional(),
        referrer: z.string().max(1000).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) return { ok: false };
    const ua = request.headers.get("user-agent") ?? "";
    if (isLikelyBot(ua)) return { ok: true, skipped: true };
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const country = request.headers.get("cf-ipcountry") ?? null;
    const city = request.headers.get("cf-ipcity") ?? null;
    const path =
      typeof data?.path === "string" && data.path.startsWith("/") ? data.path.slice(0, 500) : "/";
    const sessionId =
      typeof data?.sessionId === "string" && data.sessionId.length >= 8
        ? data.sessionId.slice(0, 128)
        : crypto.randomUUID();
    const userId = await getUserId(request);
    const { error } = await supabaseAdmin.from("site_visits").insert({
      session_id: sessionId,
      user_id: userId,
      path,
      referrer: typeof data?.referrer === "string" ? data.referrer.slice(0, 1000) : null,
      ip_address: ip,
      country,
      city,
      user_agent: ua.slice(0, 1000),
      device_type: DEVICE(ua),
      browser: BROWSER(ua),
      os: OS(ua),
    });
    if (error) console.warn("[site-analytics] visit insert failed:", error.message);
    return { ok: !error };
  });

export type SiteAnalytics = {
  total_visits: number;
  unique_sessions: number;
  unique_ips: number;
  logged_in_visits: number;
  top_paths: Array<{ path: string; visits: number }>;
  top_ips: Array<{ ip: string; visits: number; last_seen: string }>;
  countries: Array<{ country: string; visits: number }>;
  devices: Array<{ device: string; visits: number }>;
  daily: Array<{ day: string; visits: number; sessions: number }>;
};

export const getSiteAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const email = authUser.user?.email?.trim().toLowerCase() ?? "";
    if (authError || email !== "ali.m2002121@gmail.com")
      throw new Error("Forbidden: owner admin access required");
    const { data, error } = await supabaseAdmin.rpc("admin_site_analytics", { days: 30 });
    if (error) throw new Error(error.message);
    return data as unknown as SiteAnalytics;
  });
