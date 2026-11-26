import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  Heart,
  ListChecks,
  UserPlus,
  Globe2,
  Monitor,
  MapPin,
  Activity,
  X,
  LogIn,
  Eye,
  Smartphone,
  BookOpen,
  Award,
  Plus,
  Edit,
  Save,
  CheckCircle2,
  FileText,
  Inbox,
} from "lucide-react";
import {
  getAdminStats,
  listUsers,
  getUserDetail,
  toggleAdminRole,
  deleteUser,
  type AdminUserRow,
} from "@/lib/admin.functions";
import {
  adminListEditorialReviews,
  adminUpsertEditorialReview,
  adminDeleteEditorialReview,
  adminListArticles,
  adminUpsertArticle,
  adminDeleteArticle,
} from "@/lib/admin.editorial.functions";
import { getSiteAnalytics, type SiteAnalytics } from "@/lib/site-analytics.functions";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({
    meta: [{ title: "لوحة الإدارة — فلمك" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { dir } = useLocale();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"analytics" | "reviews" | "articles">("analytics");

  const statsFn = useServerFn(getAdminStats);
  const usersFn = useServerFn(listUsers);
  const detailFn = useServerFn(getUserDetail);
  const analyticsFn = useServerFn(getSiteAnalytics);
  const toggleFn = useServerFn(toggleAdminRole);
  const deleteFn = useServerFn(deleteUser);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn(), retry: false });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn(), retry: false });
  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsFn(),
    retry: false,
    staleTime: 30_000,
  });
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
    const all = users.data ?? [];
    const q = search.trim().toLowerCase();
    return q
      ? all.filter(
          (u) => (u.email ?? "").toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
        )
      : all;
  }, [users.data, search]);

  const forbidden =
    (stats.error instanceof Error && /Forbidden|admin/i.test(stats.error.message)) ||
    (analytics.error instanceof Error && /Forbidden|admin/i.test(analytics.error.message));

  const refresh = () => {
    stats.refetch();
    users.refetch();
    analytics.refetch();
    qc.invalidateQueries({ queryKey: ["admin-editorial-reviews"] });
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
            <Logo size={32} />
            <div>
              <div className="font-semibold">لوحة إدارة فلمك التحريرية</div>
              <div className="text-xs text-muted-foreground">
                Owner analytics & CMS control center
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/messages"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm"
            >
              <Inbox className="h-4 w-4" />
              رسائل التواصل
            </Link>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${stats.isFetching || analytics.isFetching ? "animate-spin" : ""}`}
              />
              تحديث
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* CMS Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 border-t border-border/40 pt-2 pb-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "analytics"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            📊 الإحصائيات والمستخدمين
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "reviews"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            ⭐ مراجعات حكم فلمك (Reviews CMS)
          </button>
          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === "articles"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            📖 المقالات والأدلة (Articles CMS)
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {forbidden ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <b>الوصول مقيّد</b>
            <p className="mt-1 text-sm text-muted-foreground">
              هذه اللوحة للمالك فقط (ali.m2002121@gmail.com).
            </p>
          </div>
        ) : activeTab === "analytics" ? (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <Kpi icon={<Users />} label="الحسابات" value={stats.data?.total_users} />
              <Kpi icon={<Eye />} label="الزيارات" value={analytics.data?.total_visits} />
              <Kpi icon={<Activity />} label="الجلسات" value={analytics.data?.unique_sessions} />
              <Kpi icon={<Globe2 />} label="IP فريد" value={analytics.data?.unique_ips} />
              <Kpi icon={<LogIn />} label="زيارات مسجلة" value={analytics.data?.logged_in_visits} />
              <Kpi icon={<Heart />} label="المفضلة" value={stats.data?.total_favorites} />
              <Kpi icon={<ListChecks />} label="عناصر القوائم" value={stats.data?.total_lists} />
              <Kpi icon={<UserPlus />} label="تسجيلات 7 أيام" value={stats.data?.signups_last_7d} />
            </section>
            <section className="grid gap-4 lg:grid-cols-3">
              <Panel title="الزيارات اليومية — آخر 30 يوم">
                <DailyChart data={analytics.data?.daily ?? []} />
              </Panel>
              <Panel title="الدول">
                <RankList
                  rows={
                    analytics.data?.countries?.map((x) => ({
                      label: x.country,
                      value: x.visits,
                    })) ?? []
                  }
                />
              </Panel>
              <Panel title="الأجهزة">
                <RankList
                  rows={
                    analytics.data?.devices?.map((x) => ({ label: x.device, value: x.visits })) ??
                    []
                  }
                />
              </Panel>
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <Panel title="أكثر الصفحات زيارة">
                <RankList
                  rows={
                    analytics.data?.top_paths?.map((x) => ({ label: x.path, value: x.visits })) ??
                    []
                  }
                  mono
                />
              </Panel>
              <Panel title="أكثر عناوين IP نشاطًا">
                <IpList rows={analytics.data?.top_ips ?? []} />
              </Panel>
            </section>
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">الحسابات المسجلة ({filtered.length})</h2>
                  <p className="text-xs text-muted-foreground">
                    الإيميل، آخر دخول، المفضلة، القوائم والدور
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-border bg-secondary/40 px-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="بحث بالإيميل أو ID"
                      className="w-48 bg-transparent px-2 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
              {users.isLoading ? (
                <div className="py-12 text-center">
                  <Spinner size={42} label="جاري التحميل" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2 text-start">الإيميل</th>
                        <th className="p-2 text-start">التسجيل</th>
                        <th className="p-2 text-start">آخر دخول</th>
                        <th className="p-2">مفضلة</th>
                        <th className="p-2">قوائم</th>
                        <th className="p-2">الدور</th>
                        <th className="p-2 text-end">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u) => (
                        <tr key={u.id} className="border-b border-border/40 hover:bg-secondary/20">
                          <td className="p-2">
                            <button
                              onClick={() => setSelectedId(u.id)}
                              className="max-w-[280px] truncate text-start text-primary hover:underline"
                            >
                              {u.email ?? u.id}
                            </button>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{fmt(u.created_at)}</td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {u.last_sign_in_at ? fmt(u.last_sign_in_at) : "—"}
                          </td>
                          <td className="p-2 text-center">{u.favorites_count}</td>
                          <td className="p-2 text-center">{u.lists_count}</td>
                          <td className="p-2 text-center">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                <Shield className="h-3 w-3" />
                                admin
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">user</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-end gap-1">
                              <button
                                disabled={toggleMut.isPending}
                                onClick={() =>
                                  toggleMut.mutate({ userId: u.id, makeAdmin: !u.is_admin })
                                }
                                className="rounded-full p-2 hover:bg-secondary disabled:opacity-40"
                                title="تغيير الدور"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                              <button
                                disabled={deleteMut.isPending}
                                onClick={() =>
                                  confirm(`حذف ${u.email ?? u.id}؟`) && deleteMut.mutate(u.id)
                                }
                                className="rounded-full p-2 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            لا توجد نتائج
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : activeTab === "reviews" ? (
          <EditorialReviewsCms />
        ) : (
          <ArticlesCms />
        )}
      </main>
      {selectedId && (
        <UserDrawer
          data={detail.data}
          loading={detail.isLoading}
          error={detail.error as Error | null}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function EditorialReviewsCms() {
  const qc = useQueryClient();
  const listReviewsFn = useServerFn(adminListEditorialReviews);
  const upsertReviewFn = useServerFn(adminUpsertEditorialReview);
  const deleteReviewFn = useServerFn(adminDeleteEditorialReview);

  const reviewsQuery = useQuery({
    queryKey: ["admin-editorial-reviews"],
    queryFn: () => listReviewsFn(),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    movie_id: 157336,
    verdict: "",
    story_score: 9.0,
    acting_score: 9.0,
    visuals_score: 9.5,
    entertainment_score: 9.0,
    editorial_score: 9.1,
    who_should_watch: "",
    who_may_not_enjoy: "",
    why_watch: "",
    mood: "",
    recommended_viewing: "",
    experience_level: "مناسب لجميع المستويات",
    content_notes: "لا يحتوي على مشاهد خادشة",
    strengths: "قصة محبوكة\nأداء تمثيلي قوي",
    weaknesses: "إيقاع بطيء في البداية",
    review_content: "",
  });

  const upsertMut = useMutation({
    mutationFn: (
      data: Omit<typeof formData, "strengths" | "weaknesses"> & {
        strengths: string[];
        weaknesses: string[];
      },
    ) => upsertReviewFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ المراجعة بنجاح");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-editorial-reviews"] });
    },
    onError: (err: Error) => toast.error(err.message || "حدث خطأ"),
  });

  const deleteMut = useMutation({
    mutationFn: (movieId: number) => deleteReviewFn({ data: { movieId } }),
    onSuccess: () => {
      toast.success("تم حذف المراجعة");
      qc.invalidateQueries({ queryKey: ["admin-editorial-reviews"] });
    },
  });

  const handleEdit = (rev: NonNullable<typeof reviewsQuery.data>[number]) => {
    setFormData({
      movie_id: rev.movie_id,
      verdict: rev.verdict || "",
      story_score: rev.story_score || 9.0,
      acting_score: rev.acting_score || 9.0,
      visuals_score: rev.visuals_score || 9.0,
      entertainment_score: rev.entertainment_score || 9.0,
      editorial_score: rev.editorial_score || 9.0,
      who_should_watch: rev.who_should_watch || "",
      who_may_not_enjoy: rev.who_may_not_enjoy || "",
      why_watch: rev.why_watch || "",
      mood: rev.mood || "",
      recommended_viewing: rev.recommended_viewing || "",
      experience_level: rev.experience_level || "",
      content_notes: rev.content_notes || "",
      strengths: (rev.strengths || []).join("\n"),
      weaknesses: (rev.weaknesses || []).join("\n"),
      review_content: rev.review_content || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    upsertMut.mutate({
      ...formData,
      movie_id: Number(formData.movie_id),
      strengths: formData.strengths
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      weaknesses: formData.weaknesses
        .split("\n")
        .map((w) => w.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">مراجعات حكم فلمك (FILMAK Verdicts)</h2>
          <p className="text-xs text-muted-foreground">
            إضافة وتعديل التقييمات التحريرية ونقاط القوة والضعف للأفلام
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          {formOpen ? "إغلاق النموذج" : "إضافة مراجعة جديدة"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-bold text-base">نموذج مراجعة الفيلم</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-semibold">TMDB Movie ID *</span>
              <input
                type="number"
                required
                value={formData.movie_id}
                onChange={(e) => setFormData({ ...formData, movie_id: Number(e.target.value) })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">تقييم القصة (من 10)</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.story_score}
                onChange={(e) => setFormData({ ...formData, story_score: Number(e.target.value) })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">تقييم التمثيل (من 10)</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.acting_score}
                onChange={(e) => setFormData({ ...formData, acting_score: Number(e.target.value) })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">تقييم البصريات والإخراج</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.visuals_score}
                onChange={(e) =>
                  setFormData({ ...formData, visuals_score: Number(e.target.value) })
                }
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">تقييم المتعة العامة</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.entertainment_score}
                onChange={(e) =>
                  setFormData({ ...formData, entertainment_score: Number(e.target.value) })
                }
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">التقييم الإجمالي (Score)</span>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formData.editorial_score}
                onChange={(e) =>
                  setFormData({ ...formData, editorial_score: Number(e.target.value) })
                }
                className="w-full bg-secondary/60 border border-border rounded-lg p-2 font-bold text-primary"
              />
            </label>
          </div>

          <label className="space-y-1 block text-xs">
            <span className="font-semibold">حكم فلمك الموجز (Verdict) *</span>
            <textarea
              required
              rows={2}
              value={formData.verdict}
              onChange={(e) => setFormData({ ...formData, verdict: e.target.value })}
              placeholder="اكتب خلاصة الحكم النقدي على الفيلم..."
              className="w-full bg-secondary/60 border border-border rounded-lg p-2"
            />
          </label>

          <label className="space-y-1 block text-xs">
            <span className="font-semibold">لماذا تشاهد هذا العمل؟ (Why watch?)</span>
            <textarea
              rows={2}
              value={formData.why_watch}
              onChange={(e) => setFormData({ ...formData, why_watch: e.target.value })}
              className="w-full bg-secondary/60 border border-border rounded-lg p-2"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-semibold text-emerald-400">نقاط القوة (سطر لكل نقطة)</span>
              <textarea
                rows={3}
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-amber-400">نقاط الضعف (سطر لكل نقطة)</span>
              <textarea
                rows={3}
                value={formData.weaknesses}
                onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-semibold">من يناسبه هذا العمل</span>
              <input
                value={formData.who_should_watch}
                onChange={(e) => setFormData({ ...formData, who_should_watch: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">من قد لا يناسبه</span>
              <input
                value={formData.who_may_not_enjoy}
                onChange={(e) => setFormData({ ...formData, who_may_not_enjoy: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={upsertMut.isPending}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-semibold"
          >
            <Save className="w-4 h-4" />
            {upsertMut.isPending ? "جاري الحفظ..." : "حفظ المراجعة"}
          </button>
        </form>
      )}

      {/* Reviews list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">
          المراجعات المسجلة ({reviewsQuery.data?.length ?? 0})
        </div>
        {reviewsQuery.isLoading ? (
          <div className="p-12 text-center">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {(reviewsQuery.data ?? []).map((rev) => (
              <div key={rev.movie_id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/movie/$id"
                      params={{ id: String(rev.movie_id) }}
                      className="font-bold text-sm text-primary hover:underline"
                    >
                      Movie ID #{rev.movie_id}
                    </Link>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      ★ {rev.editorial_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 max-w-2xl">
                    {rev.verdict}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(rev)}
                    className="p-2 rounded-full hover:bg-secondary text-primary"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirm("حذف هذه المراجعة؟") && deleteMut.mutate(rev.movie_id)}
                    className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticlesCms() {
  const qc = useQueryClient();
  const listArticlesFn = useServerFn(adminListArticles);
  const upsertArticleFn = useServerFn(adminUpsertArticle);
  const deleteArticleFn = useServerFn(adminDeleteArticle);

  const articlesQuery = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => listArticlesFn(),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    slug: "",
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    category: "guides",
    category_label_ar: "أدلة المشاهدة",
    category_label_en: "Viewing Guides",
    excerpt_ar: "",
    excerpt_en: "",
    content_ar: "",
    content_en: "",
    featured_image: "",
    author_name: "هيئة تحرير فلمك",
    author_role: "فريق النقد والتحليل السينمائي",
    reading_time_minutes: 6,
    featured: false,
    published: true,
  });

  const upsertMut = useMutation({
    mutationFn: (data: typeof formData) => upsertArticleFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ المقال بنجاح");
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (err: Error) => toast.error(err.message || "حدث خطأ"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteArticleFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف المقال");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });

  const handleEdit = (art: NonNullable<typeof articlesQuery.data>[number]) => {
    setFormData({
      id: art.id,
      slug: art.slug,
      title_ar: art.title_ar,
      title_en: art.title_en,
      subtitle_ar: art.subtitle_ar || "",
      subtitle_en: art.subtitle_en || "",
      category: art.category,
      category_label_ar: art.category === "guides" ? "أدلة المشاهدة" : art.category,
      category_label_en: art.category === "guides" ? "Viewing Guides" : art.category,
      excerpt_ar: art.excerpt_ar,
      excerpt_en: art.excerpt_en,
      content_ar: art.content_ar,
      content_en: art.content_en,
      featured_image: art.featured_image || "",
      author_name: art.author_name,
      author_role: art.author_role,
      reading_time_minutes: art.reading_time_minutes,
      featured: art.featured,
      published: art.status === "published",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    upsertMut.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">المقالات والأدلة السينمائية (Articles CMS)</h2>
          <p className="text-xs text-muted-foreground">
            إنشاء وتعديل المقالات التحريرية والأدلة الشاملة لمجلة فلمك
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              id: undefined,
              slug: "",
              title_ar: "",
              title_en: "",
              subtitle_ar: "",
              subtitle_en: "",
              category: "guides",
              category_label_ar: "أدلة المشاهدة",
              category_label_en: "Viewing Guides",
              excerpt_ar: "",
              excerpt_en: "",
              content_ar: "",
              content_en: "",
              featured_image: "",
              author_name: "هيئة تحرير فلمك",
              author_role: "فريق النقد والتحليل السينمائي",
              reading_time_minutes: 6,
              featured: false,
              published: true,
            });
            setFormOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          {formOpen ? "إغلاق النموذج" : "كتابة مقال جديد"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <h3 className="font-bold text-base">
            {formData.id ? "تعديل المقال" : "إنشاء مقال جديد"}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-semibold">العنوان بالعربية *</span>
              <input
                required
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">Title (English) *</span>
              <input
                required
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-semibold">الرابط الفريد (Slug) *</span>
              <input
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. best-sci-fi-movies"
                className="w-full bg-secondary/60 border border-border rounded-lg p-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold">التصنيف (Category ID)</span>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2"
              >
                <option value="guides">أدلة المشاهدة (guides)</option>
                <option value="comparisons">مقارنات (comparisons)</option>
                <option value="spotlight">أضواء وجواهر (spotlight)</option>
                <option value="genre-deep-dive">سينما متخصصة (genre-deep-dive)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-semibold">رابط الصورة البارزة (Image URL)</span>
              <input
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="w-full bg-secondary/60 border border-border rounded-lg p-2 font-mono text-xs"
              />
            </label>
          </div>

          <label className="space-y-1 block text-xs">
            <span className="font-semibold">الموجز العربي (Excerpt AR) *</span>
            <textarea
              required
              rows={2}
              value={formData.excerpt_ar}
              onChange={(e) => setFormData({ ...formData, excerpt_ar: e.target.value })}
              className="w-full bg-secondary/60 border border-border rounded-lg p-2"
            />
          </label>

          <label className="space-y-1 block text-xs">
            <span className="font-semibold">نص المقال الكامل (Markdown) *</span>
            <textarea
              required
              rows={12}
              value={formData.content_ar}
              onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
              placeholder="اكتب نص المقال مستخدماً عناوين ## وقوائم *"
              className="w-full bg-secondary/60 border border-border rounded-lg p-3 font-mono text-xs leading-relaxed"
            />
          </label>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
              <span>مقال مميز في الواجهة (Featured)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <span>منشور ومتاح للعامة (Published)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={upsertMut.isPending}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-semibold"
          >
            <Save className="w-4 h-4" />
            {upsertMut.isPending ? "جاري الحفظ..." : "حفظ المقال"}
          </button>
        </form>
      )}

      {/* Articles list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">
          المقالات المسجلة ({articlesQuery.data?.length ?? 0})
        </div>
        {articlesQuery.isLoading ? (
          <div className="p-12 text-center">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {(articlesQuery.data ?? []).map((art) => (
              <div key={art.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/articles/$slug"
                      params={{ slug: art.slug }}
                      className="font-bold text-sm text-primary hover:underline"
                    >
                      {art.title_ar}
                    </Link>
                    {art.featured && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        مميز
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    /articles/{art.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(art)}
                    className="p-2 rounded-full hover:bg-secondary text-primary"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirm("حذف هذا المقال؟") && deleteMut.mutate(art.id)}
                    className="p-2 rounded-full hover:bg-destructive/10 text-destructive"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function RankList({
  rows,
  mono = false,
}: {
  rows: Array<{ label: string; value: number }>;
  mono?: boolean;
}) {
  const max = Math.max(1, ...rows.map((x) => x.value));
  return (
    <div className="space-y-3">
      {rows.length ? (
        rows.slice(0, 10).map((r, i) => (
          <div key={`${r.label}-${i}`}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className={`truncate ${mono ? "font-mono text-xs" : ""}`}>{r.label}</span>
              <b>{r.value}</b>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
      )}
    </div>
  );
}

function IpList({ rows }: { rows: SiteAnalytics["top_ips"] }) {
  return (
    <div className="space-y-2">
      {rows.length ? (
        rows.slice(0, 15).map((r, i) => (
          <div
            key={r.ip}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="font-mono text-sm">{r.ip}</div>
              <div className="text-[11px] text-muted-foreground">آخر ظهور: {fmt(r.last_seen)}</div>
            </div>
            <b>{r.visits}</b>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">لم تُسجل زيارات بعد.</p>
      )}
    </div>
  );
}

function DailyChart({ data }: { data: SiteAnalytics["daily"] }) {
  const max = Math.max(1, ...data.map((x) => x.visits));
  return (
    <div className="flex h-44 items-end gap-1 overflow-x-auto">
      {data.map((d) => (
        <div key={d.day} className="group flex h-full min-w-2 flex-1 flex-col justify-end">
          <div
            className="relative rounded-t bg-primary/70"
            style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }}
            title={`${d.day}: ${d.visits} visits / ${d.sessions} sessions`}
          />
          <div className="mt-1 hidden -rotate-45 origin-top text-[9px] text-muted-foreground group-hover:block">
            {d.day.slice(5)}
          </div>
        </div>
      ))}
    </div>
  );
}

function fmt(v: string) {
  return new Date(v).toLocaleString("ar-IQ", { dateStyle: "medium", timeStyle: "short" });
}

function UserDrawer({
  data,
  loading,
  error,
  onClose,
}: {
  data: Awaited<ReturnType<typeof getUserDetail>> | undefined;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="ms-auto h-full w-full max-w-2xl overflow-y-auto bg-background p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-semibold">تفاصيل الحساب</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading && <Spinner size={42} label="جاري التحميل" />}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {data && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border p-4">
              <div className="font-medium">{data.user.email}</div>
              <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {data.user.id}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  التسجيل
                  <br />
                  <b>{fmt(data.user.created_at)}</b>
                </div>
                <div>
                  آخر دخول
                  <br />
                  <b>{data.user.last_sign_in_at ? fmt(data.user.last_sign_in_at) : "—"}</b>
                </div>
                <div>
                  المفضلة
                  <br />
                  <b>{data.favorites.length}</b>
                </div>
                <div>
                  القوائم
                  <br />
                  <b>{data.lists.length}</b>
                </div>
              </div>
            </div>
            <Panel title={`المفضلة (${data.favorites.length})`}>
              <div className="space-y-2">
                {data.favorites.slice(0, 50).map((f) => (
                  <div key={f.id} className="flex gap-3 rounded-xl border border-border/50 p-2">
                    <img src={f.poster ?? ""} className="h-16 w-11 rounded object-cover" alt="" />
                    <div className="min-w-0">
                      <b className="block truncate">{f.title}</b>
                      <span className="text-xs text-muted-foreground">
                        {f.year ?? ""} · {f.rating ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title={`القوائم (${data.lists.length})`}>
              <div className="space-y-2">
                {data.lists.slice(0, 100).map((l) => (
                  <div key={l.id} className="rounded-xl border border-border/50 p-3">
                    <b>{l.title}</b>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {l.media_type} · {l.status} · {l.year ?? ""} · آخر تعديل {fmt(l.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </aside>
    </div>
  );
}
