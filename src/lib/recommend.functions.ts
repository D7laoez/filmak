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
  country: string | null;
  language: string | null;
  genres: string[];
  min_year: number | null;
  max_year: number | null;
  mood: string | null;
  runtimeMax: number | null;
};

type AIItem = { kind?: "movie" | "tv"; title?: string; year?: string; reason?: string };

const GENRE_IDS: Record<string, number> = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
  horror: 27, music: 10402, mystery: 9648, romance: 10749,
  sciencefiction: 878, "science fiction": 878, thriller: 53, war: 10752,
  western: 37,
};

export const recommendMovies = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ prompt: z.string().trim().min(2).max(500), lang: z.enum(["ar", "en"]).optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ recommendations: Rec[]; intro: string }> => {
    const tmdbKey = process.env.TMDB_API_KEY;
    const lang: "ar" | "en" = data.lang ?? "ar";
    if (!tmdbKey) throw new Error(lang === "en" ? "TMDB is not configured." : "مفتاح TMDB غير مهيأ على الخادم.");

    const normalizedPrompt = data.prompt.toLowerCase().replace(/\s+/g, " ").trim();
    const cacheKey = createHash("sha256").update(`v2::${lang}::${normalizedPrompt}`).digest("hex");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    try {
      const { data: cached } = await supabaseAdmin.from("ai_cache").select("response,hit_count").eq("cache_key", cacheKey).maybeSingle();
      if (cached?.response) {
        void supabaseAdmin.from("ai_cache").update({ last_hit_at: new Date().toISOString(), hit_count: (cached.hit_count ?? 0) + 1 }).eq("cache_key", cacheKey);
        return cached.response as { recommendations: Rec[]; intro: string };
      }
    } catch (e) { console.warn("ai_cache lookup failed", e); }

    await enforceRateLimit(supabaseAdmin, lang);

    const systemPrompt = lang === "en"
      ? `You are Filmak's movie and TV recommendation engine. Analyze the user's request and return VALID JSON ONLY. Do not use markdown, comments, or explanatory text outside JSON.
Schema:
{"intent":{"kinds":["movie"],"country":null,"language":null,"genres":[],"min_year":null,"max_year":null,"mood":null,"runtimeMax":null},"intro":"short sentence","items":[{"kind":"movie","title":"English TMDB title","year":"YYYY","reason":"short reason"}]}
Rules: movie-only requests must use ["movie"]; series/show-only requests must use ["tv"]; otherwise use ["movie","tv"]. Detect explicit genre, country, language, mood, and runtime constraints. If the user says romance/romantic, include romance genre ID 10749. If the user says short/brief/under 2 hours, set runtimeMax in minutes and only recommend titles that satisfy it. Return 8-12 real titles, but NEVER sacrifice hard constraints just to reach 8. Titles must be English TMDB titles. Every item must have kind, title, year when known, and reason.`
      : `أنت محرك ترشيحات فلمك للأفلام والمسلسلات. حلّل طلب المستخدم وأعد JSON صالح فقط، بدون Markdown أو أي نص خارج JSON.
المخطط:
{"intent":{"kinds":["movie"],"country":null,"language":null,"genres":[],"min_year":null,"max_year":null,"mood":null,"runtimeMax":null},"intro":"جملة قصيرة","items":[{"kind":"movie","title":"English TMDB title","year":"YYYY","reason":"سبب قصير"}]}
القواعد: طلب فلم فقط = ["movie"]، طلب مسلسل فقط = ["tv"]، وإذا كان الطلب عاماً أو الاثنين = ["movie","tv"]. افهم الجنسية واللغة والمزاج والمدة المطلوبة. إذا قال المستخدم رومانسي/رومانسية فأضف genre 10749. إذا قال قصير/قصيرة/أقل من ساعتين فحدّد runtimeMax بالدقائق، ولا ترشح أي عنوان يخالفه. أعد 8-12 عنواناً حقيقياً على TMDB، لكن لا تضحّي بالقيود الصريحة حتى تكمل 8. العناوين بالإنجليزية كما في TMDB. كل عنصر يجب أن يحتوي النوع والعنوان والسنة إن عُرفت وسبب الترشيح.`;

    let parsed: { intent?: Partial<Intent>; intro?: string; items?: AIItem[] } = {};
    let aiError = "";
    try {
      const content = await callAIWithFallback(systemPrompt, lang === "en" ? `User request: ${data.prompt}` : `طلب المستخدم: ${data.prompt}`);
      parsed = JSON.parse(extractJson(content));
    } catch (e) {
      aiError = (e as Error).message || "AI unavailable";
      console.warn("AI recommendation failed; using TMDB fallback", aiError);
    }

    const intent = normalizeIntent(parsed.intent, data.prompt);
    const aiItems = (parsed.items ?? []).filter((x) => x.title && intent.kinds.includes(x.kind ?? "movie"));
    let recommendations = await resolveAIItems(tmdbKey, aiItems, intent, lang);

    if (recommendations.length < 4) {
      const fallback = await discoverFallback(tmdbKey, intent, lang);
      recommendations = mergeUnique(recommendations, fallback);
    }

    recommendations = recommendations.slice(0, 12);
    const intro = parsed.intro?.trim() || (aiError
      ? (lang === "en" ? "Here are picks matched to your request using Filmak's movie database." : "هاي ترشيحات مطابقة لطلبك اعتماداً على قاعدة أفلام فلمك.")
      : (lang === "en" ? "These picks match the mood and preferences you described." : "هاي الاختيارات الأقرب للمزاج والتفضيلات اللي وصفتها."));
    const result = { intro, recommendations };

    if (recommendations.length >= 3) {
      try {
        await supabaseAdmin.from("ai_cache").upsert({ cache_key: cacheKey, lang, prompt: normalizedPrompt, response: result, last_hit_at: new Date().toISOString() }, { onConflict: "cache_key" });
      } catch (e) { console.warn("ai_cache write failed", e); }
    }
    return result;
  });

async function enforceRateLimit(supabaseAdmin: any, lang: "ar" | "en") {
  const dailyLimit = Math.max(1, Number(process.env.AI_DAILY_LIMIT ?? 25));
  let ip = "unknown";
  try {
    const req = getRequest();
    ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  } catch {}
  if (ip === "unknown") return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const { data: row } = await supabaseAdmin.from("ai_rate_limits").select("count").eq("ip", ip).eq("day", day).maybeSingle();
    const count = row?.count ?? 0;
    if (count >= dailyLimit) throw new Error(lang === "en" ? `Daily AI limit reached (${dailyLimit}).` : `تجاوزت الحد اليومي (${dailyLimit} طلب).`);
    await supabaseAdmin.from("ai_rate_limits").upsert({ ip, day, count: count + 1 }, { onConflict: "ip,day" });
  } catch (e) {
    const message = (e as Error).message || "";
    if (message.includes("Daily AI limit") || message.includes("تجاوزت الحد")) throw e;
    console.warn("rate limit check failed", e);
  }
}

function normalizeIntent(raw: Partial<Intent> | undefined, prompt: string): Intent {
  const p = prompt.toLowerCase();
  const explicitTv = /مسلسل|مسلسلات|سلسلة|series|show|shows|tv/.test(p);
  const explicitMovie = /فلم|فيلم|افلام|أفلام|movie|movies|film/.test(p);
  let kinds: ("movie" | "tv")[] = raw?.kinds?.filter((k): k is "movie" | "tv" => k === "movie" || k === "tv") ?? [];
  if (!kinds.length) kinds = explicitTv && !explicitMovie ? ["tv"] : explicitMovie && !explicitTv ? ["movie"] : ["movie", "tv"];
  if (explicitMovie && !explicitTv) kinds = ["movie"];
  if (explicitTv && !explicitMovie) kinds = ["tv"];

  let country = raw?.country ?? null;
  let language = raw?.language ?? null;
  const maps: Array<[RegExp, string, string]> = [
    [/مصري|مصرية|egypt/i, "EG", "ar"], [/تركي|تركية|turkish|turkey/i, "TR", "tr"],
    [/كوري|كورية|korean|korea/i, "KR", "ko"], [/ياباني|يابانية|japanese|japan/i, "JP", "ja"],
    [/هندي|هندية|بوليوود|indian|india/i, "IN", "hi"], [/أمريكي|امريكي|american|usa|us/i, "US", "en"],
  ];
  for (const [re, c, l] of maps) if (re.test(p)) { country ??= c; language ??= l; break; }
  if (/عربي|عربية|سوري|سورية|لبناني|لبنانية|خليجي|عراقي|عراقية/.test(p)) language ??= "ar";

  const rawGenres = Array.isArray(raw?.genres) ? raw!.genres!.filter(Boolean).map(String).slice(0, 4) : [];
  const wantsRomance = /رومانسي|رومانسية|حب|romantic|romance/.test(p);
  const genres = wantsRomance && !rawGenres.some((g) => normalizeGenre(g) === 10749)
    ? [...rawGenres, "romance"]
    : rawGenres;

  let runtimeMax = Number.isInteger(raw?.runtimeMax) ? raw!.runtimeMax! : null;
  if (/قصير(?:ة|ين)?|مختصر|short|brief/.test(p)) runtimeMax = runtimeMax ?? 100;
  if (/قصير(?:ة|ين)?\s*جداً|very short/.test(p)) runtimeMax = Math.min(runtimeMax ?? 90, 90);
  if (/اقل من ساعتين|أقل من ساعتين|under 2 hours|less than 2 hours/.test(p)) runtimeMax = Math.min(runtimeMax ?? 119, 119);
  const hourMatch = p.match(/(?:اقل|أقل)\s*من\s*(\d+(?:\.\d+)?)\s*ساع(?:ة|ات)/);
  if (hourMatch) runtimeMax = Math.min(runtimeMax ?? Number(hourMatch[1]) * 60 - 1, Number(hourMatch[1]) * 60 - 1);
  const minuteMatch = p.match(/(?:اقل|أقل)\s*من\s*(\d+)\s*(?:دقيقة|دقائق|minutes?)/i);
  if (minuteMatch) runtimeMax = Math.min(runtimeMax ?? Number(minuteMatch[1]) - 1, Number(minuteMatch[1]) - 1);

  return {
    kinds, country, language, genres,
    min_year: Number.isInteger(raw?.min_year) ? raw!.min_year! : null,
    max_year: Number.isInteger(raw?.max_year) ? raw!.max_year! : null,
    mood: raw?.mood ?? null,
    runtimeMax,
  };
}

async function resolveAIItems(key: string, items: AIItem[], intent: Intent, lang: "ar" | "en") {
  const results = await Promise.all(items.slice(0, 12).map(async (item) => {
    const kind = item.kind === "tv" ? "tv" : "movie";
    if (!intent.kinds.includes(kind)) return null;
    const hit = await tmdbSearchBest(key, kind, item.title!, item.year, intent);
    if (!hit || !matchesHardConstraints(hit, kind, intent)) return null;
    return toRec(hit, kind, item.reason || (lang === "en" ? "Matches your request." : "يناسب طلبك."));
  }));
  return mergeUnique([], results.filter(Boolean) as Rec[]);
}

async function tmdbSearchBest(key: string, kind: "movie" | "tv", title: string, year: string | undefined, intent: Intent): Promise<any | null> {
  try {
    const url = new URL(`https://api.themoviedb.org/3/search/${kind}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", "en-US");
    url.searchParams.set("query", title);
    url.searchParams.set("include_adult", "false");
    if (year && /^\d{4}$/.test(year)) url.searchParams.set(kind === "movie" ? "year" : "first_air_date_year", year);
    const r = await fetch(url.toString(), { headers: { accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    const list: any[] = (j.results || []).filter((x: any) => x.poster_path);
    if (!list.length) return null;

    list.sort((a, b) => scoreTmdb(b, intent, year) - scoreTmdb(a, intent, year));
    const candidates = list.slice(0, 6);
    if (!intent.runtimeMax && !intent.genres.length) return candidates[0] ?? null;

    for (const candidate of candidates) {
      const detail = await fetchTmdbDetail(key, kind, candidate.id, "en-US");
      if (detail && matchesHardConstraints(detail, kind, intent)) return detail;
    }
    return null;
  } catch { return null; }
}

async function fetchTmdbDetail(key: string, kind: "movie" | "tv", id: number, language: string) {
  try {
    const url = new URL(`https://api.themoviedb.org/3/${kind}/${id}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", language);
    const r = await fetch(url.toString(), { headers: { accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function scoreTmdb(it: any, intent: Intent, year?: string) {
  let score = Number(it.popularity || 0);
  if (intent.language && it.original_language === intent.language) score += 100;
  if (intent.country && (it.origin_country || []).includes(intent.country)) score += 150;
  const date = it.release_date || it.first_air_date || "";
  if (year && date.startsWith(year)) score += 50;
  return score;
}

function matchesHardConstraints(it: any, kind: "movie" | "tv", intent: Intent) {
  const requiredGenres = intent.genres.map(normalizeGenre).filter((x): x is number => Number.isInteger(x));
  if (requiredGenres.length) {
    const actualGenres = Array.isArray(it.genre_ids) ? it.genre_ids : Array.isArray(it.genres) ? it.genres.map((g: any) => g.id) : [];
    if (!requiredGenres.every((id) => actualGenres.includes(id))) return false;
  }
  if (intent.runtimeMax != null) {
    const runtime = kind === "tv"
      ? Number(Array.isArray(it.episode_run_time) ? it.episode_run_time[0] : 0)
      : Number(it.runtime || 0);
    if (!Number.isFinite(runtime) || runtime <= 0 || runtime > intent.runtimeMax) return false;
  }
  if (intent.country && Array.isArray(it.origin_country) && it.origin_country.length && !it.origin_country.includes(intent.country)) return false;
  if (intent.language && it.original_language && it.original_language !== intent.language) return false;
  const date = it.release_date || it.first_air_date || "";
  if (intent.min_year && date && Number(date.slice(0, 4)) < intent.min_year) return false;
  if (intent.max_year && date && Number(date.slice(0, 4)) > intent.max_year) return false;
  return true;
}

async function discoverFallback(key: string, intent: Intent, lang: "ar" | "en"): Promise<Rec[]> {
  const out: Rec[] = [];
  const genres = intent.genres.map(normalizeGenre).filter((x): x is number => Number.isInteger(x)).slice(0, 3);
  for (const kind of intent.kinds) {
    try {
      const url = new URL(`https://api.themoviedb.org/3/discover/${kind}`);
      url.searchParams.set("api_key", key);
      url.searchParams.set("language", lang === "ar" ? "ar-SA" : "en-US");
      url.searchParams.set("include_adult", "false");
      url.searchParams.set("sort_by", "popularity.desc");
      url.searchParams.set("vote_count.gte", "80");
      if (genres.length) url.searchParams.set("with_genres", genres.join(","));
      if (intent.language) url.searchParams.set("with_original_language", intent.language);
      if (intent.country) url.searchParams.set("with_origin_country", intent.country);
      if (intent.min_year) url.searchParams.set(kind === "movie" ? "primary_release_date.gte" : "first_air_date.gte", `${intent.min_year}-01-01`);
      if (intent.max_year) url.searchParams.set(kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte", `${intent.max_year}-12-31`);
      if (kind === "movie" && intent.runtimeMax != null) url.searchParams.set("with_runtime.lte", String(intent.runtimeMax));
      const r = await fetch(url.toString(), { headers: { accept: "application/json" } });
      if (!r.ok) continue;
      const j = await r.json();
      for (const hit of (j.results || []).slice(0, 12)) {
        if (!hit.poster_path) continue;
        if (intent.runtimeMax != null || genres.length || intent.country || intent.language || intent.min_year || intent.max_year) {
          const detail = await fetchTmdbDetail(key, kind, hit.id, lang === "ar" ? "ar-SA" : "en-US");
          if (!detail || !matchesHardConstraints(detail, kind, intent)) continue;
          out.push(toRec(detail, kind, lang === "en" ? "Selected from TMDB using your filters." : "اختيار مطابق للفلاتر المطلوبة."));
        } else {
          out.push(toRec(hit, kind, lang === "en" ? "Selected from TMDB." : "اختيار من قاعدة بيانات فلمك."));
        }
        if (out.length >= 12) break;
      }
    } catch (e) { console.warn("TMDB discover fallback failed", e); }
  }
  return mergeUnique([], out);
}

function normalizeGenre(g: string): number | null {
  const key = g.toLowerCase().replace(/[-_]/g, "").replace(/\s+/g, "");
  if (GENRE_IDS[key]) return GENRE_IDS[key];
  const normalizedArabic = key.replace(/[أإآ]/g, "ا");
  const aliases: Record<string, string> = {
    رعب: "horror", كوميديا: "comedy", مضحك: "comedy", اكشن: "action", رومانسية: "romance", رومانسي: "romance",
    حب: "romance", دراما: "drama", اثارة: "thriller", إثارة: "thriller", جريمة: "crime", غموض: "mystery",
    خيال: "fantasy", خيالعلمي: "sciencefiction",
  };
  return GENRE_IDS[aliases[g] || aliases[normalizedArabic] || ""] ?? null;
}

function toRec(hit: any, kind: "movie" | "tv", reason: string): Rec {
  const date = hit.release_date || hit.first_air_date || "";
  return {
    id: hit.id,
    mediaType: kind,
    title: hit.title || hit.name || hit.original_title || hit.original_name || "Unknown",
    poster: hit.poster_path ? `https://image.tmdb.org/t/p/w500${hit.poster_path}` : null,
    year: date.slice(0, 4),
    rating: Math.round(Number(hit.vote_average || 0) * 10) / 10,
    overview: hit.overview || "",
    reason,
  };
}

function mergeUnique(base: Rec[], extra: Rec[]) {
  const seen = new Set(base.map((r) => `${r.mediaType}:${r.id}`));
  for (const item of extra) {
    if (!item?.poster) continue;
    const key = `${item.mediaType}:${item.id}`;
    if (!seen.has(key)) { seen.add(key); base.push(item); }
  }
  return base;
}

function extractJson(text: string): string {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (t.startsWith("{")) return t;
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  return start >= 0 && end > start ? t.slice(start, end + 1) : "{}";
}

type Provider = { name: string; run: (system: string, user: string) => Promise<string> };

async function callAIWithFallback(system: string, user: string): Promise<string> {
  const providers: Provider[] = [];
  if (process.env.GEMINI_API_KEY) providers.push({ name: "gemini", run: (s, u) => callGemini(s, u, process.env.GEMINI_API_KEY!) });
  if (process.env.GROQ_API_KEY) providers.push({ name: "groq", run: (s, u) => callOpenAICompat(s, u, { url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY!, model: "llama-3.3-70b-versatile" }) });
  if (process.env.OPENROUTER_API_KEY) providers.push({ name: "openrouter", run: (s, u) => callOpenAICompat(s, u, { url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY!, model: "openrouter/free" }) });
  if (process.env.MISTRAL_API_KEY) providers.push({ name: "mistral", run: (s, u) => callOpenAICompat(s, u, { url: "https://api.mistral.ai/v1/chat/completions", key: process.env.MISTRAL_API_KEY!, model: "mistral-small-latest" }) });
  if (process.env.OPENAI_API_KEY) providers.push({ name: "openai", run: (s, u) => callOpenAICompat(s, u, { url: "https://api.openai.com/v1/chat/completions", key: process.env.OPENAI_API_KEY!, model: "gpt-4o-mini" }) });
  if (process.env.GITHUB_FINE_GRAINED_PERSONAL_ACCESS_TOKEN) providers.push({ name: "github", run: (s, u) => callOpenAICompat(s, u, { url: "https://models.github.ai/inference/chat/completions", key: process.env.GITHUB_FINE_GRAINED_PERSONAL_ACCESS_TOKEN!, model: "openai/gpt-4o-mini" }) });
  if (!providers.length) throw new Error("No AI provider is configured.");
  const errors: string[] = [];
  for (const p of providers) {
    try { const out = await p.run(system, user); if (out?.trim()) return out; errors.push(`${p.name}: empty response`); }
    catch (e) { errors.push(`${p.name}: ${(e as Error).message}`); }
  }
  throw new Error(`All AI providers failed: ${errors.join(" | ")}`);
}

async function callGemini(system: string, user: string, key: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.4 } }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAICompat(system: string, user: string, cfg: { url: string; key: string; model: string }): Promise<string> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}`, "HTTP-Referer": "https://filmak.site", "X-Title": "Filmak" },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || "";
}
