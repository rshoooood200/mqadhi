import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createQuickBackup, hasRecentBackup } from '@/lib/backup'

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
      customCategories: formattedCustomCategories,
      savedProductNames: savedProductNames.map(s => s.name)
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

    // 📌 دعم sendBeacon الذي يرسل البيانات كـ text/plain
    const contentType = request.headers.get('content-type') || ''
    let data: any

    if (contentType.includes('application/json')) {
      data = await request.json()
    } else {
      // sendBeacon يرسل البيانات كـ text/plain
      const text = await request.text()
      try {
        data = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: 'خطأ في تنسيق البيانات' }, { status: 400 })
      }
    }

    const { items, familyMembers, customStores, priceHistory, budget, customCategories, savedProductNames } = data

    // التحقق مما إذا كانت items محددة (حتى لو فارغة)
    const itemsSpecified = items !== undefined
    const hasItems = items && items.length > 0
    const hasFamilyMembers = familyMembers && familyMembers.length > 0
    const hasCustomStores = customStores && customStores.length > 0
    const hasPriceHistory = priceHistory && Object.keys(priceHistory).length > 0
    const hasCustomCategories = customCategories && customCategories.length > 0
    const hasSavedProductNames = savedProductNames && savedProductNames.length > 0
    const hasBudget = budget && (budget.monthlyBudget > 0 || budget.spentAmount > 0 || budget.shoppingTurn)

    // جلب عدد البيانات الحالية
    const currentItemsCount = await prisma.item.count({ where: { userId: user.id } })
    
    // 🔄 إنشاء نسخة احتياطية تلقائية قبل أي تعديل (إذا كان هناك بيانات حالية)
    if (currentItemsCount > 0 && itemsSpecified) {
      const needsBackup = !(await hasRecentBackup(user.id))
      if (needsBackup) {
        // جلب البيانات الحالية للنسخة الاحتياطية
        const [backupItems, backupFamilyMembers, backupCustomStores, backupPriceHistory, backupBudget, backupCustomCategories, backupSavedProductNames] = await Promise.all([
          prisma.item.findMany({ where: { userId: user.id }, include: { prices: true } }),
          prisma.familyMember.findMany({ where: { userId: user.id } }),
          prisma.customStore.findMany({ where: { userId: user.id } }),
          prisma.priceHistoryRecord.findMany({ where: { userId: user.id } }),
          prisma.budget.findUnique({ where: { userId: user.id } }),
          prisma.customCategory.findMany({ where: { userId: user.id } }),
          prisma.savedProductName.findMany({ where: { userId: user.id } })
        ])

        // إنشاء النسخة الاحتياطية (بشكل غير متزامن - لا ننتظرها)
        createQuickBackup(user.id, user.email, {
          items: backupItems,
          familyMembers: backupFamilyMembers,
          customStores: backupCustomStores,
          priceHistory: backupPriceHistory,
          budget: backupBudget,
          customCategories: backupCustomCategories,
          savedProductNames: backupSavedProductNames
        }).catch(e => console.error('Backup error:', e))
      }
    }

    // 📌 إذا تم تحديد items (حتى لو فارغة)، نحذف القديمة ونحفظ الجديدة
    if (itemsSpecified) {
      // حذف العناصر القديمة
      await prisma.item.deleteMany({ where: { userId: user.id } })
      
      // حفظ العناصر الجديدة (إذا وجدت)
      if (hasItems) {
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
    }

    // حفظ/تحديث أفراد العائلة
    if (familyMembers !== undefined) {
      await prisma.familyMember.deleteMany({ where: { userId: user.id } })
      if (hasFamilyMembers) {
        await prisma.familyMember.createMany({
          data: familyMembers.map((m: { id: string; name: string; avatar: string }) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar || '👤',
            userId: user.id
          }))
        })
      }
    }

    // حفظ/تحديث المتاجر المخصصة
    if (customStores !== undefined) {
      await prisma.customStore.deleteMany({ where: { userId: user.id } })
      if (hasCustomStores) {
        await prisma.customStore.createMany({
          data: customStores.map((name: string) => ({
            name,
            userId: user.id
          }))
        })
      }
    }

    // حفظ/تحديث سجل الأسعار
    if (priceHistory !== undefined) {
      await prisma.priceHistoryRecord.deleteMany({ where: { userId: user.id } })
      if (hasPriceHistory) {
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
    }

    // حفظ الميزانية
    if (budget !== undefined) {
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

    // حفظ/تحديث التصنيفات المخصصة
    if (customCategories !== undefined) {
      await prisma.customCategory.deleteMany({ where: { userId: user.id } })
      if (hasCustomCategories) {
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
    }

    // حفظ أسماء المنتجات المحفوظة
    if (savedProductNames !== undefined) {
      await prisma.savedProductName.deleteMany({ where: { userId: user.id } })
      if (hasSavedProductNames) {
        for (const name of savedProductNames) {
          if (name && typeof name === 'string' && name.trim()) {
            try {
              await prisma.savedProductName.create({
                data: {
                  name: name.trim(),
                  userId: user.id
                }
              })
            } catch {
              // تجاهل التكرار (unique constraint)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync post error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
