const BLOCKED_CRAWLER_UA = /(?:GPTBot|meta-externalagent|SemrushBot|DataForSeoBot|MJ12bot)/i;

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const userAgent = request.headers.get("user-agent") ?? "";

  // Keep Google Search/AdSense crawlers reachable. Reject known high-volume
  // non-search crawlers before they execute application/server functions.
  if (BLOCKED_CRAWLER_UA.test(userAgent)) {
    return new Response("Forbidden", {
      status: 403,
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (/^\/wp-(login\.php|admin(?:\/|$)|content(?:\/|$)|includes(?:\/|$))/.test(path) || path === "/xmlrpc.php") {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=86400" } });
  }

  if (/^\/(movie|tv)\/null(?:\/|$)/.test(path)) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }

  return next();
};
