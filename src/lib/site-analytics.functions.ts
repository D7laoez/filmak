import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEVICE = (ua: string) => /mobile|android|iphone|ipad/i.test(ua) ? (/ipad|tablet/i.test(ua) ? "Tablet" : "Mobile") : "Desktop";
const BROWSER = (ua: string) => /Edg\//i.test(ua) ? "Edge" : /Chrome\//i.test(ua) ? "Chrome" : /Firefox\//i.test(ua) ? "Firefox" : /Safari\//i.test(ua) ? "Safari" : /OPR\//i.test(ua) ? "Opera" : "Other";
const OS = (ua: string) => /Windows/i.test(ua) ? "Windows" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Other";

async function getUserId(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.split(".").length !== 3) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await client.auth.getClaims(token);
    return data?.claims?.sub ?? null;
  } catch { return null; }
}

export const recordSiteVisit = createServerFn({ method: "POST" }).inputValidator((data: { path?: string; sessionId?: string; referrer?: string }) => data).handler(async ({ data }) => {
  const request = getRequest();
  if (!request) return { ok: false };
  const ua = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const country = request.headers.get("cf-ipcountry") ?? null;
  const city = request.headers.get("cf-ipcity") ?? null;
  const path = typeof data?.path === "string" ? data.path.slice(0, 500) : "/";
  const sessionId = typeof data?.sessionId === "string" && data.sessionId.length >= 8 ? data.sessionId.slice(0, 128) : crypto.randomUUID();
  const userId = await getUserId(request);
  await supabaseAdmin.from("site_visits").insert({
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
  return { ok: true };
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

export const getSiteAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.rpc("admin_site_analytics", { days: 30 });
  if (error) throw new Error(error.message);
  return data as unknown as SiteAnalytics;
});
