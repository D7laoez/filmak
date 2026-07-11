import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Rec = {
  id: number;
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  overview: string;
  reason: string;
};

export const recommendMovies = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ prompt: z.string().min(2).max(500) }).parse(d))
  .handler(async ({ data }): Promise<{ recommendations: Rec[]; intro: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير أفلام ومرشح ذكي. المستخدم يصف ما يريد مشاهدته، ورد بـ JSON فقط بهذا الشكل: {\"intro\": \"جملة قصيرة\", \"movies\": [{\"title\": \"العنوان بالإنجليزية\", \"year\": \"YYYY\", \"reason\": \"لماذا يناسبه بالعربية في جملة قصيرة\"}]}. اذكر 6 أفلام حقيقية معروفة على TMDB. عناوين الأفلام بالإنجليزية دائماً.",
          },
          { role: "user", content: data.prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("تم تجاوز الحد المسموح، حاول بعد قليل");
      if (aiRes.status === 402) throw new Error("رصيد الذكاء الاصطناعي منتهي");
      throw new Error(`AI error: ${text}`);
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: { intro?: string; movies?: { title: string; year?: string; reason: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { movies: [] };
    }

    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) throw new Error("TMDB_API_KEY missing");

    const list = parsed.movies || [];
    const results = await Promise.all(
      list.map(async (m) => {
        try {
          const url = new URL("https://api.themoviedb.org/3/search/movie");
          url.searchParams.set("api_key", tmdbKey);
          url.searchParams.set("language", "ar");
          url.searchParams.set("query", m.title);
          if (m.year) url.searchParams.set("year", m.year);
          const r = await fetch(url.toString());
          if (!r.ok) return null;
          const j = await r.json();
          const hit = j.results?.[0];
          if (!hit) return null;
          return {
            id: hit.id,
            title: hit.title || hit.original_title,
            poster: hit.poster_path ? `https://image.tmdb.org/t/p/w500${hit.poster_path}` : null,
            year: (hit.release_date || "").slice(0, 4),
            rating: Math.round((hit.vote_average || 0) * 10) / 10,
            overview: hit.overview || "",
            reason: m.reason,
          } satisfies Rec;
        } catch {
          return null;
        }
      }),
    );

    return {
      intro: parsed.intro || "",
      recommendations: results.filter((r): r is Rec => r !== null),
    };
  });