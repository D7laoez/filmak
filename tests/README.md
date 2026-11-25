# Integration Tests — Admin Route Protection

هذه الاختبارات تتحقق أن مسارات الإدارة (`/admin`, `/seo-status`) محمية عبر
layout الموحّد `_authenticated/_admin`، وأن المستخدم غير الـ admin يرى 404
(نفس صفحة NotFound العامة) بينما الـ admin يفتح الصفحة بنجاح.

## المتطلبات

- خادم التطوير يعمل على `http://localhost:8080` (يعمل تلقائياً في sandbox
  الـ Lovable).
- Playwright مثبّت مسبقاً في بيئة الـ sandbox.
- متغيرات بيئة اختيارية لتشغيل حالات المستخدم المصادَق:
  - `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` — حساب admin (مثال:
    `ali.m2002121@gmail.com`).
  - `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — حساب عادي بدون دور admin.

الاختبارات التي لا تجد بيانات دخولها يتم تخطّيها تلقائياً بدل الفشل.

## التشغيل

```bash
TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... \
TEST_USER_EMAIL=...  TEST_USER_PASSWORD=...  \
  python3 tests/admin_access.spec.py
```

المخرجات: سطر لكل اختبار بصيغة `PASS` / `FAIL` / `SKIP`، ورمز خروج غير
صفري لو فشلت أي حالة.
