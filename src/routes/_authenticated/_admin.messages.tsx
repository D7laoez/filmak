import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Inbox, RefreshCw, Mail, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

type ContactStatus = "new" | "read" | "resolved" | "spam";
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: "general" | "editorial" | "technical" | "dmca";
  message: string;
  status: ContactStatus;
  created_at: string;
};
type ContactQueryResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;
type ContactTable = {
  select: (columns: string) => {
    order: (column: string, options: { ascending: boolean }) => ContactQueryResult<ContactMessage[]>;
  };
  update: (values: { status: ContactStatus }) => {
    eq: (column: "id", value: string) => Promise<{ error: { message: string } | null }>;
  };
};
const contactDb = supabase as unknown as { from: (table: "contact_messages") => ContactTable };

const labels: Record<ContactMessage["subject"], string> = {
  general: "استفسار عام",
  editorial: "اقتراح أو تصحيح تحريري",
  technical: "مشكلة تقنية",
  dmca: "حقوق ملكية ونشر",
};

export const Route = createFileRoute("/_authenticated/_admin/messages")({
  head: () => ({
    meta: [
      { title: "رسائل التواصل — فلمك" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContactInboxPage,
});

function ContactInboxPage() {
  const { dir } = useLocale();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | ContactStatus>("all");
  const messages = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await contactDb
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    retry: false,
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await contactDb.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast.success("تم تحديث حالة الرسالة");
    },
    onError: () => toast.error("تعذر تحديث الرسالة"),
  });
  const visible = useMemo(
    () => (messages.data ?? []).filter((message) => filter === "all" || message.status === filter),
    [messages.data, filter],
  );

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              لوحة الإدارة
            </Link>
            <Logo size={32} />
            <h1 className="font-bold">صندوق رسائل التواصل</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => messages.refetch()}
              disabled={messages.isFetching}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${messages.isFetching ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              الرسائل محفوظة في قاعدة البيانات ولا يمكن للزوار الوصول إليها.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.data?.length ?? 0} رسالة محفوظة
            </p>
          </div>
          <select
            aria-label="تصفية الرسائل"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | ContactStatus)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">كل الرسائل</option>
            <option value="new">جديدة</option>
            <option value="read">تمت قراءتها</option>
            <option value="resolved">تم حلها</option>
            <option value="spam">مزعجة</option>
          </select>
        </div>

        {messages.isPending ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            جارٍ تحميل الرسائل...
          </div>
        ) : messages.isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            تعذر تحميل الرسائل. تحقق من صلاحيات حساب المدير ثم أعد المحاولة.
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">لا توجد رسائل هنا</h2>
            <p className="mt-1 text-sm text-muted-foreground">ستظهر الرسائل الجديدة في هذه الصفحة.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((message) => (
              <article key={message.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{message.name}</h2>
                    <a
                      href={`mailto:${message.email}`}
                      className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {message.email}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {labels[message.subject]} · {new Date(message.created_at).toLocaleString("ar-IQ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {message.status === "new" ? "جديدة" : message.status === "read" ? "مقروءة" : message.status === "resolved" ? "محلولة" : "مزعجة"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.message}</p>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <select
                    aria-label={`حالة رسالة ${message.name}`}
                    value={message.status}
                    disabled={updateStatus.isPending}
                    onChange={(event) =>
                      updateStatus.mutate({ id: message.id, status: event.target.value as ContactStatus })
                    }
                    className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs"
                  >
                    <option value="new">جديدة</option>
                    <option value="read">تمت قراءتها</option>
                    <option value="resolved">تم حلها</option>
                    <option value="spam">مزعجة</option>
                  </select>
                  {message.status === "new" && (
                    <button
                      type="button"
                      onClick={() => updateStatus.mutate({ id: message.id, status: "read" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      تحديد كمقروءة
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
