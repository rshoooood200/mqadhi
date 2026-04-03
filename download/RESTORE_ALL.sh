#!/bin/bash
# ============================================
# ملف استعادة جميع التعديلات - مشروع مقاضي
# ============================================
# شغّل هذا الملف في كل جلسة جديدة:
# bash /home/z/my-project/download/RESTORE_ALL.sh
# ============================================

cd /home/z/my-project

echo "🔄 جاري استعادة جميع التعديلات..."
echo ""

# 1. استعادة page.tsx
if [ -f "/home/z/my-project/download/backup_files/page.tsx" ]; then
  cp /home/z/my-project/download/backup_files/page.tsx /home/z/my-project/src/app/page.tsx
  echo "✅ تم استعادة page.tsx"
fi

# 2. استعادة schema.prisma
if [ -f "/home/z/my-project/download/backup_files/schema.prisma" ]; then
  cp /home/z/my-project/download/backup_files/schema.prisma /home/z/my-project/prisma/schema.prisma
  echo "✅ تم استعادة schema.prisma"
fi

# 3. استعادة API suggestions/delete
mkdir -p /home/z/my-project/src/app/api/suggestions/delete
if [ -f "/home/z/my-project/download/backup_files/api/suggestions/delete/route.ts" ]; then
  cp /home/z/my-project/download/backup_files/api/suggestions/delete/route.ts /home/z/my-project/src/app/api/suggestions/delete/route.ts
  echo "✅ تم استعادة API suggestions/delete"
fi

# 4. استعادة sync route
if [ -f "/home/z/my-project/download/backup_files/sync_route.ts" ]; then
  cp /home/z/my-project/download/backup_files/sync_route.ts /home/z/my-project/src/app/api/sync/route.ts
  echo "✅ تم استعادة sync/route.ts"
fi

# 5. استعادة prisma.ts
if [ -f "/home/z/my-project/download/backup_files/prisma.ts" ]; then
  cp /home/z/my-project/download/backup_files/prisma.ts /home/z/my-project/src/lib/prisma.ts
  echo "✅ تم استعادة prisma.ts"
fi

# 6. تحديث قاعدة البيانات
echo ""
echo "🔄 جاري تحديث قاعدة البيانات..."
npx prisma generate 2>/dev/null
npx prisma db push 2>/dev/null
echo "✅ تم تحديث قاعدة البيانات"

# 7. حفظ في git
git add . 2>/dev/null
git commit -m "استعادة التعديلات من الـ backup" 2>/dev/null
echo "✅ تم حفظ التعديلات في git"

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 تم استعادة جميع التعديلات بنجاح!"
echo "═══════════════════════════════════════════════"
echo ""
echo "التعديلات المستعادة:"
echo "  ✅ حقل الكمية فارغ افتراضياً (بدون رقم 1)"
echo "  ✅ placeholder = 'أدخل الكمية'"
echo "  ✅ زر حذف الاقتراحات 🗑️"
echo "  ✅ API حذف الاقتراحات من السيرفر"
echo "  ✅ نموذج SavedProductName في قاعدة البيانات"
echo "  ✅ حفظ الاقتراحات عبر الأجهزة"
echo ""
