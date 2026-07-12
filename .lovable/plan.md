## الهدف
إثبات ملكية الموقع في Bing Webmaster Tools باستخدام ملف التحقق XML الذي رفعته.

## الخطوات
1. حفظ الملف باسم `BingSiteAuth.xml` داخل مجلد `public/` بحيث يصير متاح على:
   ```
   https://filmak.lovable.app/BingSiteAuth.xml
   ```
   المحتوى بالضبط كما رفعته:
   ```xml
   <?xml version="1.0"?>
   <users>
     <user>0B95849CA06D91617606701F66E479A6</user>
   </users>
   ```

## بعد النشر
1. اضغط **Publish** لنشر الموقع.
2. ارجع إلى Bing Webmaster Tools واختر طريقة التحقق **XML File**.
3. اضغط **Verify** — Bing راح يجلب الملف ويتأكد من الرمز.
4. بعد نجاح التحقق: من قائمة **Sitemaps** أضف:
   ```
   https://filmak.lovable.app/sitemap.xml
   ```
   (نفس الـ sitemap اللي يشتغل حالياً — Bing عادةً يفهرس أسرع من Google بكثير).
