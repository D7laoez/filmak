import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Filmak" },
      {
        name: "description",
        content: "سجّل دخولك أو أنشئ حساباً في فلمك.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const target = resetEmail.trim();
        if (!target.includes("@")) throw new Error("أدخل بريدك الإلكتروني");
        const { data: exists, error: existsErr } = await supabase.rpc(
          "email_exists",
          { _email: target },
        );
        if (existsErr) throw existsErr;
        if (!exists) throw new Error("إيميلك غير مسجل");
        const { error } = await supabase.auth.resetPasswordForEmail(target, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك");
      } else if (mode === "signup") {
        const uname = username.trim();
        if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(uname)) {
          throw new Error("اسم المستخدم: أحرف/أرقام/نقطة/شرطة سفلية فقط (2–40)");
        }
        const { data: existing, error: usernameError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", uname)
          .maybeSingle();
        if (usernameError) throw usernameError;
        if (existing) throw new Error("اسم المستخدم مستخدم بالفعل");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: uname },
          },
        });
        if (error) throw error;
        setMode("signin");
        setIdentifier(uname);
        setPassword("");
        setEmail("");
        setUsername("");
        setNotice("تم إنشاء الحساب. سجّل دخولك الآن.");
      } else {
        const id = identifier.trim();
        let loginEmail = id;
        if (!id.includes("@")) {
          const { data: resolved, error: rpcError } = await supabase.rpc(
            "get_email_by_username",
            { _username: id },
          );
          if (rpcError) throw rpcError;
          if (!resolved) throw new Error("اسم المستخدم غير موجود");
          loginEmail = resolved as string;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "بيانات الدخول غير صحيحة. تحقق من الإيميل/اسم المستخدم وكلمة المرور.",
            );
          }
          throw error;
        }
        navigate({ to: "/" });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-xl py-3 text-sm outline-none transition pr-11 pl-3 bg-[#161a2b] border border-[#232842] text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/30";

  return (
    <div
      dir="rtl"
      lang="ar"
      className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(139,92,246,0.18), transparent 55%), #0b0e1a",
        colorScheme: "dark",
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/icon-192.png"
            srcSet="/icon-192.png 1x, /icon-512.png 2x"
            alt="Filmak"
            className="w-16 h-16"
            decoding="async"
          />
          <span className="text-2xl font-bold text-white">فلمك</span>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl bg-[#0f1324]/90 backdrop-blur border border-white/10">
          <h1 className="text-2xl font-bold mb-1 text-white">
            {mode === "signin"
              ? "تسجيل الدخول"
              : mode === "signup"
                ? "حساب جديد"
                : "استعادة كلمة المرور"}
          </h1>
          <p className="text-sm text-white/60 mb-6">
            {mode === "forgot"
              ? "أدخل بريدك لإرسال رابط إعادة التعيين"
              : "احفظ أفلامك المفضلة وشاهدها لاحقاً"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  className={inputBase}
                />
              </div>
            )}
            {mode === "forgot" ? (
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="الإيميل"
                  className={inputBase}
                />
              </div>
            ) : mode === "signup" ? (
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="الإيميل"
                  className={inputBase}
                />
              </div>
            ) : (
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="الإيميل أو اسم المستخدم"
                  className={inputBase}
                />
              </div>
            )}
            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة السر (6 أحرف على الأقل)"
                  className={inputBase}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-l from-[#f97316] to-[#f59e0b] hover:opacity-95 disabled:opacity-60 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin"
                ? "دخول"
                : mode === "signup"
                  ? "إنشاء الحساب"
                  : "إرسال الرابط"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-center text-red-400">{error}</p>
          )}
          {notice && (
            <p className="mt-3 text-sm text-center text-emerald-400">{notice}</p>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="w-full text-sm text-white/60 mt-4 hover:text-white transition"
          >
            {mode === "signup"
              ? "لديك حساب؟ تسجيل الدخول"
              : mode === "forgot"
                ? "العودة لتسجيل الدخول"
                : "ما عندك حساب؟ إنشاء حساب جديد"}
          </button>

          {mode !== "forgot" && (
            <button
              onClick={() => {
                setMode("forgot");
                setError(null);
                setNotice(null);
              }}
              className="w-full text-sm text-white/50 mt-2 hover:text-white transition"
            >
              نسيت كلمة المرور؟
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
