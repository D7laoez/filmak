## Plan

### 1. Disable email confirmation for new signups
- Call `supabase--configure_auth` with `auto_confirm_email: true` so new accounts are active immediately without clicking a confirmation link.

### 2. Signup flow → redirect to sign-in
- In `src/routes/auth.tsx`, after a successful `signUp` call, do NOT auto sign the user in. Instead:
  - Show a brief success notice ("تم إنشاء الحساب، سجّل دخولك").
  - Switch the form to `signin` mode and prefill the email/username field.
  - Clear password field so the user explicitly types password to sign in.

### 3. New "Account settings" page (user control panel)
- Create `src/routes/_authenticated/account.tsx` (protected route).
- Clean, matching design (card layout, same rounded-2xl / bg-card style as auth/reset-password pages, RTL/LTR aware via `useLocale`).
- Sections:
  1. **Profile info** — edit `username` and `display_name` from `profiles` table. Username uniqueness check (case-insensitive) before update.
  2. **Email** — change email via `supabase.auth.updateUser({ email })`. Show current email.
  3. **Password** — change password via `supabase.auth.updateUser({ password })`. No old password required (new + confirm only, min 6 chars, match check).
  4. **Sign out** button.
- Each section is an independent form with its own submit button, loading state, success/error inline messages.
- Add a link/entry point to `/account` from the top bar user menu (or wherever the auth avatar/menu lives) — locate current entry point in `TopBar.tsx` and add the item.

### 4. Password reset email — single-use, new link each request
- Supabase recovery links are already single-use by design (once consumed via `exchangeCodeForSession` or `setSession`, the token is invalidated server-side).
- The current `reset-password.tsx` already handles both PKCE (`?code=`) and hash tokens.
- Ensure that after a successful password update, we call `supabase.auth.signOut()` and the URL params/hash are cleared (they already are), so re-opening the same link fails cleanly and the "Send new link" resend form appears.
- Verify `resetPasswordForEmail` uses `redirectTo: ${origin}/reset-password` (already the case) — each call generates a new token; the previous link becomes invalid once a new one is issued or once used. No code change needed beyond confirming behavior; if a user opens an old/used link, the page shows the resend form (existing behavior).
- Add an explicit call to invalidate the URL and sign out on success in reset-password to make it obvious the link is one-shot.

### 5. End-to-end verification
- Run `tsgo --noEmit` after edits.
- Playwright: sign up a new account (verify no confirmation email needed, redirected to sign-in), sign in, open `/account`, change display name / password / email, verify each works, then test `/reset-password` flow (request link twice → confirm only the newest works; using a link twice fails and shows resend form).

### Files touched
- edit `src/routes/auth.tsx` (post-signup redirect to sign-in mode)
- create `src/routes/_authenticated/account.tsx`
- edit `src/components/TopBar.tsx` (add link to `/account`)
- edit `src/routes/reset-password.tsx` (sign out + clean URL after success to enforce one-shot UX)
- `supabase--configure_auth` call (auto_confirm_email true, keep signups enabled, HIBP as-is, no anonymous)

No DB migration needed; `profiles` table and update triggers already exist.
