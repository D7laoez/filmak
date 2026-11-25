import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

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
  if (email !== OWNER_ADMIN_EMAIL) return false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: ctx.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) console.warn("[admin-guard] owner role bootstrap failed:", error.message);
  } catch (error) {
    console.warn("[admin-guard] owner role bootstrap unavailable:", error);
  }
  return true;
}

async function assertAdmin(ctx: AdminContext) {
  if (!(await isOwnerAdmin(ctx))) throw new Error("Forbidden: owner admin access required");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ isAdmin: await isOwnerAdmin(context) }));

/** Logs an unauthorized attempt without storing the user's email or full ID. */
export const logUnauthorizedAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        path: z.string().max(128).default("unknown"),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const userPrefix = context.userId.slice(0, 8);
    console.warn(
      `[admin-guard] unauthorized access attempt path=${data.path} user=${userPrefix} at=${new Date().toISOString()}`,
    );
    return { ok: true as const };
  });

export type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  favorites_count: number;
  lists_count: number;
};
export type AdminStats = {
  total_users: number;
  total_admins: number;
  total_favorites: number;
  total_lists: number;
  signups_last_7d: number;
};
export type AdminUserDetail = {
  user: AdminUserRow;
  favorites: Array<{
    id: string;
    title: string;
    year: string | null;
    rating: number | null;
    poster: string | null;
    created_at: string;
    movie_id: number;
  }>;
  lists: Array<{
    id: string;
    title: string;
    media_type: string;
    media_id: number;
    status: string;
    rating: number | null;
    year: string | null;
    poster: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [usersRes, favsRes, listsRes, rolesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("favorites").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("user_lists").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin"),
    ]);
    if (usersRes.error) throw new Error(usersRes.error.message);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total_users: usersRes.data.users.length,
      total_admins: rolesRes.count ?? 0,
      total_favorites: favsRes.count ?? 0,
      total_lists: listsRes.count ?? 0,
      signups_last_7d: usersRes.data.users.filter(
        (u) => new Date(u.created_at).getTime() >= weekAgo,
      ).length,
    } satisfies AdminStats;
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authErr) throw new Error(authErr.message);
    const userIds = authData.users.map((u) => u.id);
    const [{ data: roles }, { data: favs }, { data: lists }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", userIds),
      supabaseAdmin.from("favorites").select("user_id").in("user_id", userIds),
      supabaseAdmin.from("user_lists").select("user_id").in("user_id", userIds),
    ]);
    const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const favCount = new Map<string, number>();
    (favs ?? []).forEach((f) => favCount.set(f.user_id, (favCount.get(f.user_id) ?? 0) + 1));
    const listCount = new Map<string, number>();
    (lists ?? []).forEach((l) => listCount.set(l.user_id, (listCount.get(l.user_id) ?? 0) + 1));
    return authData.users
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        is_admin: adminSet.has(u.id) || u.email?.trim().toLowerCase() === OWNER_ADMIN_EMAIL,
        favorites_count: favCount.get(u.id) ?? 0,
        lists_count: listCount.get(u.id) ?? 0,
      }))
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ) satisfies AdminUserRow[];
  });

export const getUserDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().min(1).max(128),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: authUser, error: authErr }, favsRes, listsRes, rolesRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(data.userId),
      supabaseAdmin
        .from("favorites")
        .select("id, title, year, rating, poster, created_at, movie_id")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("user_lists")
        .select(
          "id, title, media_type, media_id, status, rating, year, poster, note, created_at, updated_at",
        )
        .eq("user_id", data.userId)
        .order("updated_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId),
    ]);
    if (authErr) throw new Error(authErr.message);
    const u = authUser.user!;
    return {
      user: {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        is_admin:
          (rolesRes.data ?? []).some((r) => r.role === "admin") ||
          u.email?.trim().toLowerCase() === OWNER_ADMIN_EMAIL,
        favorites_count: favsRes.data?.length ?? 0,
        lists_count: listsRes.data?.length ?? 0,
      },
      favorites: (favsRes.data ?? []) as AdminUserDetail["favorites"],
      lists: (listsRes.data ?? []) as AdminUserDetail["lists"],
    } satisfies AdminUserDetail;
  });

export const toggleAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().min(1).max(128),
        makeAdmin: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.makeAdmin && data.userId !== context.userId)
      throw new Error("هذا الموقع لديه مدير واحد فقط.");
    if (data.userId === context.userId && !data.makeAdmin)
      throw new Error("لا يمكنك إزالة دور الـ admin عن نفسك.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().min(1).max(128),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك الخاص من هنا.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
