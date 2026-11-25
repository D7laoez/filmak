import { createFileRoute } from "@tanstack/react-router";

const KEY = "07678c3baf01261ffab8106c2e13dfe1";
const HOST = "filmak.site";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 1500;
const MAX_RETRIES = 4;
const BASE_BACKOFF = 2000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

function isAuthorized(request: Request) {
  const secret = process.env.INDEXNOW_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  const provided = url.searchParams.get("secret") || request.headers.get("x-indexnow-secret");
  return Boolean(provided && timingSafeEqualStr(provided, secret));
}

async function submitOnce(urls: string[]) {
  const clean = Array.from(
    new Set(urls.map((u) => u.trim()).filter((u) => u.startsWith(`https://${HOST}/`))),
  );
  if (clean.length === 0) return { submitted: 0, status: 0, body: "no valid urls" };

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: clean }),
  });
  const body = await res.text();
  return { submitted: clean.length, status: res.status, body };
}

async function submitWithRetry(urls: string[]) {
  let attempt = 0;
  let last = await submitOnce(urls);
  while (
    attempt < MAX_RETRIES &&
    (last.status === 429 || (last.status >= 500 && last.status < 600))
  ) {
    await sleep(BASE_BACKOFF * Math.pow(2, attempt));
    attempt++;
    last = await submitOnce(urls);
  }
  return { ...last, retries: attempt };
}

async function submit(urls: string[]) {
  const clean = Array.from(
    new Set(urls.map((u) => u.trim()).filter((u) => u.startsWith(`https://${HOST}/`))),
  );
  const batches: Array<{ submitted: number; status: number; body: string; retries: number }> = [];
  if (clean.length === 0) return { submitted: 0, status: 0, body: "no valid urls", batches };
  for (let i = 0; i < clean.length; i += BATCH_SIZE) {
    if (i > 0) await sleep(DELAY_BETWEEN_BATCHES);
    batches.push(await submitWithRetry(clean.slice(i, i + BATCH_SIZE)));
  }
  const ok = batches.filter((b) => b.status >= 200 && b.status < 300);
  return {
    submitted: ok.reduce((s, b) => s + b.submitted, 0),
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
        if (!isAuthorized(request))
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        const url = new URL(request.url);
        const single = url.searchParams.get("url");
        const all = url.searchParams.get("all");
        if (all === "1") return Response.json(await submitAllFromSitemap());
        if (single) return Response.json(await submit([single]));
        return Response.json({ usage: "Provide url or all=1", keyLocation: KEY_LOCATION });
      },
      POST: async ({ request }) => {
        if (!isAuthorized(request))
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        let body: { urls?: unknown } = {};
        try {
          body = (await request.json()) as { urls?: unknown };
        } catch {
          body = {};
        }
        const urls: string[] = Array.isArray(body?.urls)
          ? body.urls.filter((u): u is string => typeof u === "string")
          : [];
        return Response.json(await submit(urls));
      },
    },
  },
});
