# مقاضي - Mqadhi
## 🛒 تطبيق إدارة قائمة المشتريات

تطبيق متكامل لإدارة قائمة المشتريات مع تتبع الأسعار وإدارة العائلة.

---

## 🚀 النشر على Vercel

### الخطوة 1: رفع الكود إلى GitHub

```bash
# إنشاء repository جديد على GitHub ثم:
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### الخطوة 2: إنشاء مشروع Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **"New Project"**
3. اختر repository الخاص بك
4. اضغط **"Import"**

### الخطوة 3: إضافة متغيرات البيئة

في إعدادات المشروع على Vercel، أضف هذه المتغيرات:

```
DATABASE_URL=postgresql://postgres:Rr0558750989@db.gndcbkzulzeeillptdip.supabase.co:5432/postgres?pgbouncer=true

DIRECT_DATABASE_URL=postgresql://postgres:Rr0558750989@db.gndcbkzulzeeillptdip.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://gndcbkzulzeeillptdip.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YfGCoMn2QgA9JX0R6ZybFg_zSnqQ3Is
```

### الخطوة 4: النشر

اضغط **"Deploy"** وانتظر اكتمال النشر.

---

## ⚠️ مهم: إنشاء جداول قاعدة البيانات

بعد أول نشر، يجب تشغيل الـ migrations لإنشاء الجداول:

### الطريقة 1: عبر Vercel CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# ربط المشروع
vercel link

# تشغيل migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### الطريقة 2: عبر Supabase Dashboard

1. اذهب إلى [Supabase SQL Editor](https://supabase.com/dashboard/project/gndcbkzulzeeillptdip/sql)
2. انسخ محتوى ملف `prisma/migrations/20240404_init/migration.sql`
3. الصقه في المحرر واضغط **Run**

---

## 📋 الميزات

- ✅ إدارة قائمة المشتريات
- ✅ تتبع الأسعار بين المتاجر
- ✅ إدارة العائلة والمشاركة
- ✅ تصنيف تلقائي للمنتجات
- ✅ تصدير واستيراد البيانات
- ✅ مسح الفواتير بالكاميرا
- ✅ الميزانية الشهرية
- ✅ الوضع الليلي

---

## 🔧 التطوير المحلي

```bash
# تثبيت المتطلبات
npm install

# تشغيل السيرفر
npm run dev

# فتح المتصفح
http://localhost:3000
```

---

## 📱 التقنيات

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Deployment**: Vercel
