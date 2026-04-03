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

// GET - تصدير جميع بيانات المستخدم
export async function GET(request: NextRequest) {
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
        where: { userId: user.id },
        select: { name: true }
      })
    ])

    // تنسيق البيانات للتصدير
    const exportData = {
      // معلومات التطبيق
      appVersion: '1.2.2',
      exportDate: new Date().toISOString(),
      exportType: 'mqadhi-backup',
      
      // معلومات المستخدم (بدون كلمة المرور)
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      
      // الأغراض
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        notes: item.notes,
        isPurchased: item.isPurchased,
        image: item.image,
        order: item.order,
        createdAt: item.createdAt.toISOString(),
        prices: item.prices.map(p => ({
          store: p.store,
          price: p.price,
          date: p.date.toISOString()
        }))
      })),
      
      // أفراد العائلة
      familyMembers: familyMembers.map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar
      })),
      
      // المتاجر المخصصة
      customStores: customStores.map(s => s.name),
      
      // سجل الأسعار
      priceHistory: (() => {
        const formatted: Record<string, { store: string; price: number; date: string }[]> = {}
        for (const record of priceHistory) {
          const key = record.productName
          if (!formatted[key]) formatted[key] = []
          formatted[key].push({
            store: record.store,
            price: record.price,
            date: record.date.toISOString()
          })
        }
        return formatted
      })(),
      
      // الميزانية
      budget: budget ? {
        monthlyBudget: budget.monthlyBudget,
        spentAmount: budget.spentAmount,
        startDate: budget.startDate?.toISOString() || null,
        shoppingTurn: budget.shoppingTurn || null
      } : null,
      
      // التصنيفات المخصصة
      customCategories: customCategories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        keywords: c.keywords ? c.keywords.split(',').map(k => k.trim()).filter(k => k) : []
      })),
      
      // أسماء المنتجات المحفوظة
      savedProductNames: savedProductNames.map(s => s.name)
    }

    // إرجاع البيانات كملف JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="mqadhi-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء التصدير' }, { status: 500 })
  }
}
