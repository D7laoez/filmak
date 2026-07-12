import { createFileRoute } from "@tanstack/react-router";

const KEY = "07678c3baf01261ffab8106c2e13dfe1";
const HOST = "filmak.lovable.app";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function submit(urls: string[]) {
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

async function submitAllFromSitemap() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  const xml = await res.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  // IndexNow accepts up to 10,000 URLs per request; batch just in case.
  const results: Array<{ submitted: number; status: number; body: string }> = [];
  for (let i = 0; i < urls.length; i += 1000) {
    results.push(await submit(urls.slice(i, i + 1000)));
  }
  const total = results.reduce((s, r) => s + r.submitted, 0);
  return { totalSubmitted: total, batches: results };
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