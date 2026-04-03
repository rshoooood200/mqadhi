import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

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

// POST - استعادة البيانات من نسخة احتياطية
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'اسم الملف مطلوب' }, { status: 400 })
    }

    // 🛡️ حماية من Path Traversal
    // التحقق من أن اسم الملف آمن (لا يحتوي على مسارات نسبية أو مطلقة)
    const normalizedFilename = path.basename(filename) // إزالة أي مسارات

    // التحقق من أن الملف يخص المستخدم
    if (!normalizedFilename.startsWith(`${user.id}_`)) {
      return NextResponse.json({ error: 'غير مصرح بهذا الملف' }, { status: 403 })
    }

    // التحقق من امتداد الملف
    if (!normalizedFilename.endsWith('.json')) {
      return NextResponse.json({ error: 'نوع ملف غير صالح' }, { status: 400 })
    }

    // بناء المسار بشكل آمن
    const filepath = path.join(BACKUP_DIR, normalizedFilename)

    // 🛡️ تأكد أن الملف داخل المجلد المسموح فقط
    const resolvedPath = path.resolve(filepath)
    const resolvedBackupDir = path.resolve(BACKUP_DIR)
    if (!resolvedPath.startsWith(resolvedBackupDir)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // التحقق من وجود الملف
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    // قراءة النسخة الاحتياطية
    const content = await readFile(filepath, 'utf-8')
    const backup = JSON.parse(content)

    // التحقق من صحة البيانات
    if (!backup.data) {
      return NextResponse.json({ error: 'ملف تالف' }, { status: 400 })
    }

    const { items, familyMembers, customStores, priceHistory, budget, customCategories, savedProductNames } = backup.data

    // حذف البيانات الحالية
    await Promise.all([
      prisma.item.deleteMany({ where: { userId: user.id } }),
      prisma.familyMember.deleteMany({ where: { userId: user.id } }),
      prisma.customStore.deleteMany({ where: { userId: user.id } }),
      prisma.priceHistoryRecord.deleteMany({ where: { userId: user.id } }),
      prisma.customCategory.deleteMany({ where: { userId: user.id } }),
      prisma.savedProductName.deleteMany({ where: { userId: user.id } }),
    ])

    // استعادة الأغراض
    if (items && items.length > 0) {
      for (const item of items) {
        await prisma.item.create({
          data: {
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity || 1,
            notes: item.notes || '',
            isPurchased: item.isPurchased || false,
            image: item.image || null,
            userId: user.id,
            prices: {
              create: (item.prices || []).map((p: { store: string; price: number; date: string }) => ({
                store: p.store,
                price: p.price,
                date: new Date(p.date)
              }))
            }
          }
        })
      }
    }

    // استعادة أفراد العائلة
    if (familyMembers && familyMembers.length > 0) {
      await prisma.familyMember.createMany({
        data: familyMembers.map((m: { id: string; name: string; avatar: string }) => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar || '👤',
          userId: user.id
        }))
      })
    }

    // استعادة المتاجر المخصصة
    if (customStores && customStores.length > 0) {
      await prisma.customStore.createMany({
        data: customStores.map((s: { name: string }) => ({
          name: s.name,
          userId: user.id
        }))
      })
    }

    // استعادة سجل الأسعار
    if (priceHistory && priceHistory.length > 0) {
      const records = priceHistory.map((p: { productName: string; store: string; price: number; date: string }) => ({
        productName: p.productName,
        store: p.store,
        price: p.price,
        date: new Date(p.date),
        userId: user.id
      }))
      await prisma.priceHistoryRecord.createMany({ data: records })
    }

    // استعادة الميزانية
    if (budget) {
      await prisma.budget.upsert({
        where: { userId: user.id },
        update: {
          monthlyBudget: budget.monthlyBudget || 0,
          spentAmount: budget.spentAmount || 0,
          startDate: budget.startDate ? new Date(budget.startDate) : null,
          shoppingTurn: budget.shoppingTurn || null
        },
        create: {
          monthlyBudget: budget.monthlyBudget || 0,
          spentAmount: budget.spentAmount || 0,
          startDate: budget.startDate ? new Date(budget.startDate) : null,
          shoppingTurn: budget.shoppingTurn || null,
          userId: user.id
        }
      })
    }

    // استعادة التصنيفات المخصصة
    if (customCategories && customCategories.length > 0) {
      await prisma.customCategory.createMany({
        data: customCategories.map((cat: { id: string; name: string; icon: string; color: string; keywords: string }) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦',
          color: cat.color || 'gray',
          keywords: cat.keywords || '',
          userId: user.id
        }))
      })
    }

    // استعادة أسماء المنتجات المحفوظة
    if (savedProductNames && savedProductNames.length > 0) {
      for (const s of savedProductNames) {
        if (s.name && s.name.trim()) {
          try {
            await prisma.savedProductName.create({
              data: {
                name: s.name.trim(),
                userId: user.id
              }
            })
          } catch {
            // تجاهل التكرار
          }
        }
      }
    }

    console.log(`✅ تم استعادة النسخة الاحتياطية للمستخدم ${user.email}: ${filename}`)

    return NextResponse.json({
      success: true,
      message: 'تم استعادة البيانات بنجاح',
      restoredFrom: backup.createdAt,
      stats: {
        items: items?.length || 0,
        familyMembers: familyMembers?.length || 0,
        priceHistory: priceHistory?.length || 0
      }
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الاستعادة' }, { status: 500 })
  }
}
