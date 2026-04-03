#!/bin/bash
# سكريبت استعادة البيانات
cd /home/z/my-project

echo "=== النسخ الاحتياطية المتاحة ==="
ls -lt download/database_backups/*.db 2>/dev/null || echo "لا توجد نسخ احتياطية"
echo ""

# استعادة أحدث نسخة
LATEST=$(ls -t download/database_backups/*.db 2>/dev/null | head -1)

if [ -n "$LATEST" ]; then
    echo "🔄 جاري استعادة: $LATEST"
    cp "$LATEST" db/custom.db
    echo "✅ تم استعادة قاعدة البيانات"
else
    echo "❌ لا توجد نسخ احتياطية"
fi
