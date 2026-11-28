const PRIVATE_PREFIXES = [
  "/admin",
  "/auth",
  "/callback",
  "/favorites",
  "/reset-password",
  "/stats",
  "/taste",
  "/watchlist",
  "/watched",
  "/_serverFn",
  "/api/",
];

const PUBLIC_LONG_CACHE_PATHS = new Set([
  "/about",
  "/contact",
  "/dmca",
  "/editorial-policy",
  "/faq",
  "/privacy",
  "/terms",
]);

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
  );
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://bancadeltempoidea.org https://*.bancadeltempoidea.org https://*.show-sb.com https://*.effectivegatecpm.com https://*.highperformanceformat.com https://*.topcreativeformat.com",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' data: https:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https://archive.org https://*.archive.org https://*.us.archive.org",
  "connect-src 'self' https: wss://*.supabase.co",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function applySecurityAndCacheHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);

  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-XSS-Protection", "0");
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);

  const isPrivate = isPrivatePath(pathname);
  if (isPrivate) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (!headers.has("Cache-Control")) {
    const contentType = headers.get("content-type") ?? "";
    if (isPrivate) {
      headers.set("Cache-Control", "no-store");
    } else if (response.status === 200 && contentType.includes("text/html")) {
      if (PUBLIC_LONG_CACHE_PATHS.has(pathname)) {
        headers.set(
          "Cache-Control",
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        );
      } else {
        headers.set(
          "Cache-Control",
          "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
        );
      }
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
