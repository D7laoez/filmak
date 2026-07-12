import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";

type Rec = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  poster: string | null;
  year: string;
  rating: number;
  overview: string;
  reason: string;
};

type Intent = {
  kinds: ("movie" | "tv")[];
  country: string | null; // ISO 3166-1 alpha-2, e.g. EG, SA, US, KR, JP, IN, TR
  language: string | null; // ISO 639-1, e.g. ar, en, ko, ja, tr, hi
  genres: string[];
  min_year: number | null;
  max_year: number | null;
  mood: string | null;
};

export const recommendMovies = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        prompt: z.string().min(2).max(500),
        lang: z.enum(["ar", "en"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ recommendations: Rec[]; intro: string }> => {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) throw new Error("TMDB_API_KEY missing");
    const lang: "ar" | "en" = data.lang ?? "ar";

    // --- Token conservation: cache + rate limit ---
    const normalizedPrompt = data.prompt.trim().toLowerCase().replace(/\s+/g, " ");
    const cacheKey = createHash("sha256")
      .update(`${lang}::${normalizedPrompt}`)
      .digest("hex");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Cache lookup — identical prompt → zero AI cost
    try {
      const { data: cached } = await supabaseAdmin
        .from("ai_cache")
        .select("response")
        .eq("cache_key", cacheKey)
        .maybeSingle();
      if (cached?.response) {
        // bump hit stats fire-and-forget
        supabaseAdmin
          .from("ai_cache")
          .update({
            last_hit_at: new Date().toISOString(),
            hit_count: ((cached as any).hit_count ?? 1) + 1,
          })
          .eq("cache_key", cacheKey)
          .then(() => {});
        return cached.response as { recommendations: Rec[]; intro: string };
      }
    } catch (e) {
      console.warn("ai_cache lookup failed", e);
    }

    // 2) Rate limit per IP per day (default 25/day; adjust with AI_DAILY_LIMIT env)
    const dailyLimit = Number(process.env.AI_DAILY_LIMIT ?? 25);
    let ip = "unknown";
    try {
      const req = getRequest();
      ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
    } catch {}
    if (ip !== "unknown") {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data: rl } = await supabaseAdmin
          .from("ai_rate_limits")
          .select("count")
          .eq("ip", ip)
          .eq("day", today)
          .maybeSingle();
        const current = rl?.count ?? 0;
        if (current >= dailyLimit) {
          throw new Error(
            lang === "en"
              ? `Daily AI limit reached (${dailyLimit}). Try again tomorrow or browse trending picks below.`
              : `تجاوزت الحد اليومي (${dailyLimit} طلب). جرّب لاحقاً أو استكشف الأفلام أدناه.`,
          );
        }
        await supabaseAdmin
          .from("ai_rate_limits")
          .upsert({ ip, day: today, count: current + 1 }, { onConflict: "ip,day" });
      } catch (e) {
        if ((e as Error).message?.startsWith("Daily AI limit") || (e as Error).message?.startsWith("تجاوزت")) {
          throw e;
        }
        console.warn("rate limit check failed", e);
      }
    }
    // --- end token conservation ---

    const systemPrompt = lang === "en"
      ? `You are a world-class film and TV expert. Understand the user's request precisely, then recommend REAL titles that exist on TMDB.

Analyze the request, then respond with JSON ONLY in this exact shape:
{
  "intent": {
    "kinds": ["movie"] or ["tv"] or ["movie","tv"],
    "country": ISO code like "EG" "SA" "US" "KR" "JP" "TR" "IN" or null,
    "language": ISO code like "ar" "en" "ko" "ja" "tr" "hi" or null,
    "genres": ["comedy","action",...],
    "min_year": number or null,
    "max_year": number or null,
    "mood": "short mood description in English" or null
  },
  "intro": "one short sentence explaining the pick, in English",
  "items": [
    { "kind": "movie" or "tv", "title": "Title in English", "year": "YYYY", "reason": "why it fits, in English" }
  ]
}

Strict rules:
- If the user asks for "movie/movies" only → kinds = ["movie"].
- If the user asks for "series/show/shows" only → kinds = ["tv"].
- If either or both → kinds = ["movie","tv"] and mix them.
- If a nationality/dialect is mentioned (Egyptian, Turkish, Korean, Hindi, Japanese, etc.) set country and language accordingly.
- Honor mood (funny, horror, romantic, thriller, action, drama, etc.).
- At least 8 real, well-known titles from TMDB.
- Titles ALWAYS in English (as shown on TMDB).
- No text outside the JSON.`
      : `أنت خبير سينما ومسلسلات عالمي. مهمتك فهم رغبة المستخدم بدقة ثم ترشيح أعمال حقيقية موجودة على TMDB.

حلّل الطلب أولاً ثم أعد JSON فقط بهذا الشكل حرفياً:
{
  "intent": {
    "kinds": ["movie"] أو ["tv"] أو ["movie","tv"],
    "country": رمز الدولة ISO مثل "EG" "SA" "US" "KR" "JP" "TR" "IN" أو null,
    "language": رمز اللغة ISO مثل "ar" "en" "ko" "ja" "tr" "hi" أو null,
    "genres": ["comedy","action",...],
    "min_year": رقم أو null,
    "max_year": رقم أو null,
    "mood": "وصف قصير للمزاج" أو null
  },
  "intro": "جملة قصيرة تشرح الاختيار بالعربية",
  "items": [
    { "kind": "movie" أو "tv", "title": "العنوان بالإنجليزية", "year": "YYYY", "reason": "سبب مناسبته بالعربية" }
  ]
}

قواعد صارمة:
- إذا طلب "فلم/افلام" فقط → kinds = ["movie"] ولا تضف مسلسلات.
- إذا طلب "مسلسل/مسلسلات" فقط → kinds = ["tv"] ولا تضف أفلام.
- إذا طلب "شي/عمل" أو ذكر الاثنين → kinds = ["movie","tv"] وامزج بينهما.
- إذا ذكر جنسية أو لهجة (مصري، سوري، خليجي، تركي، كوري، هندي، ياباني) اضبط country و language بدقة.
  - مصري → country "EG" language "ar"
  - سوري/لبناني/خليجي/عربي → language "ar" مع country مناسبة
  - تركي → country "TR" language "tr"
  - كوري → country "KR" language "ko"
  - ياباني → country "JP" language "ja"
  - هندي/بوليوود → country "IN" language "hi"
- التزم بالمزاج (مضحك، رعب، رومانسي، إثارة، أكشن، درامي، إلخ).
- 8 اقتراحات على الأقل من أعمال حقيقية معروفة على TMDB.
- عناوين الأعمال بالإنجليزية دائماً (كما تظهر في TMDB).
- لا تضف أي نص خارج JSON.`;

    const userPrompt =
      lang === "en"
        ? `Respond in English only. User request: ${data.prompt}`
        : `أجب بالعربية فقط. طلب المستخدم: ${data.prompt}`;
    const content = await callAIWithFallback(systemPrompt, userPrompt);
    let parsed: {
      intent?: Partial<Intent>;
      intro?: string;
      items?: { kind?: "movie" | "tv"; title: string; year?: string; reason: string }[];
      // legacy fallback
      movies?: { title: string; year?: string; reason: string }[];
    };
    try {
      parsed = JSON.parse(extractJson(content));
    } catch {
      parsed = {};
    }

    const intent: Intent = {
      kinds: parsed.intent?.kinds?.length ? parsed.intent.kinds : ["movie", "tv"],
      country: parsed.intent?.country ?? null,
      language: parsed.intent?.language ?? null,
      genres: parsed.intent?.genres ?? [],
      min_year: parsed.intent?.min_year ?? null,
      max_year: parsed.intent?.max_year ?? null,
      mood: parsed.intent?.mood ?? null,
    };

    const raw = parsed.items?.length
      ? parsed.items
      : (parsed.movies || []).map((m) => ({ ...m, kind: "movie" as const }));

    // Enforce intent.kinds
    const items = raw.filter((it) => {
      const k = it.kind || "movie";
      return intent.kinds.includes(k);
    });

    const results = await Promise.all(
      items.map(async (m) => {
        const kind: "movie" | "tv" = m.kind || "movie";
        const hit = await tmdbSearchBest(tmdbKey, kind, m.title, m.year, intent, lang);
        if (!hit) return null;
        const dateField = kind === "movie" ? hit.release_date : hit.first_air_date;
        return {
          id: hit.id,
          mediaType: kind,
          title: hit.title || hit.name || hit.original_title || hit.original_name,
          poster: hit.poster_path ? `https://image.tmdb.org/t/p/w500${hit.poster_path}` : null,
          year: (dateField || "").slice(0, 4),
          rating: Math.round((hit.vote_average || 0) * 10) / 10,
          overview: hit.overview || "",
          reason: m.reason,
        } satisfies Rec;
      }),
    );

    // Deduplicate by mediaType+id
    const seen = new Set<string>();
    const dedup = results.filter((r): r is Rec => {
      if (!r || !r.poster) return false;
      const key = `${r.mediaType}:${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = {
      intro: parsed.intro || "",
      recommendations: dedup,
    };

    // Store in cache for future identical prompts (only if we got real results)
    if (dedup.length >= 3) {
      try {
        await supabaseAdmin.from("ai_cache").upsert(
          {
            cache_key: cacheKey,
            lang,
            prompt: normalizedPrompt,
            response: result,
            last_hit_at: new Date().toISOString(),
          },
          { onConflict: "cache_key" },
        );
      } catch (e) {
        console.warn("ai_cache write failed", e);
      }
    }

    return result;
  });

async function tmdbSearchBest(
  key: string,
  kind: "movie" | "tv",
  title: string,
  year: string | undefined,
  intent: Intent,
  lang: "ar" | "en" = "ar",
): Promise<any | null> {
  try {
    const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", lang);
    url.searchParams.set("query", title);
    url.searchParams.set("include_adult", "false");
    if (year) {
      if (kind === "movie") url.searchParams.set("year", year);
      else url.searchParams.set("first_air_date_year", year);
    }
    const r = await fetch(url.toString());
    if (!r.ok) return null;
    const j = await r.json();
    const list: any[] = (j.results || []).filter((x: any) => x.poster_path);
    if (list.length === 0) return null;

    // Score candidates by language/country match + popularity
    const scored = list.map((it) => {
      let score = it.popularity || 0;
      if (intent.language && it.original_language === intent.language) score += 100;
      if (intent.country) {
        const countries: string[] = it.origin_country || [];
        if (countries.includes(intent.country)) score += 150;
      }
      if (year) {
        const d = it.release_date || it.first_air_date || "";
        if (d.startsWith(year)) score += 30;
      }
      return { it, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].it;
  } catch {
    return null;
  }
}

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