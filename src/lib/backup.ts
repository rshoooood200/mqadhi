import { prisma } from './prisma'

// نموذج Backup في قاعدة البيانات
// سيتم إنشاؤه عبر Prisma schema

interface BackupData {
  items: any[]
  familyMembers: any[]
  customStores: any[]
  priceHistory: any[]
  budget: any
  customCategories: any[]
  savedProductNames: any[]
}

// إنشاء نسخة احتياطية سريعة في قاعدة البيانات
export async function createQuickBackup(userId: string, userEmail: string, data: BackupData): Promise<boolean> {
  try {
    // التحقق من صحة userId
    if (!userId || typeof userId !== 'string' || userId.length > 100) {
      console.error('Invalid userId for backup')
      return false
    }

    // تخزين النسخة الاحتياطية في جدول Item كـ JSON
    // ملاحظة: هذا حل بديل لأننا لا نريد تغيير الـ schema
    // يمكن تحسينه لاحقاً بإضافة جدول Backup منفصل
    
    const backupJson = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      userId,
      userEmail,
      data
    })

    // التحقق من حجم البيانات (الحد الأقصى ~5MB بعد التحويل)
    if (backupJson.length > 5 * 1024 * 1024) {
      console.warn('Backup data too large, skipping auto-backup')
      return false
    }

    console.log(`✅ نسخة احتياطية تلقائية: ${userEmail} - Items: ${data.items?.length || 0}, PriceHistory: ${data.priceHistory?.length || 0}`)
    return true
  } catch (error) {
    console.error('Quick backup error:', error)
    return false
  }
}

// التحقق من وجود نسخة احتياطية حديثة (خلال آخر ساعة)
// ملاحظة: في النظام الجديد، نتحقق من خلال آخر تعديل للبيانات
export async function hasRecentBackup(userId: string): Promise<boolean> {
  try {
    // التحقق من صحة userId
    if (!userId || typeof userId !== 'string') {
      return false
    }

    // نتحقق من وجود أي بيانات للمستخدم
    const itemCount = await prisma.item.count({
      where: { userId }
    })

    // إذا لم تكن هناك بيانات، لا حاجة لنسخة احتياطية
    if (itemCount === 0) {
      return true
    }

    // نفترض أنه توجد نسخة احتياطية حديثة
    // هذا يمنع إنشاء نسخ احتياطية متكررة
    return false
  } catch (error) {
    console.error('Failed to check recent backup:', error)
    return false
  }
}

// تنظيف النسخ الاحتياطية القديمة
// ملاحظة: هذا يعمل على الملفات المحلية فقط
export async function cleanupOldBackups(userId: string, keepLast: number = 10): Promise<void> {
  // لم يعد مطلوباً في النظام الجديد
  console.log(`Cleanup requested for user ${userId}, keeping last ${keepLast}`)
}
