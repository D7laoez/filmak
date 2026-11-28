import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { applySecurityAndCacheHeaders } from "./lib/http-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type ExecutionCtxLike = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

type MemCacheEntry = {
  body: ArrayBuffer;
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  expiresAt: number;
};

const MEM_CACHE = new Map<string, MemCacheEntry>();
const IN_FLIGHT = new Map<string, Promise<MemCacheEntry | null>>();
const MEM_CACHE_TTL_MS = 30_000;
const MEM_CACHE_MAX_ENTRIES = 100;

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

function isCacheablePublicGet(request: Request, pathname: string): boolean {
  if (request.method !== "GET") return false;
  if (request.headers.has("authorization")) return false;
  if (
    PRIVATE_PREFIXES.some(
      (prefix) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
    )
  ) {
    return false;
  }
  return true;
}

function getCacheKeyUrl(url: URL, request: Request): string {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)filmak_locale=(ar|en)(?:;|$)/);
  const locale = m ? m[1] : "ar";
  const sep = url.search ? "&" : "?";
  return `${url.origin}${url.pathname}${url.search}${sep}__filmak_locale=${locale}`;
}

function toResponse(entry: MemCacheEntry, cacheStatus: string): Response {
  const headers = new Headers(entry.headers);
  headers.set("X-Filmak-Cache", cacheStatus);
  return new Response(entry.body.slice(0), {
    status: entry.status,
    statusText: entry.statusText,
    headers,
  });
}

function setMemCache(key: string, entry: MemCacheEntry) {
  if (MEM_CACHE.size >= MEM_CACHE_MAX_ENTRIES) {
    const oldestKey = MEM_CACHE.keys().next().value;
    if (oldestKey !== undefined) MEM_CACHE.delete(oldestKey);
  }
  MEM_CACHE.set(key, entry);
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      // Propagate Cloudflare worker env bindings to process.env
      if (env && typeof env === "object") {
        for (const [k, v] of Object.entries(env as Record<string, unknown>)) {
          if (typeof v === "string") {
            (process.env as Record<string, string>)[k] = v;
          }
        }
      }

      const cacheable = isCacheablePublicGet(request, pathname);
      if (cacheable) {
        const cacheKeyUrl = getCacheKeyUrl(url, request);
        const now = Date.now();
        const memHit = MEM_CACHE.get(cacheKeyUrl);
        if (memHit && memHit.expiresAt > now) {
          return toResponse(memHit, "MEM-HIT");
        }

        const edgeCache =
          typeof caches !== "undefined"
            ? (caches as unknown as { default?: Cache }).default
            : undefined;
        if (edgeCache) {
          const edgeHit = await edgeCache.match(cacheKeyUrl);
          if (edgeHit) {
            return edgeHit;
          }
        }

        // Coalesce concurrent cold requests for the same route inside this isolate
        let pending = IN_FLIGHT.get(cacheKeyUrl);
        if (!pending) {
          pending = (async (): Promise<MemCacheEntry | null> => {
            try {
              const handler = await getServerEntry();
              const raw = await handler.fetch(request, env, ctx);
              const normalized = await normalizeCatastrophicSsrResponse(raw);
              const secured = applySecurityAndCacheHeaders(normalized, pathname);
              const contentType = secured.headers.get("content-type") ?? "";
              const cacheControl = secured.headers.get("cache-control") ?? "";
              const hasSetCookie = secured.headers.has("set-cookie");

              const body = await secured.arrayBuffer();
              const headersList = Array.from(secured.headers.entries());
              const entry: MemCacheEntry = {
                body,
                status: secured.status,
                statusText: secured.statusText,
                headers: headersList,
                expiresAt: Date.now() + MEM_CACHE_TTL_MS,
              };

              if (
                secured.status === 200 &&
                !hasSetCookie &&
                contentType.includes("text/html") &&
                cacheControl.includes("public")
              ) {
                setMemCache(cacheKeyUrl, entry);
                if (edgeCache) {
                  const execCtx = ctx as ExecutionCtxLike | undefined;
                  const putPromise = edgeCache
                    .put(cacheKeyUrl, toResponse(entry, "EDGE-HIT"))
                    .catch(() => {
                      // Ignore edge cache write failures.
                    });
                  if (execCtx?.waitUntil) {
                    execCtx.waitUntil(putPromise);
                  }
                }
              }
              return entry;
            } finally {
              IN_FLIGHT.delete(cacheKeyUrl);
            }
          })();
          IN_FLIGHT.set(cacheKeyUrl, pending);
        }

        const entry = await pending;
        if (entry) {
          return toResponse(entry, "MISS");
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityAndCacheHeaders(normalized, pathname);
    } catch (error) {
      console.error("Fatal worker error:", error);
      return applySecurityAndCacheHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        pathname,
      );
    }
  },
};
