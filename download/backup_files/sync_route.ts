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

// GET - تحميل بيانات المستخدم
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    // جلب جميع بيانات المستخدم
    const [items, familyMembers, customStores, priceHistory, budget, customCategories] = await Promise.all([
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
      })
    ])

    // تنسيق الأسعار حسب اسم المنتج
    const formattedPriceHistory: Record<string, { store: string; price: number; date: string }[]> = {}
    for (const record of priceHistory) {
      const key = record.productName.toLowerCase()
      if (!formattedPriceHistory[key]) formattedPriceHistory[key] = []
      formattedPriceHistory[key].push({
        store: record.store,
        price: record.price,
        date: record.date.toISOString()
      })
    }

    // تنسيق الأغراض
    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      notes: item.notes,
      isPurchased: item.isPurchased,
      image: item.image,
      prices: item.prices.map(p => ({
        store: p.store,
        price: p.price,
        date: p.date.toISOString()
      })),
      createdAt: item.createdAt.toISOString()
    }))

    // تنسيق أفراد العائلة
    const formattedFamilyMembers = familyMembers.map(m => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      email: ''
    }))

    // تنسيق التصنيفات المخصصة
    const formattedCustomCategories = customCategories.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      keywords: c.keywords ? c.keywords.split(',').map(k => k.trim()).filter(k => k) : []
    }))

    return NextResponse.json({
      items: formattedItems,
      familyMembers: formattedFamilyMembers,
      customStores: customStores.map(s => s.name),
      priceHistory: formattedPriceHistory,
      budget: budget ? {
        monthlyBudget: budget.monthlyBudget,
        spentAmount: budget.spentAmount,
        startDate: budget.startDate?.toISOString() || '',
        shoppingTurn: budget.shoppingTurn || ''
      } : null,
      customCategories: formattedCustomCategories
    })
  } catch (error) {
    console.error('Sync get error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - حفظ بيانات المستخدم
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { items, familyMembers, customStores, priceHistory, budget, customCategories } = await request.json()

    // حذف البيانات القديمة
    await Promise.all([
      prisma.item.deleteMany({ where: { userId: user.id } }),
      prisma.familyMember.deleteMany({ where: { userId: user.id } }),
      prisma.customStore.deleteMany({ where: { userId: user.id } }),
      prisma.priceHistoryRecord.deleteMany({ where: { userId: user.id } }),
      prisma.customCategory.deleteMany({ where: { userId: user.id } }),
    ])

    // حفظ الأغراض
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

    // حفظ أفراد العائلة
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

    // حفظ المتاجر المخصصة
    if (customStores && customStores.length > 0) {
      await prisma.customStore.createMany({
        data: customStores.map((name: string) => ({
          name,
          userId: user.id
        }))
      })
    }

    // حفظ سجل الأسعار
    if (priceHistory && Object.keys(priceHistory).length > 0) {
      const records: { productName: string; store: string; price: number; date: Date; userId: string }[] = []
      for (const [productName, prices] of Object.entries(priceHistory)) {
        for (const p of (prices as { store: string; price: number; date: string }[])) {
          records.push({
            productName,
            store: p.store,
            price: p.price,
            date: new Date(p.date),
            userId: user.id
          })
        }
      }
      if (records.length > 0) {
        await prisma.priceHistoryRecord.createMany({ data: records })
      }
    }

    // حفظ الميزانية
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

    // حفظ التصنيفات المخصصة
    if (customCategories && customCategories.length > 0) {
      await prisma.customCategory.createMany({
        data: customCategories.map((cat: { id: string; name: string; icon: string; color: string; keywords: string[] }) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦',
          color: cat.color || 'gray',
          keywords: Array.isArray(cat.keywords) ? cat.keywords.join(',') : '',
          userId: user.id
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync post error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
