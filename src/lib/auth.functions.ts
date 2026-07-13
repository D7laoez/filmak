import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const emailExists = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ email: z.string().email() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exists, error } = await (supabaseAdmin.rpc as any)("email_exists", {
      _email: data.email,
    });
    if (error) throw error;
    return Boolean(exists);
  });