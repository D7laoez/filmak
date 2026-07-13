import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Resolve a login identifier (email OR username) to the email address
 * Supabase needs for signInWithPassword. Uses the admin client to look
 * up the profile→auth.users email server-side without exposing it.
 * Returns null if not found (caller shows a generic "invalid credentials").
 */
export const resolveLoginIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string }) =>
    z
      .object({
        identifier: z.string().trim().min(2).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const raw = data.identifier.trim();
    if (raw.includes("@")) {
      return { email: raw };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", raw)
      .maybeSingle();
    if (error || !profile) return { email: null };

    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      profile.id,
    );
    if (userErr || !userData.user?.email) return { email: null };
    return { email: userData.user.email };
  });

/**
 * Check if a username is already taken (case-insensitive).
 * Public — used by the signup form for live validation.
 */
export const isUsernameAvailable = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string }) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[a-zA-Z0-9_.-]+$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("username", data.username)
      .maybeSingle();
    return { available: !existing };
  });