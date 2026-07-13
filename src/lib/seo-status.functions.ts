import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://filmak.site/";
const SITEMAP_URL = "https://filmak.site/sitemap.xml";
const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_search_console";

function gcHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovableKey || !gscKey) {
    throw new Error("Google Search Console connector is not configured");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gscKey,
    "Content-Type": "application/json",
  };
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}

export type SitemapStatus = {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  errors: number;
  warnings: number;
  submitted: number;
  indexed: number;
};

export const getSeoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);

    const url = `${GATEWAY_BASE}/webmasters/v3/sites/${encodeURIComponent(
      SITE_URL,
    )}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
    const res = await fetch(url, { headers: gcHeaders() });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sitemap fetch failed [${res.status}]: ${body}`);
    }
    const raw = (await res.json()) as {
      path?: string;
      lastSubmitted?: string;
      lastDownloaded?: string;
      isPending?: boolean;
      warnings?: string;
      errors?: string;
      contents?: Array<{ submitted?: string; indexed?: string }>;
    };
    const content = raw.contents?.[0];
    const result: SitemapStatus = {
      path: raw.path ?? SITEMAP_URL,
      lastSubmitted: raw.lastSubmitted,
      lastDownloaded: raw.lastDownloaded,
      isPending: raw.isPending,
      errors: Number(raw.errors ?? 0),
      warnings: Number(raw.warnings ?? 0),
      submitted: Number(content?.submitted ?? 0),
      indexed: Number(content?.indexed ?? 0),
    };
    return result;
  });

export type InspectionResult = {
  inspectedUrl: string;
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  pageFetchState: string;
  lastCrawlTime?: string;
  googleCanonical?: string;
  userCanonical?: string;
  referringUrls?: string[];
  sitemap?: string[];
  inspectionResultLink?: string;
};

export const inspectSeoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) =>
    z
      .object({
        path: z.string().trim().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);

    const path = data.path.startsWith("/") ? data.path : `/${data.path}`;
    const inspectionUrl = new URL(path, SITE_URL).toString();

    const res = await fetch(
      `${GATEWAY_BASE}/v1/urlInspection/index:inspect`,
      {
        method: "POST",
        headers: gcHeaders(),
        body: JSON.stringify({ inspectionUrl, siteUrl: SITE_URL }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`URL inspection failed [${res.status}]: ${body}`);
    }
    const raw = (await res.json()) as {
      inspectionResult?: {
        inspectionResultLink?: string;
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          robotsTxtState?: string;
          indexingState?: string;
          pageFetchState?: string;
          lastCrawlTime?: string;
          googleCanonical?: string;
          userCanonical?: string;
          referringUrls?: string[];
          sitemap?: string[];
        };
      };
    };
    const s = raw.inspectionResult?.indexStatusResult ?? {};
    const result: InspectionResult = {
      inspectedUrl: inspectionUrl,
      verdict: s.verdict ?? "UNKNOWN",
      coverageState: s.coverageState ?? "unknown",
      robotsTxtState: s.robotsTxtState ?? "UNKNOWN",
      indexingState: s.indexingState ?? "UNKNOWN",
      pageFetchState: s.pageFetchState ?? "UNKNOWN",
      lastCrawlTime: s.lastCrawlTime,
      googleCanonical: s.googleCanonical,
      userCanonical: s.userCanonical,
      referringUrls: s.referringUrls,
      sitemap: s.sitemap,
      inspectionResultLink: raw.inspectionResult?.inspectionResultLink,
    };
    return result;
  });

export type SubmissionRow = {
  id: string;
  created_at: string;
  status: string;
  http_status: number | null;
  message: string | null;
  submitted_urls: number | null;
  indexed_urls: number | null;
  errors: number | null;
  warnings: number | null;
};

export const resubmitSitemap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);

    const url = `${GATEWAY_BASE}/webmasters/v3/sites/${encodeURIComponent(
      SITE_URL,
    )}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;

    let status = "success";
    let httpStatus = 0;
    let message: string | null = null;
    let sitemap: SitemapStatus | null = null;

    try {
      const putRes = await fetch(url, { method: "PUT", headers: gcHeaders() });
      httpStatus = putRes.status;
      if (!putRes.ok) {
        status = "failed";
        message = await putRes.text();
      } else {
        const getRes = await fetch(url, { headers: gcHeaders() });
        if (getRes.ok) {
          const raw = (await getRes.json()) as {
            path?: string;
            lastSubmitted?: string;
            lastDownloaded?: string;
            isPending?: boolean;
            warnings?: string;
            errors?: string;
            contents?: Array<{ submitted?: string; indexed?: string }>;
          };
          const content = raw.contents?.[0];
          sitemap = {
            path: raw.path ?? SITEMAP_URL,
            lastSubmitted: raw.lastSubmitted,
            lastDownloaded: raw.lastDownloaded,
            isPending: raw.isPending,
            errors: Number(raw.errors ?? 0),
            warnings: Number(raw.warnings ?? 0),
            submitted: Number(content?.submitted ?? 0),
            indexed: Number(content?.indexed ?? 0),
          };
        }
      }
    } catch (e) {
      status = "failed";
      message = e instanceof Error ? e.message : String(e);
    }

    const { error: insertErr } = await context.supabase
      .from("sitemap_submissions")
      .insert({
        submitted_by: context.userId,
        status,
        http_status: httpStatus || null,
        message,
        submitted_urls: sitemap?.submitted ?? null,
        indexed_urls: sitemap?.indexed ?? null,
        errors: sitemap?.errors ?? null,
        warnings: sitemap?.warnings ?? null,
      });
    if (insertErr) {
      console.error("Failed to log submission:", insertErr);
    }

    return { status, http_status: httpStatus, message, sitemap };
  });

export const getSubmissionHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("sitemap_submissions")
      .select("id, created_at, status, http_status, message, submitted_urls, indexed_urls, errors, warnings")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []) as SubmissionRow[];
  });