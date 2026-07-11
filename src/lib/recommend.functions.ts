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
    const systemPrompt =
      'أنت خبير أفلام ومرشح ذكي. المستخدم يصف ما يريد مشاهدته، ورد بـ JSON فقط بهذا الشكل: {"intro": "جملة قصيرة", "movies": [{"title": "العنوان بالإنجليزية", "year": "YYYY", "reason": "لماذا يناسبه بالعربية في جملة قصيرة"}]}. اذكر 6 أفلام حقيقية معروفة على TMDB. عناوين الأفلام بالإنجليزية دائماً.';

    const content = await callAIWithFallback(systemPrompt, data.prompt);
    let parsed: { intro?: string; movies?: { title: string; year?: string; reason: string }[] };
    try {
      parsed = JSON.parse(extractJson(content));
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
      recommendations: results.filter((r): r is Rec => r !== null && r.poster !== null),
    };
  });

function extractJson(text: string): string {
  const t = text.trim();
  if (t.startsWith("{")) return t;
  const match = t.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

type Provider = {
  name: string;
  run: (system: string, user: string) => Promise<string>;
};

async function callAIWithFallback(system: string, user: string): Promise<string> {
  const providers: Provider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: "gemini", run: (s, u) => callGemini(s, u, process.env.GEMINI_API_KEY!) });
  }
  if (process.env.GROQ_API_KEY) {
    providers.push({ name: "groq", run: (s, u) => callOpenAICompat(s, u, {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY!,
      model: "llama-3.3-70b-versatile",
    }) });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({ name: "openrouter", run: (s, u) => callOpenAICompat(s, u, {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: process.env.OPENROUTER_API_KEY!,
      model: "deepseek/deepseek-chat-v3.1:free",
    }) });
  }
  if (process.env.MISTRAL_API_KEY) {
    providers.push({ name: "mistral", run: (s, u) => callOpenAICompat(s, u, {
      url: "https://api.mistral.ai/v1/chat/completions",
      key: process.env.MISTRAL_API_KEY!,
      model: "mistral-small-latest",
    }) });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({ name: "openai", run: (s, u) => callOpenAICompat(s, u, {
      url: "https://api.openai.com/v1/chat/completions",
      key: process.env.OPENAI_API_KEY!,
      model: "gpt-4o-mini",
    }) });
  }
  if (process.env.GITHUB_FINE_GRAINED_PERSONAL_ACCESS_TOKEN) {
    providers.push({ name: "github", run: (s, u) => callOpenAICompat(s, u, {
      url: "https://models.github.ai/inference/chat/completions",
      key: process.env.GITHUB_FINE_GRAINED_PERSONAL_ACCESS_TOKEN!,
      model: "openai/gpt-4o-mini",
    }) });
  }

  if (providers.length === 0) throw new Error("لا يوجد أي مفتاح ذكاء اصطناعي مُهيّأ");

  const errors: string[] = [];
  for (const p of providers) {
    try {
      const out = await p.run(system, user);
      if (out && out.trim()) return out;
      errors.push(`${p.name}: empty`);
    } catch (e) {
      errors.push(`${p.name}: ${(e as Error).message}`);
    }
  }
  throw new Error(`فشلت كل المزودات: ${errors.join(" | ")}`);
}

async function callGemini(system: string, user: string, key: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAICompat(
  system: string,
  user: string,
  cfg: { url: string; key: string; model: string },
): Promise<string> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || "";
}