import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, User as UserIcon, Mail, Lock, LogOut, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "إعدادات الحساب — Filmak" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { dir } = useLocale();
  const rtl = dir === "rtl";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileCurrentPw, setProfileCurrentPw] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const u = userRes.user;
      if (!u) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(u.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", u.id)
        .maybeSingle();
      if (profile) {
        setUsername(profile.username ?? "");
        setDisplayName(profile.display_name ?? "");
      }
      setLoading(false);
    })();
  }, [navigate]);

  // Verify the current password by attempting a sign-in with the stored email.
  async function verifyCurrentPassword(pw: string): Promise<void> {
    if (!pw) {
      throw new Error(rtl ? "أدخل كلمة المرور الحالية" : "Enter your current password");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) {
      throw new Error(rtl ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect");
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const uname = username.trim();
    if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(uname)) {
      setProfileMsg({
        ok: false,
        text: rtl
          ? "اسم المستخدم: أحرف/أرقام/نقطة/شرطة سفلية فقط (2–40)"
          : "Username: letters, digits, . _ - only (2–40 chars)",
      });
      return;
    }
    setProfileSaving(true);
    try {
      await verifyCurrentPassword(profileCurrentPw);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("no user");

      // Check uniqueness (excluding current user)
      const { data: taken, error: takenErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", uname)
        .neq("id", uid)
        .maybeSingle();
      if (takenErr) throw takenErr;
      if (taken) {
        throw new Error(rtl ? "اسم المستخدم مستخدم بالفعل" : "Username already taken");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username: uname, display_name: displayName.trim() || null })
        .eq("id", uid);
      if (error) throw error;
      setProfileMsg({ ok: true, text: rtl ? "تم حفظ التغييرات" : "Changes saved" });
      setProfileCurrentPw("");
    } catch (err) {
      setProfileMsg({ ok: false, text: (err as Error).message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    const target = newEmail.trim();
    if (!target.includes("@")) {
      setEmailMsg({ ok: false, text: rtl ? "أدخل بريداً صالحاً" : "Enter a valid email" });
      return;
    }
    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: target });
      if (error) throw error;
      setEmailMsg({
        ok: true,
        text: rtl
          ? "أرسلنا رسالة تأكيد إلى البريد الجديد. افتحها لإتمام التغيير."
          : "We sent a confirmation link to the new email. Open it to finish the change.",
      });
      setNewEmail("");
    } catch (err) {
      setEmailMsg({ ok: false, text: (err as Error).message });
    } finally {
      setEmailSaving(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 6) {
      setPwMsg({
        ok: false,
        text: rtl ? "كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({
        ok: false,
        text: rtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
      });
      return;
    }
    if (newPassword === currentPassword) {
      setPwMsg({
        ok: false,
        text: rtl
          ? "كلمة المرور الجديدة يجب أن تختلف عن الحالية"
          : "New password must differ from the current one",
      });
      return;
    }
    setPwSaving(true);
    try {
      await verifyCurrentPassword(currentPassword);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg({ ok: true, text: rtl ? "تم تحديث كلمة المرور" : "Password updated" });
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (err) {
      setPwMsg({ ok: false, text: (err as Error).message });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const inputClass = `w-full bg-secondary/60 border border-border rounded-xl py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 ${rtl ? "pr-10 pl-3" : "pl-10 pr-3"}`;
  const iconClass = `absolute ${rtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`;

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className={`w-4 h-4 ${rtl ? "rotate-180" : ""}`} />
          {rtl ? "الرئيسية" : "Home"}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          {rtl ? "إعدادات الحساب" : "Account settings"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {rtl ? "أدر معلومات حسابك وكلمة المرور" : "Manage your account details and password"}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">
                {rtl ? "الملف الشخصي" : "Profile"}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {rtl ? "اسم المستخدم والاسم المعروض" : "Username and display name"}
              </p>
              <form onSubmit={saveProfile} className="space-y-3">
                <div className="relative">
                  <UserIcon className={iconClass} />
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={rtl ? "اسم المستخدم" : "Username"}
                    className={inputClass}
                  />
                </div>
                <div className="relative">
                  <UserIcon className={iconClass} />
                  <input
                    type="text"
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={rtl ? "الاسم المعروض (اختياري)" : "Display name (optional)"}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {rtl ? "حفظ" : "Save"}
                </button>
                {profileMsg && (
                  <p className={`text-sm ${profileMsg.ok ? "text-primary" : "text-destructive"}`}>
                    {profileMsg.text}
                  </p>
                )}
              </form>
            </section>

            {/* Email */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">
                {rtl ? "البريد الإلكتروني" : "Email"}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {rtl ? "بريدك الحالي: " : "Current email: "}
                <span className="text-foreground">{email}</span>
              </p>
              <form onSubmit={saveEmail} className="space-y-3">
                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={rtl ? "البريد الإلكتروني الجديد" : "New email"}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {emailSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {rtl ? "تحديث البريد" : "Update email"}
                </button>
                {emailMsg && (
                  <p className={`text-sm ${emailMsg.ok ? "text-primary" : "text-destructive"}`}>
                    {emailMsg.text}
                  </p>
                )}
              </form>
            </section>

            {/* Password */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-1">
                {rtl ? "كلمة المرور" : "Password"}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {rtl ? "اختر كلمة مرور جديدة" : "Choose a new password"}
              </p>
              <form onSubmit={savePassword} className="space-y-3">
                <div className="relative">
                  <Lock className={iconClass} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={rtl ? "كلمة المرور الجديدة" : "New password"}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <div className="relative">
                  <Lock className={iconClass} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={rtl ? "تأكيد كلمة المرور" : "Confirm password"}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {rtl ? "تحديث كلمة المرور" : "Update password"}
                </button>
                {pwMsg && (
                  <p className={`text-sm ${pwMsg.ok ? "text-primary" : "text-destructive"}`}>
                    {pwMsg.text}
                  </p>
                )}
              </form>
            </section>

            {/* Sign out */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition"
              >
                <LogOut className="w-4 h-4" />
                {rtl ? "تسجيل الخروج" : "Sign out"}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}