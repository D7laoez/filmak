import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getRequestOrigin = createServerFn({ method: "GET" }).handler(
  () => {
    try {
      const req = getRequest();
      const proto =
        req.headers.get("x-forwarded-proto") ??
        (req.url.startsWith("https") ? "https" : "http");
      const host =
        req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
      if (!host) return "";
      return `${proto}://${host}`;
    } catch {
      return "";
    }
  },
);