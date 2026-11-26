import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const allowedOrigin = "https://filmak.site";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const origin = req.headers.get("origin");
  if (origin !== allowedOrigin && origin !== "https://www.filmak.site") {
    return json({ error: "Origin not allowed" }, 403);
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Invalid request" }, 400);
    }

    if (typeof body.company === "string" && body.company.trim()) {
      return json({ success: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body.subject === "string" ? body.subject : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const validSubjects = new Set(["general", "editorial", "technical", "dmca"]);

    if (name.length < 2 || name.length > 100) return json({ error: "Invalid name" }, 400);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }
    if (!validSubjects.has(subject)) return json({ error: "Invalid subject" }, 400);
    if (message.length < 20 || message.length > 5000) {
      return json({ error: "Message must be between 20 and 5000 characters" }, 400);
    }

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipHash = await sha256(ip);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase server environment");
      return json({ error: "Service temporarily unavailable" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (countError) {
      console.error("Contact rate-limit check failed:", countError.message);
      return json({ error: "Service temporarily unavailable" }, 503);
    }
    if ((count ?? 0) >= 5) return json({ error: "Too many messages. Try again later." }, 429);

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      ip_hash: ipHash,
    });
    if (insertError) {
      console.error("Contact message insert failed:", insertError.message);
      return json({ error: "Could not save your message. Please try again." }, 503);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Contact submission failed:", error);
    return json({ error: "Invalid request" }, 400);
  }
});
