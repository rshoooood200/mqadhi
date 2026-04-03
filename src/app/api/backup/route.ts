import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, readdir, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// التأكد من وجود مجلد النسخ الاحتياطية
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true })
}

// الحصول على المستخدم الحالي
async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value

  if (!sessionToken) return null

  const session = await prisma.session.findFirst({
    where: {
      id: sessionToken,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  })

  return session?.user || null
}

// GET - قائمة النسخ الاحتياطية للمستخدم
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    // قراءة ملفات النسخ الاحتياطية للمستخدم
    const files = await readdir(BACKUP_DIR)
    const userBackups = files
      .filter(f => f.startsWith(`${user.id}_`))
      .map(f => {
        const timestamp = f.replace(`${user.id}_`, '').replace('.json', '')
        return {
          filename: f,
          timestamp,
          date: new Date(parseInt(timestamp)).toLocaleString('ar-SA')
        }
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

    // الاحتفاظ بآخر 10 نسخ فقط
    const toDelete = userBackups.slice(10)
    for (const backup of toDelete) {
      try {
        await unlink(path.join(BACKUP_DIR, backup.filename))
      } catch {}
    }

    return NextResponse.json({
      backups: userBackups.slice(0, 10)
    })
  } catch (error) {
    console.error('Backup list error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - إنشاء نسخة احتياطية
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    // جلب جميع بيانات المستخدم
    const [items, familyMembers, customStores, priceHistory, budget, customCategories, savedProductNames] = await Promise.all([
      prisma.item.findMany({
        where: { userId: user.id },
        include: { prices: true }
      }),
      prisma.familyMember.findMany({
        where: { userId: user.id }
      }),
      prisma.customStore.findMany({
        where: { userId: user.id }
      }),
      prisma.priceHistoryRecord.findMany({
        where: { userId: user.id }
      }),
      prisma.budget.findUnique({
        where: { userId: user.id }
      }),
      prisma.customCategory.findMany({
        where: { userId: user.id }
      }),
      prisma.savedProductName.findMany({
        where: { userId: user.id }
      })
    ])

    // إنشاء كائن النسخة الاحتياطية
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      data: {
        items,
        familyMembers,
        customStores,
        priceHistory,
        budget,
        customCategories,
        savedProductNames
      }
    }

    // حفظ النسخة الاحتياطية
    const timestamp = Date.now()
    const filename = `${user.id}_${timestamp}.json`
    const filepath = path.join(BACKUP_DIR, filename)

    await writeFile(filepath, JSON.stringify(backup, null, 2), 'utf-8')

    console.log(`✅ تم إنشاء نسخة احتياطية للمستخدم ${user.email}: ${filename}`)

    return NextResponse.json({
      success: true,
      filename,
      timestamp,
      stats: {
        items: items.length,
        familyMembers: familyMembers.length,
        priceHistory: priceHistory.length,
        customCategories: customCategories.length
      }
    })
  } catch (error) {
    console.error('Backup create error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
