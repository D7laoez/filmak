export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  const path = url.pathname;
  if (/^\/wp-(login\.php|admin(?:\/|$)|content(?:\/|$)|includes(?:\/|$))/.test(path) || path === "/xmlrpc.php") {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=86400" } });
  }
  if (/^\/(movie|tv)\/null(?:\/|$)/.test(path)) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }
  return next();
};
