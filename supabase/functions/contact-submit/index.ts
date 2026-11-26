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

async function hmacSha256(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
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

    // Quietly accept honeypot submissions without storing them.
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase server environment");
      return json({ error: "Service temporarily unavailable" }, 503);
    }

    // HMAC prevents easy reverse lookup of visitor IPs from the stored rate-limit digest.
    const ipHash = await hmacSha256(ip, serviceRoleKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: accepted, error: submitError } = await supabase.rpc("submit_contact_message", {
      p_name: name,
      p_email: email,
      p_subject: subject,
      p_message: message,
      p_ip_hash: ipHash,
    });

    if (submitError) {
      console.error("Contact message submission failed:", submitError.message);
      return json({ error: "Service temporarily unavailable" }, 503);
    }
    if (accepted !== true) {
      return json({ error: "Too many messages. Try again later." }, 429);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Contact submission failed:", error);
    return json({ error: "Invalid request" }, 400);
  }
});
