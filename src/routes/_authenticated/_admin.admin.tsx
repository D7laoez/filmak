import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
  Heart,
  ListChecks,
  UserPlus,
  X,
} from "lucide-react";
import {
  getAdminStats,
  listUsers,
  getUserDetail,
  toggleAdminRole,
  deleteUser,
  type AdminUserRow,
} from "@/lib/admin.functions";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — فلمك" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { dir } = useLocale();
  const qc = useQueryClient();
  const statsFn = useServerFn(getAdminStats);
  const usersFn = useServerFn(listUsers);
  const detailFn = useServerFn(getUserDetail);
  const toggleFn = useServerFn(toggleAdminRole);
  const deleteFn = useServerFn(deleteUser);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn(), retry: false });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn(), retry: false });
  const detail = useQuery({
    queryKey: ["admin-user", selectedId],
    queryFn: () => detailFn({ data: { userId: selectedId! } }),
    enabled: !!selectedId,
    retry: false,
  });

  const toggleMut = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => toggleFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      if (selectedId) qc.invalidateQueries({ queryKey: ["admin-user", selectedId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const filtered = useMemo(() => {
    if (!users.data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users.data;
    return users.data.filter(
      (u) => (u.email ?? "").toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    );
  }, [users.data, search]);

  const forbidden =
    (stats.error instanceof Error && /Forbidden|admin/i.test(stats.error.message)) ||
    (users.error instanceof Error && /Forbidden|admin/i.test(users.error.message));

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-secondary/60 border border-border rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition"
            >
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Link>
            <Logo size={32} />
            <span className="text-sm font-semibold text-muted-foreground">لوحة الإدارة</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/seo-status"
              className="text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition"
            >
              SEO
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {forbidden && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-2xl p-6 text-sm">
            <p className="font-semibold mb-1">الوصول مقيّد</p>
            <p className="text-muted-foreground">حسابك لا يملك صلاحية admin.</p>
          </div>
        )}

        {!forbidden && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={<UsersIcon className="w-5 h-5" />} label="مستخدمين" value={stats.data?.total_users} />
              <StatCard icon={<Shield className="w-5 h-5" />} label="مشرفين" value={stats.data?.total_admins} />
              <StatCard icon={<Heart className="w-5 h-5" />} label="مفضلات" value={stats.data?.total_favorites} />
              <StatCard icon={<ListChecks className="w-5 h-5" />} label="عناصر قوائم" value={stats.data?.total_lists} />
              <StatCard icon={<UserPlus className="w-5 h-5" />} label="جدد (7 أيام)" value={stats.data?.signups_last_7d} />
            </section>

            <section className="border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-semibold">المستخدمون ({filtered.length})</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-secondary/40 border border-border rounded-full px-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث بالإيميل أو ID..."
                      className="bg-transparent outline-none py-2 px-2 text-sm w-56"
                    />
                  </div>
                  <button
                    onClick={() => {
                      users.refetch();
                      stats.refetch();
                    }}
                    disabled={users.isFetching}
                    className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${users.isFetching ? "animate-spin" : ""}`} />
                    تحديث
                  </button>
                </div>
              </div>

              {users.isLoading && (
                <div className="py-12 flex items-center justify-center">
                  <Spinner size={48} label="جاري التحميل" />
                </div>
              )}

              {users.data && (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-start py-2 px-2">الإيميل</th>
                        <th className="text-start py-2 px-2">تسجيل</th>
                        <th className="text-start py-2 px-2">آخر دخول</th>
                        <th className="text-center py-2 px-2">مفضلة</th>
                        <th className="text-center py-2 px-2">قوائم</th>
                        <th className="text-center py-2 px-2">دور</th>
                        <th className="text-end py-2 px-2">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <UserRow
                          key={u.id}
                          user={u}
                          onOpen={() => setSelectedId(u.id)}
                          onToggleAdmin={() =>
                            toggleMut.mutate({ userId: u.id, makeAdmin: !u.is_admin })
                          }
                          onDelete={() => {
                            if (confirm(`حذف الحساب ${u.email ?? u.id}؟ هذا لا يمكن التراجع عنه.`)) {
                              deleteMut.mutate(u.id);
                            }
                          }}
                          disabled={toggleMut.isPending || deleteMut.isPending}
                        />
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            لا يوجد نتائج
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {(toggleMut.error || deleteMut.error) && (
                <div className="text-sm text-destructive">
                  {(toggleMut.error as Error)?.message || (deleteMut.error as Error)?.message}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedId && (
        <UserDrawer
          onClose={() => setSelectedId(null)}
          data={detail.data}
          loading={detail.isLoading}
          error={detail.error as Error | null}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="border border-border rounded-2xl p-4 bg-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function UserRow({
  user,
  onOpen,
  onToggleAdmin,
  onDelete,
  disabled,
}: {
  user: AdminUserRow;
  onOpen: () => void;
  onToggleAdmin: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <tr className="border-b border-border/50 hover:bg-secondary/20 transition">
      <td className="py-2 px-2">
        <button onClick={onOpen} className="text-primary hover:underline text-start">
          {user.email ?? user.id.slice(0, 8)}
        </button>
      </td>
      <td className="py-2 px-2 text-muted-foreground text-xs">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="py-2 px-2 text-muted-foreground text-xs">
        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "—"}
      </td>
      <td className="py-2 px-2 text-center">{user.favorites_count}</td>
      <td className="py-2 px-2 text-center">{user.lists_count}</td>
      <td className="py-2 px-2 text-center">
        {user.is_admin ? (
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
            <Shield className="w-3 h-3" /> admin
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">user</span>
        )}
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onToggleAdmin}
            disabled={disabled}
            title={user.is_admin ? "إزالة admin" : "منح admin"}
            className="p-1.5 rounded-full hover:bg-secondary transition disabled:opacity-40"
          >
            {user.is_admin ? (
              <ShieldOff className="w-4 h-4 text-amber-500" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            title="حذف الحساب"
            className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserDrawer({
  onClose,
  data,
  loading,
  error,
}: {
  onClose: () => void;
  data: ReturnType<typeof getUserDetail> extends Promise<infer T> ? T | undefined : never;
  loading: boolean;
  error: Error | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-background border-s border-border h-full overflow-y-auto"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold">تفاصيل المستخدم</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading && (
            <div className="py-12 flex items-center justify-center">
              <Spinner size={48} />
            </div>
          )}
          {error && <div className="text-sm text-destructive">{error.message}</div>}
          {data && (
            <>
              <div className="border border-border rounded-xl p-4 space-y-1 text-sm">
                <div className="font-medium">{data.user.email ?? data.user.id}</div>
                <div className="text-xs text-muted-foreground font-mono">{data.user.id}</div>
                <div className="text-xs text-muted-foreground pt-2">
                  سجل: {new Date(data.user.created_at).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  آخر دخول:{" "}
                  {data.user.last_sign_in_at
                    ? new Date(data.user.last_sign_in_at).toLocaleString()
                    : "—"}
                </div>
                <div className="text-xs pt-1">
                  الدور:{" "}
                  <span className={data.user.is_admin ? "text-primary" : "text-muted-foreground"}>
                    {data.user.is_admin ? "admin" : "user"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> المفضلة ({data.favorites.length})
                </h4>
                <div className="space-y-2">
                  {data.favorites.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 border border-border/60 rounded-xl p-2">
                      {f.poster && (
                        <img src={f.poster} alt={f.title} className="w-10 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{f.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.year ?? "—"} · ⭐ {f.rating ?? "—"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {data.favorites.length === 0 && (
                    <div className="text-xs text-muted-foreground">لا يوجد</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> القوائم ({data.lists.length})
                </h4>
                <div className="space-y-2">
                  {data.lists.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 border border-border/60 rounded-xl p-2">
                      {l.poster && (
                        <img src={l.poster} alt={l.title} className="w-10 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{l.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {l.media_type} · {l.status} · ⭐ {l.rating ?? "—"}
                        </div>
                        {l.note && <div className="text-xs text-muted-foreground truncate">{l.note}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(l.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {data.lists.length === 0 && (
                    <div className="text-xs text-muted-foreground">لا يوجد</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}