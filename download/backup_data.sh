#!/bin/bash
# سكريبت النسخ الاحتياطي للبيانات
cd /home/z/my-project

DATE=$(date +%Y%m%d_%H%M%S)

# نسخ قاعدة البيانات
mkdir -p download/database_backups
cp db/custom.db download/database_backups/custom_$DATE.db

echo "✅ تم إنشاء نسخة احتياطية: custom_$DATE.db"
echo "📁 الموقع: download/database_backups/"

# الاحتفاظ بآخر 10 نسخ فقط
cd download/database_backups
ls -t custom_*.db | tail -n +11 | xargs rm -f 2>/dev/null
echo "🗑️ تم حذف النسخ القديمة (الاحتفاظ بآخر 10 نسخ)"
