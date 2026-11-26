import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicDomainMovie = {
  id: string;
  title: string;
  year: string;
  description: string;
  poster: string;
  downloads: number;
  rightsLabel: string;
};

type ArchiveDoc = {
  identifier: string;
  title?: string;
  year?: string | number;
  description?: string | string[];
  downloads?: number;
  licenseurl?: string;
  rights?: string | string[];
};

function hasExplicitPublicDomainLicense(value: unknown): boolean {
  const license = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    license.includes("creativecommons.org/publicdomain/mark/1.0") ||
    license.includes("creativecommons.org/publicdomain/zero/1.0")
  );
}

export const getFreePublicDomainMovies = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z
      .object({
        q: z.string().max(100).optional(),
        page: z.number().int().min(1).max(10).default(1),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<PublicDomainMovie[]> => {
    const queryParts = [
      "collection:(feature_films)",
      "mediatype:(movies)",
      "format:(MPEG4 OR h.264)",
      '(licenseurl:"https://creativecommons.org/publicdomain/mark/1.0/" OR licenseurl:"https://creativecommons.org/publicdomain/zero/1.0/")',
    ];
    if (data.q?.trim()) {
      const cleanQ = data.q.trim().replace(/[()":]/g, " ");
      queryParts.push(`title:(${cleanQ})`);
    }

    const url = new URL("https://archive.org/advancedsearch.php");
    url.searchParams.set("q", queryParts.join(" AND "));
    url.searchParams.append("fl[]", "identifier");
    url.searchParams.append("fl[]", "title");
    url.searchParams.append("fl[]", "year");
    url.searchParams.append("fl[]", "description");
    url.searchParams.append("fl[]", "downloads");
    url.searchParams.append("fl[]", "licenseurl");
    url.searchParams.append("sort[]", "downloads desc");
    url.searchParams.set("rows", "24");
    url.searchParams.set("page", String(data.page));
    url.searchParams.set("output", "json");

    const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
    if (!res.ok) return [];
    const json = (await res.json()) as { response?: { docs?: ArchiveDoc[] } };
    const docs = json.response?.docs ?? [];

    return docs
      .filter((doc) =>
        Boolean(doc.identifier && doc.title && hasExplicitPublicDomainLicense(doc.licenseurl)),
      )
      .map((doc) => {
        const rawDesc = Array.isArray(doc.description)
          ? doc.description.join(" ")
          : doc.description || "";
        const cleanDesc = rawDesc
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return {
          id: doc.identifier,
          title: String(doc.title),
          year: doc.year ? String(doc.year).slice(0, 4) : "",
          description: cleanDesc.slice(0, 220),
          poster: `https://archive.org/services/img/${encodeURIComponent(doc.identifier)}`,
          downloads: Number(doc.downloads || 0),
          rightsLabel: doc.licenseurl?.includes("/mark/") ? "Public Domain Mark 1.0" : "CC0 1.0",
        };
      });
  });

export type PublicDomainStream = {
  id: string;
  title: string;
  streamUrl: string | null;
  subtitleUrl: string | null;
};

type ArchiveFile = {
  name: string;
  format?: string;
  size?: string;
};

export const getFreeMovieStream = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ id: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }): Promise<PublicDomainStream> => {
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(data.id)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { id: data.id, title: data.id, streamUrl: null, subtitleUrl: null };
    const meta = (await res.json()) as {
      metadata?: { title?: string; licenseurl?: string };
      files?: ArchiveFile[];
    };
    // Never expose a playable stream unless the uploader metadata declares
    // an explicit Creative Commons Public Domain Mark or CC0 license.
    if (!hasExplicitPublicDomainLicense(meta.metadata?.licenseurl)) {
      return {
        id: data.id,
        title: meta.metadata?.title || data.id,
        streamUrl: null,
        subtitleUrl: null,
      };
    }

    const files = meta.files ?? [];
    const mp4 =
      files.find((f) => f.name.endsWith(".mp4") && !f.name.includes("512kb")) ??
      files.find((f) => f.name.endsWith(".mp4"));
    const vtt = files.find((f) => f.name.endsWith(".vtt") || f.name.endsWith(".srt"));

    return {
      id: data.id,
      title: meta.metadata?.title || data.id,
      streamUrl: mp4
        ? `https://archive.org/download/${encodeURIComponent(data.id)}/${encodeURIComponent(mp4.name)}`
        : null,
      subtitleUrl:
        vtt && vtt.name.endsWith(".vtt")
          ? `https://archive.org/download/${encodeURIComponent(data.id)}/${encodeURIComponent(vtt.name)}`
          : null,
    };
  });
