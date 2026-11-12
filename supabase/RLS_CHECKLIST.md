# تفعيل الحماية (RLS): الترتيب الصح

> ⚠️ لو الترتيب ده اتلخبط، الموقع هيفتح بقوايم فاضية. **الداتا مش هتتمسح**، بس مش هتبان لحد ما الخطوات تكتمل أو يتعمل rollback.

## 1. قبل أي حاجة
- [ ] الباك أب اتعمل وأعداد الصفوف متسجلة (`node backup/export.mjs --counts`).

## 2. نشر كود تسجيل الدخول (من غير RLS)
- [ ] في Vercel، من Project → Settings → Environment Variables، ضيف للـ Production والـ Preview:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  (نفس القيم اللي في `.env` عندك.)
- [ ] اعمل merge للـ PR واستنى لما الـ deploy يخلص.

## 3. حساب الكوتش
- [ ] من Supabase → Authentication → Users، استخدم حسابك (أو اعمل حساب جديد بـ Add user → Create new user، مع **Auto Confirm**).
- [ ] انسخ الـ **User UID** بتاعه.
- [ ] من Supabase → Authentication → Sign In / Providers، اقفل **"Allow new users to sign up"**. بس اتأكد الأول إن تطبيقاتك التانية (زي Track Lab) مش محتاجة تسجيل حسابات جديدة.

## 4. التجربة قبل RLS
- [ ] افتح https://force-peak.vercel.app وسجّل دخول بالإيميل والباسورد.
- [ ] اتأكد إن **كل** اللاعيبة والبرامج ظاهرين.
- [ ] افتح لينك welcome-pack وانت مش مسجّل دخول (من نافذة Incognito)، لازم يفتح عادي.

## 5. تطبيق RLS (بعد ما تقول "موافق")
- [ ] حط الـ UID مكان `__COACH_USER_ID__` في `supabase/migrations/20261113000000_enable_rls.sql`.
- [ ] شغّل الملف في Supabase → SQL Editor.

## 6. التأكد بعد RLS
- [ ] سجّل دخول، ولازم كل حاجة تكون ظاهرة: لاعيبة، برامج، تمارين، مكتبة، periodization.
- [ ] عدّل تمرين واحفظه، وبعدين ارفع welcome-pack.
- [ ] من Incognito: لينك الـ welcome-pack يفتح، والموقع نفسه يطلب تسجيل دخول.
- [ ] `node backup/export.mjs --counts`: **المفروض يطلع 0 بالـ anon key**، وده معناه إن الحماية شغالة. والأعداد الحقيقية بنتأكد منها بـ SQL.

## لو حصلت مشكلة
- شغّل `supabase/migrations/20261113000000_enable_rls_rollback.sql` في SQL Editor، وكل حاجة هترجع زي ما كانت.

## 7. بعد ما RLS يشتغل
- [ ] غيّر باسورد حسابك.
- [ ] (اختياري) لو عملت rotate للـ anon key: من Supabase → Settings → API، وبعدين حدّث `VITE_SUPABASE_ANON_KEY` في Vercel واعمل Redeploy. ده لأن المفتاح القديم موجود في تاريخ git. وبعد RLS هو مش خطير، لأنه لوحده مش بيفتح أي داتا.
