import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail, MessageSquare, ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — فلمك | Contact Filmak" },
      {
        name: "description",
        content: "تواصل مع فريق منصة فلمك للاستفسارات التحريرية، الاقتراحات، الشراكات، أو الإبلاغ عن مشكلة في المحتوى.",
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error(ar ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }
    const subjectLabels: Record<string, string> = {
      general: ar ? "استفسار عام" : "General Inquiry",
      editorial: ar ? "اقتراح أو تصحيح تحريري" : "Editorial Suggestion / Correction",
      technical: ar ? "مشكلة تقنية في الموقع" : "Technical Issue",
      dmca: ar ? "حقوق ملكية ونشر (DMCA)" : "Copyright / DMCA Notice",
    };
    const mailSubject = encodeURIComponent(`[Filmak] ${subjectLabels[subject] || subject}`);
    const mailBody = encodeURIComponent(
      `${ar ? "الاسم" : "Name"}: ${name}\n${ar ? "البريد" : "Email"}: ${email}\n\n${message}`,
    );
    // This form opens the visitor's email app; it does not submit to a server.
    window.location.href = `mailto:contact@filmak.site?subject=${mailSubject}&body=${mailBody}`;
    setSubmitted(true);
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
        {/* Contact Info Cards */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">{ar ? "البريد الإلكتروني" : "Email Inquiries"}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar ? "للاستفسارات العامة والشراكات:" : "For general questions & partnerships:"}
            </p>
            <a href="mailto:contact@filmak.site" className="text-sm font-semibold text-primary hover:underline block font-mono">
              contact@filmak.site
            </a>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">{ar ? "حقوق الملكية والنشر" : "DMCA & Copyright"}</h2>
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

        {/* Contact Form */}
        <div className="md:col-span-7">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold">{ar ? "شكراً لتواصلك معنا!" : "Thank You for Reaching Out!"}</h3>
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? "فتحنا تطبيق البريد لإرسال رسالتك. اضغط «إرسال» داخل تطبيق البريد لإتمام الإرسال."
                    : "Your email app should open with this message prepared. Press Send in your email app to complete delivery."}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs text-primary underline"
                >
                  {ar ? "إرسال رسالة أخرى" : "Send another message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold">{ar ? "أرسل رسالة مباشرة" : "Send a Message"}</h2>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{ar ? "الاسم الكامل" : "Your Name"}</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ar ? "مثال: أحمد علي" : "e.g. John Doe"}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{ar ? "البريد الإلكتروني" : "Email Address"}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{ar ? "موضوع الرسالة" : "Subject"}</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="general">{ar ? "استفسار عام" : "General Inquiry"}</option>
                    <option value="editorial">{ar ? "اقتراح أو تصحيح تحريري" : "Editorial Suggestion / Correction"}</option>
                    <option value="technical">{ar ? "مشكلة تقنية في الموقع" : "Technical Issue"}</option>
                    <option value="dmca">{ar ? "حقوق ملكية ونشر (DMCA)" : "Copyright / DMCA Notice"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{ar ? "نص الرسالة" : "Message"}</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={ar ? "اكتب رسالتك أو اقتراحك هنا..." : "Type your message or inquiry here..."}
                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  {ar ? "إرسال الرسالة" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
