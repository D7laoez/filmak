import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const OWNER_ADMIN_EMAIL = "ali.m2002121@gmail.com";
type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims?: { email?: string };
};

async function getAuthenticatedEmail(ctx: AdminContext) {
  const claimEmail = String(ctx.claims?.email ?? "")
    .trim()
    .toLowerCase();
  if (claimEmail) return claimEmail;
  const { data, error } = await ctx.supabase.auth.getUser();
  if (error || !data.user?.email) return "";
  return data.user.email.trim().toLowerCase();
}

async function isOwnerAdmin(ctx: AdminContext) {
  const email = await getAuthenticatedEmail(ctx);
  if (email === OWNER_ADMIN_EMAIL) return true;
  // Also check role in DB
  try {
    const { data } = await ctx.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

async function assertAdmin(ctx: AdminContext) {
  if (!(await isOwnerAdmin(ctx))) throw new Error("Forbidden: owner admin access required");
}

// 1. List all editorial reviews
export const adminListEditorialReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("editorial_reviews")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listEditorialReviewsAdmin = adminListEditorialReviews;

// 2. Upsert editorial review
export const adminUpsertEditorialReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        movie_id: z.number().int().positive(),
        title: z.string().default(""),
        verdict: z.string().min(5),
        review_content: z.string().optional(),
        strengths: z.array(z.string()).default([]),
        weaknesses: z.array(z.string()).default([]),
        who_should_watch: z.string().optional(),
        who_may_not_enjoy: z.string().optional(),
        why_watch: z.string().optional(),
        best_for: z.string().optional(),
        mood: z.string().optional(),
        experience_level: z.string().optional(),
        recommended_viewing: z.string().optional(),
        content_notes: z.string().optional(),
        editorial_score: z.number().min(0).max(10),
        story_score: z.number().min(0).max(10).optional(),
        acting_score: z.number().min(0).max(10).optional(),
        visuals_score: z.number().min(0).max(10).optional(),
        entertainment_score: z.number().min(0).max(10).optional(),
        author_name: z.string().default("فريق تحرير فلمك"),
        author_role: z.string().default("هيئة التحرير السينمائي"),
        status: z.enum(["published", "draft", "archived"]).default("published"),
        similar_reasons: z.record(z.string()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin
      .from("editorial_reviews")
      .upsert(
        {
          ...data,
          review_content: data.review_content ?? "",
          author_id: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "movie_id" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, review: result };
  });

export const upsertEditorialReviewAdmin = adminUpsertEditorialReview;

// 3. Delete editorial review
export const adminDeleteEditorialReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ movieId: z.number().int().positive() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("editorial_reviews")
      .delete()
      .eq("movie_id", data.movieId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteEditorialReviewAdmin = adminDeleteEditorialReview;

// 4. List all articles for Admin
export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listArticlesAdmin = adminListArticles;

// 5. Upsert article
export const adminUpsertArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(2),
        title_ar: z.string().min(3),
        title_en: z.string().min(3),
        subtitle_ar: z.string().optional(),
        subtitle_en: z.string().optional(),
        excerpt_ar: z.string().min(5),
        excerpt_en: z.string().min(5),
        content_ar: z.string().min(20),
        content_en: z.string().min(20),
        category: z.string().default("guides"),
        featured_image: z.string().optional(),
        author_name: z.string().default("علي الخفاجي"),
        author_role: z.string().default("رئيس التحرير وناقد سينمائي"),
        author_avatar: z.string().default("/icon-192.png"),
        related_movie_ids: z.array(z.number()).default([]),
        related_article_slugs: z.array(z.string()).default([]),
        reading_time_minutes: z.number().int().min(1).default(5),
        featured: z.boolean().default(false),
        status: z.enum(["published", "draft", "archived"]).default("published"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin
      .from("articles")
      .upsert(
        {
          ...data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, article: result };
  });

export const upsertArticleAdmin = adminUpsertArticle;

// 6. Delete article
export const adminDeleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteArticleAdmin = adminDeleteArticle;
