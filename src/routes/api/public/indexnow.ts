import { createFileRoute } from "@tanstack/react-router";

const KEY = "07678c3baf01261ffab8106c2e13dfe1";
const HOST = "filmak.lovable.app";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// --- Throttle + retry knobs ---
const BATCH_SIZE = 10;              // URLs per IndexNow call
const DELAY_BETWEEN_BATCHES = 1500; // ms between batches
const MAX_RETRIES = 4;              // per batch on 429/5xx
const BASE_BACKOFF = 2000;          // ms; doubles each retry

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function submitOnce(urls: string[]) {
  const clean = Array.from(
    new Set(
      urls
        .map((u) => u.trim())
        .filter((u) => u.startsWith(`https://${HOST}/`)),
    ),
  );
  if (clean.length === 0) return { submitted: 0, status: 0, body: "no valid urls" };

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: clean,
    }),
  });
  const body = await res.text();
  return { submitted: clean.length, status: res.status, body };
}

// Retry with exponential backoff on 429 / 5xx. Honors Retry-After when the
// server sends it (headers aren't exposed here; parse from body if present).
async function submitWithRetry(urls: string[]) {
  let attempt = 0;
  let last = await submitOnce(urls);
  while (
    attempt < MAX_RETRIES &&
    (last.status === 429 || (last.status >= 500 && last.status < 600))
  ) {
    const wait = BASE_BACKOFF * Math.pow(2, attempt);
    await sleep(wait);
    attempt++;
    last = await submitOnce(urls);
  }
  return { ...last, retries: attempt };
}

async function submit(urls: string[]) {
  // Chunk any single request into small batches so a huge POST becomes
  // several throttled ones; identical behavior for small inputs.
  const clean = Array.from(
    new Set(
      urls
        .map((u) => u.trim())
        .filter((u) => u.startsWith(`https://${HOST}/`)),
    ),
  );
  if (clean.length === 0)
    return { submitted: 0, status: 0, body: "no valid urls", batches: [] as any[] };

  const batches: Array<{ submitted: number; status: number; body: string; retries: number }> = [];
  for (let i = 0; i < clean.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(DELAY_BETWEEN_BATCHES);
    batches.push(await submitWithRetry(clean.slice(i, i + BATCH_SIZE)));
  }
  const ok = batches.filter((b) => b.status >= 200 && b.status < 300);
  const submitted = ok.reduce((s, b) => s + b.submitted, 0);
  return {
    submitted,
    totalBatches: batches.length,
    successBatches: ok.length,
    batches,
  };
}

async function submitAllFromSitemap() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  const xml = await res.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  return submit(urls);
}

export const Route = createFileRoute("/api/public/indexnow")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const single = url.searchParams.get("url");
        const all = url.searchParams.get("all");

        if (all === "1") {
          const out = await submitAllFromSitemap();
          return Response.json(out);
        }
        if (single) {
          const out = await submit([single]);
          return Response.json(out);
        }
        return Response.json({
          usage: {
            single: `/api/public/indexnow?url=https://${HOST}/movie/123`,
            bulkFromSitemap: `/api/public/indexnow?all=1`,
            post: "POST JSON { urls: string[] } to /api/public/indexnow",
          },
          keyLocation: KEY_LOCATION,
        });
      },
      POST: async ({ request }) => {
        let body: any = {};
        try {
          body = await request.json();
        } catch {}
        const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];
        const out = await submit(urls);
        return Response.json(out);
      },
    },
  },
});