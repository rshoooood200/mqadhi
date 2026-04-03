import { writeFile, readdir, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// التأكد من وجود مجلد النسخ الاحتياطية
if (!existsSync(BACKUP_DIR)) {
  try {
    mkdirSync(BACKUP_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create backup directory:', error)
  }
}

interface BackupData {
  items: any[]
  familyMembers: any[]
  customStores: any[]
  priceHistory: any[]
  budget: any
  customCategories: any[]
  savedProductNames: any[]
}

// إنشاء نسخة احتياطية سريعة (بدون تحقق معقد)
export async function createQuickBackup(userId: string, userEmail: string, data: BackupData): Promise<boolean> {
  try {
    // التحقق من صحة userId
    if (!userId || typeof userId !== 'string' || userId.length > 100) {
      console.error('Invalid userId for backup')
      return false
    }

    const timestamp = Date.now()
    const filename = `${userId}_${timestamp}.json`
    const filepath = path.join(BACKUP_DIR, filename)

    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      userId,
      userEmail,
      data
    }

    await writeFile(filepath, JSON.stringify(backup, null, 2), 'utf-8')

    // حذف النسخ القديمة (الاحتفاظ بآخر 10 فقط)
    try {
      const files = await readdir(BACKUP_DIR)
      const userBackups = files
        .filter(f => f.startsWith(`${userId}_`))
        .sort()
        .reverse()

      const toDelete = userBackups.slice(10)
      for (const f of toDelete) {
        try {
          await unlink(path.join(BACKUP_DIR, f))
        } catch (unlinkError) {
          console.error(`Failed to delete old backup ${f}:`, unlinkError)
        }
      }
    } catch (readdirError) {
      console.error('Failed to read backup directory for cleanup:', readdirError)
    }

    console.log(`✅ نسخة احتياطية تلقائية: ${userEmail} - Items: ${data.items?.length || 0}, PriceHistory: ${data.priceHistory?.length || 0}`)
    return true
  } catch (error) {
    console.error('Quick backup error:', error)
    return false
  }
}

// التحقق من وجود نسخة احتياطية حديثة (خلال آخر ساعة)
export async function hasRecentBackup(userId: string): Promise<boolean> {
  try {
    // التحقق من صحة userId
    if (!userId || typeof userId !== 'string') {
      return false
    }

    const files = await readdir(BACKUP_DIR)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    for (const f of files) {
      if (f.startsWith(`${userId}_`)) {
        const timestampStr = f.replace(`${userId}_`, '').replace('.json', '')
        const timestamp = parseInt(timestampStr, 10)
        if (!isNaN(timestamp) && timestamp > oneHourAgo) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    console.error('Failed to check recent backup:', error)
    return false
  }
}
