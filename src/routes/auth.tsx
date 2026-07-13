import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Filmak" },
      {
        name: "description",
        content: "سجّل دخولك أو أنشئ حساباً في فلمك لحفظ المفضلة ومتابعة توصيات الذكاء الاصطناعي.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "تسجيل الدخول — Filmak" },
      {
        property: "og:description",
        content: "سجّل دخولك أو أنشئ حساباً في فلمك.",
      },
      { property: "og:url", content: "https://filmak.site/auth" },
    ],
    links: [{ rel: "canonical", href: "https://filmak.site/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { dir, t } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState(""); // signup only
  const [resetEmail, setResetEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const target = resetEmail.trim();
        if (!target.includes("@")) {
          throw new Error(
            dir === "rtl" ? "أدخل بريدك الإلكتروني" : "Enter your email",
          );
        }
        const { error } = await supabase.auth.resetPasswordForEmail(target, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice(
          dir === "rtl"
            ? "أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك"
            : "We sent a password reset link to your email",
        );
      } else if (mode === "signup") {
        // Enforce unique username server-side before creating the auth user
        const uname = username.trim();
        if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(uname)) {
          throw new Error(
            dir === "rtl"
              ? "اسم المستخدم: أحرف/أرقام/نقطة/شرطة سفلية فقط (2–40)"
              : "Username: letters, digits, . _ - only (2–40 chars)",
          );
        }
        const { data: existing, error: usernameError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", uname)
          .maybeSingle();
        if (usernameError) throw usernameError;
        const available = !existing;
        if (!available) {
          throw new Error(
            dir === "rtl" ? "اسم المستخدم مستخدم بالفعل" : "Username already taken",
          );
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: uname },
          },
        });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const id = identifier.trim();
        let loginEmail = id;
        if (!id.includes("@")) {
          const { data: resolved, error: rpcError } = await supabase.rpc(
            "get_email_by_username",
            { _username: id },
          );
          if (rpcError) throw rpcError;
          if (!resolved) {
            throw new Error(
              dir === "rtl" ? "اسم المستخدم غير موجود" : "Username not found",
            );
          }
          loginEmail = resolved as string;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) throw error;
        navigate({ to: "/" });
    }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir={dir}
      className="min-h-screen flex items-center justify-center bg-background text-foreground px-4"
    >
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center justify-center gap-3 mb-8">
          <img src="/icon-192.png" srcSet="/icon-192.png 1x, /icon-512.png 2x" decoding="async" alt={t("brand")} className="w-14 h-14 md:w-16 md:h-16" />
          <span className="text-2xl font-bold">{t("brand")}</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "signin"
              ? t("signin")
              : mode === "signup"
                ? t("signup")
                : dir === "rtl"
                  ? "استعادة كلمة المرور"
                  : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "forgot"
              ? dir === "rtl"
                ? "أدخل بريدك لإرسال رابط إعادة التعيين"
                : "Enter your email to receive a reset link"
              : t("auth_sub")}
          </p>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={dir === "rtl" ? "اسم المستخدم" : "Username"}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            )}
            {mode === "forgot" ? (
              <div className="relative">
                <Mail className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t("email")}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            ) : mode === "signup" ? (
              <div className="relative">
                <Mail className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email")}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            ) : (
              <div className="relative">
                <User className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={dir === "rtl" ? "الإيميل أو اسم المستخدم" : "Email or username"}
                  className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            )}
            {mode !== "forgot" && (
            <div className="relative">
              <Lock className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className={`w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${dir === "rtl" ? "pr-10 pl-3" : "pl-10 pr-3"}`}
              />
            </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin"
                ? t("signin_btn")
                : mode === "signup"
                  ? t("signup_btn")
                  : dir === "rtl"
                    ? "إرسال الرابط"
                    : "Send reset link"}
            </button>
          </form>

          {error && <p className="mt-3 text-destructive text-sm text-center">{error}</p>}
          {notice && <p className="mt-3 text-primary text-sm text-center">{notice}</p>}

          {mode === "signin" && (
            <button
              onClick={() => {
                setMode("forgot");
                setError(null);
                setNotice(null);
              }}
              className="w-full text-sm text-muted-foreground mt-4 hover:text-foreground transition"
            >
              {dir === "rtl" ? "نسيت كلمة المرور؟" : "Forgot your password?"}
            </button>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="w-full text-sm text-muted-foreground mt-3 hover:text-foreground transition"
          >
            {mode === "signup"
              ? t("have_account")
              : mode === "forgot"
                ? dir === "rtl"
                  ? "العودة لتسجيل الدخول"
                  : "Back to sign in"
                : t("no_account")}
          </button>
        </div>
      </div>
    </div>
  );
}