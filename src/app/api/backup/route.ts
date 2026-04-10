import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // جلب النسخ الاحتياطية من قاعدة البيانات
    const backups = await prisma.backup.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true
      }
    })

    const formattedBackups = backups.map(backup => ({
      id: backup.id,
      timestamp: backup.createdAt.getTime().toString(),
      date: backup.createdAt.toLocaleString('ar-SA')
    }))

    // حذف النسخ القديمة (أكثر من 10)
    if (backups.length === 10) {
      const oldBackups = await prisma.backup.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        select: { id: true }
      })
      
      if (oldBackups.length > 0) {
        await prisma.backup.deleteMany({
          where: {
            id: { in: oldBackups.map(b => b.id) }
          }
        })
      }
    }

    return NextResponse.json({
      backups: formattedBackups
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
    const backupData = {
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

    // حفظ النسخة الاحتياطية في قاعدة البيانات
    const backup = await prisma.backup.create({
      data: {
        userId: user.id,
        data: backupData
      }
    })

    console.log(`✅ تم إنشاء نسخة احتياطية للمستخدم ${user.email}: ${backup.id}`)

    return NextResponse.json({
      success: true,
      id: backup.id,
      timestamp: backup.createdAt.getTime().toString(),
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

// DELETE - حذف نسخة احتياطية
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const backupId = searchParams.get('id')

    if (!backupId) {
      return NextResponse.json({ error: 'معرف النسخة مطلوب' }, { status: 400 })
    }

    // التحقق من أن النسخة تخص المستخدم
    const backup = await prisma.backup.findFirst({
      where: {
        id: backupId,
        userId: user.id
      }
    })

    if (!backup) {
      return NextResponse.json({ error: 'النسخة غير موجودة' }, { status: 404 })
    }

    await prisma.backup.delete({
      where: { id: backupId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Backup delete error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
