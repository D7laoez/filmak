export const SITE_URL = "https://filmak.site";
export const SITE_NAME_AR = "فلمك — Filmak";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function cleanDescription(value: string | null | undefined, max = 155) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "اكتشف الأفلام والمسلسلات والتوصيات المناسبة لذوقك على فلمك Filmak.";
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function movieTitle(title: string, year?: string | number | null) {
  const suffix = year ? ` (${year})` : "";
  return `${title}${suffix} | فلمك Filmak`;
}

export function tvTitle(title: string, year?: string | number | null) {
  const suffix = year ? ` (${year})` : "";
  return `${title}${suffix} | مسلسل | فلمك Filmak`;
}

/**
 * Escapes characters that could be used to break out of a <script> tag or execute XSS.
 * Safely stringifies structured data objects for JSON-LD scripts.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
