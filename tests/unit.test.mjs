import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SITE_URL,
  absoluteUrl,
  cleanDescription,
  movieTitle,
  tvTitle,
  safeJsonLd,
} from "../src/lib/seo.ts";

test("absoluteUrl normalizes leading slashes", () => {
  assert.equal(absoluteUrl("/movies/1"), `${SITE_URL}/movies/1`);
  assert.equal(absoluteUrl("movies/1"), `${SITE_URL}/movies/1`);
});

test("cleanDescription collapses whitespace, truncates, and provides fallback", () => {
  assert.ok(cleanDescription("").length > 0);
  assert.ok(cleanDescription(null).length > 0);
  assert.equal(cleanDescription("  hello   world  "), "hello world");
  const long = "a".repeat(200);
  const cleaned = cleanDescription(long, 50);
  assert.equal(cleaned.length, 50);
  assert.ok(cleaned.endsWith("…"));
});

test("movieTitle and tvTitle format with and without year", () => {
  assert.equal(movieTitle("Inception", 2010), "Inception (2010) | فلمك Filmak");
  assert.equal(movieTitle("Inception"), "Inception | فلمك Filmak");
  assert.equal(tvTitle("Dark", "2017"), "Dark (2017) | مسلسل | فلمك Filmak");
  assert.equal(tvTitle("Dark"), "Dark | مسلسل | فلمك Filmak");
});

test("safeJsonLd escapes HTML-sensitive characters to prevent XSS", () => {
  const serialized = safeJsonLd({
    title: "</script><script>alert('xss')</script>&\u2028\u2029",
  });
  assert.equal(serialized.includes("<"), false);
  assert.equal(serialized.includes(">"), false);
  assert.equal(serialized.includes("&"), false);
  assert.ok(serialized.includes("\\u003c/script\\u003e"));
  assert.ok(serialized.includes("\\u0026"));
});

test("site_visits migration defines table, RLS, and hardened analytics RPC", () => {
  const schema = readFileSync(
    resolve("supabase/migrations/20261126075636_create_contact_inbox.sql"),
    "utf8",
  );
  const hardening = readFileSync(
    resolve("supabase/migrations/20261126080112_remove_unneeded_security_definer_rpcs.sql"),
    "utf8",
  );
  assert.match(schema, /CREATE TABLE IF NOT EXISTS public\.site_visits/i);
  assert.match(schema, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(schema, /CREATE OR REPLACE FUNCTION public\.admin_site_analytics/i);
  assert.match(hardening, /admin_site_analytics[\s\S]*?security invoker/i);
});

test("contact and analytics write RPCs are atomic and service-role only", () => {
  const contact = readFileSync(
    resolve("supabase/migrations/20261126082451_make_contact_rate_limit_atomic.sql"),
    "utf8",
  );
  const analytics = readFileSync(
    resolve("supabase/migrations/20261126082926_add_rate_limited_site_visit_rpc.sql"),
    "utf8",
  );
  assert.match(contact, /pg_advisory_xact_lock/i);
  assert.match(contact, /to service_role/i);
  assert.match(analytics, /pg_advisory_xact_lock/i);
  assert.match(analytics, /to service_role/i);
});

test("public/_headers includes security headers and public/robots.txt points to sitemap", () => {
  const headers = readFileSync(resolve("public/_headers"), "utf8");
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);

  const robots = readFileSync(resolve("public/robots.txt"), "utf8");
  assert.match(robots, /Sitemap:\s*https:\/\/filmak\.site\/sitemap\.xml/);
});

test("applySecurityAndCacheHeaders sets security headers and route-appropriate Cache-Control", async () => {
  const { applySecurityAndCacheHeaders } = await import("../src/lib/http-headers.ts");

  const publicRes = applySecurityAndCacheHeaders(
    new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    "/",
  );
  assert.equal(publicRes.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(publicRes.headers.get("X-Frame-Options"), "DENY");
  assert.equal(publicRes.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(publicRes.headers.get("Strict-Transport-Security") ?? "", /max-age=31536000/);
  assert.match(publicRes.headers.get("Content-Security-Policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(publicRes.headers.get("X-Robots-Tag"), null);
  assert.match(publicRes.headers.get("Cache-Control") ?? "", /s-maxage=300/);

  const privateRes = applySecurityAndCacheHeaders(
    new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    "/admin",
  );
  assert.equal(privateRes.headers.get("Cache-Control"), "no-store");
  assert.equal(privateRes.headers.get("X-Robots-Tag"), "noindex, nofollow");
});

test("public/sw.js exists for PWA offline support", () => {
  const sw = readFileSync(resolve("public/sw.js"), "utf8");
  assert.match(sw, /addEventListener\("fetch"/);
});
