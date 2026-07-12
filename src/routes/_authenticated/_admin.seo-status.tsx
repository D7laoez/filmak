import { createFileRoute, Link, notFound, rootRouteId } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, RefreshCw, Search, ExternalLink, CheckCircle2, AlertCircle, HelpCircle, Send, Clock } from "lucide-react";
import {
  getSeoStatus,
  inspectSeoUrl,
  resubmitSitemap,
  getSubmissionHistory,
  type InspectionResult,
  type SubmissionRow,
} from "@/lib/seo-status.functions";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/_authenticated/_admin/seo-status")({
  loader: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw notFound({ routeId: rootRouteId });
    return null;
  },
  errorComponent: () => null,
  component: SeoStatusPage,
});

function SeoStatusPage() {
  const { dir } = useLocale();
  const getStatus = useServerFn(getSeoStatus);
  const inspect = useServerFn(inspectSeoUrl);
  const resubmit = useServerFn(resubmitSitemap);
  const getHistory = useServerFn(getSubmissionHistory);
  const qc = useQueryClient();

  const status = useQuery({
    queryKey: ["seo-sitemap-status"],
    queryFn: () => getStatus(),
    retry: false,
    staleTime: 60_000,
  });

  const history = useQuery({
    queryKey: ["seo-submission-history"],
    queryFn: () => getHistory(),
    retry: false,
    staleTime: 30_000,
  });

  const [path, setPath] = useState("/");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const inspectMut = useMutation({
    mutationFn: (p: string) => inspect({ data: { path: p } }),
    onSuccess: (data) => setResult(data),
  });

  const resubmitMut = useMutation({
    mutationFn: () => resubmit(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-sitemap-status"] });
      qc.invalidateQueries({ queryKey: ["seo-submission-history"] });
    },
  });

  const forbidden =
    status.error instanceof Error &&
    /Forbidden|admin role/i.test(status.error.message);

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
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold">حالة الفهرسة — Google</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                status.refetch();
                history.refetch();
              }}
              disabled={status.isFetching}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${status.isFetching ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <button
              onClick={() => resubmitMut.mutate()}
              disabled={resubmitMut.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${resubmitMut.isPending ? "animate-pulse" : ""}`} />
              إعادة إرسال Sitemap
            </button>
          </div>
        </div>

        {resubmitMut.data && (
          <div
            className={`border rounded-2xl p-4 text-sm ${
              resubmitMut.data.status === "success"
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/40 bg-destructive/5 text-destructive"
            }`}
          >
            {resubmitMut.data.status === "success"
              ? `تم إرسال الـ sitemap بنجاح (HTTP ${resubmitMut.data.http_status})`
              : `فشل الإرسال: ${resubmitMut.data.message ?? "خطأ غير معروف"}`}
          </div>
        )}

        {resubmitMut.error instanceof Error && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-2xl p-4 text-sm text-destructive">
            {resubmitMut.error.message}
          </div>
        )}

        {forbidden && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-2xl p-6 text-sm">
            <p className="font-semibold mb-1">هذه الصفحة للمشرفين فقط</p>
            <p className="text-muted-foreground">
              حسابك لا يملك صلاحية <code>admin</code>. تحتاج تعطي حسابك الدور <code>admin</code>
              في جدول <code>user_roles</code> من إعدادات الـ Backend.
            </p>
          </div>
        )}

        {!forbidden && status.error instanceof Error && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-2xl p-6 text-sm text-destructive">
            {status.error.message}
          </div>
        )}

        {status.isLoading && (
          <div className="py-12 flex items-center justify-center">
            <Spinner size={64} label="جاري التحميل" />
          </div>
        )}

        {status.data && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="روابط مُرسَلة" value={status.data.submitted} accent="text-primary" />
            <StatCard label="مُفهرَسة" value={status.data.indexed} accent="text-emerald-500" />
            <StatCard label="أخطاء" value={status.data.errors} accent={status.data.errors > 0 ? "text-destructive" : "text-emerald-500"} />
            <StatCard label="تحذيرات" value={status.data.warnings} accent={status.data.warnings > 0 ? "text-amber-500" : "text-emerald-500"} />
            <div className="col-span-full text-xs text-muted-foreground border border-border/60 rounded-xl px-4 py-3 space-y-1">
              <div>آخر إرسال: {status.data.lastSubmitted ? new Date(status.data.lastSubmitted).toLocaleString() : "—"}</div>
              <div>آخر تحميل من Google: {status.data.lastDownloaded ? new Date(status.data.lastDownloaded).toLocaleString() : "—"}</div>
            </div>
          </section>
        )}

        <section className="border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">فحص رابط معين</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!path.trim() || inspectMut.isPending) return;
              inspectMut.mutate(path.trim());
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 flex items-center bg-secondary/40 border border-border rounded-full px-3">
              <span className="text-muted-foreground text-sm select-none">/</span>
              <input
                value={path.replace(/^\//, "")}
                onChange={(e) => setPath("/" + e.target.value)}
                placeholder="discover"
                className="flex-1 bg-transparent outline-none py-2 px-1 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={inspectMut.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              فحص
            </button>
          </form>

          {inspectMut.isPending && (
            <div className="py-8 flex items-center justify-center">
              <Spinner size={48} label="جاري الفحص" />
            </div>
          )}

          {inspectMut.error instanceof Error && (
            <div className="border border-destructive/40 bg-destructive/5 rounded-xl p-4 text-sm text-destructive">
              {inspectMut.error.message}
            </div>
          )}

          {result && !inspectMut.isPending && <InspectionCard data={result} />}
        </section>

        <section className="border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">سجل إعادة إرسال Sitemap</h2>
          </div>
          {history.isLoading && (
            <div className="py-6 flex items-center justify-center">
              <Spinner size={40} label="جاري التحميل" />
            </div>
          )}
          {history.data && history.data.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد عمليات مسجّلة بعد. اضغط "إعادة إرسال Sitemap" لبدء أول عملية.</p>
          )}
          {history.data && history.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-start py-2 px-2">الوقت</th>
                    <th className="text-start py-2 px-2">الحالة</th>
                    <th className="text-start py-2 px-2">HTTP</th>
                    <th className="text-start py-2 px-2">مُرسَلة</th>
                    <th className="text-start py-2 px-2">مفهرَسة</th>
                    <th className="text-start py-2 px-2">أخطاء</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((row) => (
                    <HistoryRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function HistoryRow({ row }: { row: SubmissionRow }) {
  const success = row.status === "success";
  return (
    <tr className="border-b border-border/40">
      <td className="py-2 px-2 whitespace-nowrap text-xs">
        {new Date(row.created_at).toLocaleString()}
      </td>
      <td className="py-2 px-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            success
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {success ? "نجاح" : "فشل"}
        </span>
      </td>
      <td className="py-2 px-2 text-xs">{row.http_status ?? "—"}</td>
      <td className="py-2 px-2 text-xs">{row.submitted_urls ?? "—"}</td>
      <td className="py-2 px-2 text-xs">{row.indexed_urls ?? "—"}</td>
      <td className="py-2 px-2 text-xs">{row.errors ?? "—"}</td>
    </tr>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="border border-border/60 rounded-2xl p-4 bg-secondary/20">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function verdictIcon(verdict: string) {
  if (verdict === "PASS") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (verdict === "FAIL") return <AlertCircle className="w-4 h-4 text-destructive" />;
  return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
}

function coverageLabel(state: string) {
  const map: Record<string, string> = {
    "Submitted and indexed": "مُرسَلة ومفهرَسة",
    "URL is unknown to Google": "غير معروفة لدى Google",
    "Crawled - currently not indexed": "تم الزحف — غير مفهرَسة حالياً",
    "Discovered - currently not indexed": "مكتشفة — غير مفهرَسة حالياً",
    "Page with redirect": "صفحة تحويل",
    "Alternate page with proper canonical tag": "صفحة بديلة",
  };
  return map[state] ?? state;
}

function InspectionCard({ data }: { data: InspectionResult }) {
  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/10">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-muted-foreground break-all">{data.inspectedUrl}</div>
        {data.inspectionResultLink && (
          <a
            href={data.inspectionResultLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            فتح في Search Console
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        {verdictIcon(data.verdict)}
        <span className="font-semibold">{coverageLabel(data.coverageState)}</span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Row label="حالة الفهرسة" value={data.indexingState} />
        <Row label="حالة الجلب" value={data.pageFetchState} />
        <Row label="robots.txt" value={data.robotsTxtState} />
        <Row label="آخر زحف" value={data.lastCrawlTime ? new Date(data.lastCrawlTime).toLocaleString() : "—"} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}