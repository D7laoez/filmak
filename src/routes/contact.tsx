import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail, ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — فلمك | Contact Filmak" },
      {
        name: "description",
        content:
          "تواصل مع فريق منصة فلمك للاستفسارات التحريرية، الاقتراحات، الشراكات، أو الإبلاغ عن مشكلة في المحتوى.",
      },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { dir, locale } = useLocale();
  const ar = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const company = String(formData.get("company") || "");
    if (!name.trim() || !email.trim() || message.trim().length < 20) {
      toast.error(
        ar
          ? "يرجى إدخال الاسم والبريد ورسالة لا تقل عن 20 حرفاً."
          : "Enter your name, email, and a message of at least 20 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            subject,
            message: message.trim(),
            company,
          }),
        },
      );

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !result.success) {
        if (response.status === 429) {
          throw new Error(
            ar
              ? "أرسلت رسائل كثيرة خلال وقت قصير. حاول بعد 15 دقيقة."
              : "Too many messages. Please try again in 15 minutes.",
          );
        }
        throw new Error(
          ar
            ? "تعذر إرسال الرسالة حالياً. حاول مرة أخرى."
            : "We could not submit your message. Please try again.",
        );
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("general");
      setMessage("");
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : ar
            ? "حدث خطأ غير متوقع."
            : "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir={dir} className="min-h-screen bg-background text-foreground pb-24">
      <header className="relative border-b border-border/40 bg-card/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary.DEFAULT/0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 relative">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs hover:bg-secondary transition mb-6"
          >
            <Arrow className="w-3.5 h-3.5" />
            {ar ? "الرئيسية" : "Home"}
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold mb-4">
            <Mail className="w-3.5 h-3.5" />
            {ar ? "خدمة المجتمع والتواصل" : "Get In Touch"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {ar ? "تواصل مع فريق فلمك" : "Contact Us"}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            {ar
              ? "نرحب بجميع الملاحظات، الاقتراحات التحريرية، والاستفسارات العامة."
              : "We welcome feedback, editorial inquiries, partnerships, and technical support requests."}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">{ar ? "البريد الإلكتروني" : "Email Inquiries"}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar ? "للاستفسارات العامة والشراكات:" : "For general questions & partnerships:"}
            </p>
            <a
              href="mailto:contact@filmak.site"
              className="text-sm font-semibold text-primary hover:underline block font-mono"
            >
              contact@filmak.site
            </a>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">
              {ar ? "حقوق الملكية والنشر" : "DMCA & Copyright"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar
                ? "للإبلاغ عن أي استفسار متعلق بحقوق الملكية الفكرية، تفضل بزيارة صفحة DMCA."
                : "For copyright notices and DMCA compliance, visit our DMCA policy."}
            </p>
            <Link to="/dmca" className="text-xs text-primary hover:underline block font-medium">
              {ar ? "عرض سياسة DMCA ←" : "View DMCA Policy →"}
            </Link>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">
            {submitted ? (
              <div className="text-center py-10 space-y-3" role="status" aria-live="polite">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold">
                  {ar ? "تم استلام رسالتك بنجاح" : "Your Message Was Received"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? "وصلت رسالتك إلى صندوق تواصل فريق فلمك. سنراجعها في أقرب وقت."
                    : "Your message is safely stored in Filmak's contact inbox. Our team will review it."}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs text-primary underline"
                >
                  {ar ? "إرسال رسالة أخرى" : "Send another message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold">{ar ? "أرسل رسالة مباشرة" : "Send a Message"}</h2>

                <div
                  className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                  aria-hidden="true"
                >
                  <label htmlFor="contact-company">Company</label>
                  <input
                    id="contact-company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contact-name"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {ar ? "الاسم الكامل" : "Your Name"}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ar ? "مثال: أحمد علي" : "e.g. John Doe"}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contact-email"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {ar ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contact-subject"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {ar ? "موضوع الرسالة" : "Subject"}
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="general">{ar ? "استفسار عام" : "General Inquiry"}</option>
                    <option value="editorial">
                      {ar ? "اقتراح أو تصحيح تحريري" : "Editorial Suggestion / Correction"}
                    </option>
                    <option value="technical">
                      {ar ? "مشكلة تقنية في الموقع" : "Technical Issue"}
                    </option>
                    <option value="dmca">
                      {ar ? "حقوق ملكية ونشر (DMCA)" : "Copyright / DMCA Notice"}
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contact-message"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {ar ? "نص الرسالة" : "Message"}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={20}
                    maxLength={5000}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      ar
                        ? "اكتب رسالتك أو اقتراحك هنا..."
                        : "Type your message or inquiry here..."
                    }
                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground text-end">
                    {message.length}/5000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting
                    ? ar
                      ? "جارٍ إرسال الرسالة..."
                      : "Sending..."
                    : ar
                      ? "إرسال الرسالة"
                      : "Send Message"}
                </button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {ar
                    ? "تُحفظ الرسائل بشكل آمن ولا تظهر للزوار الآخرين."
                    : "Messages are stored securely and are not visible to other visitors."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
