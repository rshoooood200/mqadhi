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

// POST - استيراد البيانات من ملف نسخة احتياطية
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const data = await request.json()

    // التحقق من صحة الملف
    if (!data.exportType || data.exportType !== 'mqadhi-backup') {
      return NextResponse.json({ error: 'ملف غير صالح - ليس نسخة احتياطية من تطبيق مقاضي' }, { status: 400 })
    }

    console.log('📦 بدء استيراد البيانات للمستخدم:', user.email)

    // حذف البيانات القديمة أولاً
    await Promise.all([
      prisma.item.deleteMany({ where: { userId: user.id } }),
      prisma.familyMember.deleteMany({ where: { userId: user.id } }),
      prisma.customStore.deleteMany({ where: { userId: user.id } }),
      prisma.priceHistoryRecord.deleteMany({ where: { userId: user.id } }),
      prisma.customCategory.deleteMany({ where: { userId: user.id } }),
      prisma.savedProductName.deleteMany({ where: { userId: user.id } }),
    ])

    console.log('🗑️ تم حذف البيانات القديمة')

    let importedItems = 0
    let importedFamilyMembers = 0
    let importedStores = 0
    let importedPriceHistory = 0
    let importedCategories = 0
    let importedProductNames = 0

    // استيراد الأغراض
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      console.log(`📦 استيراد ${data.items.length} غرض...`)
      
      for (const item of data.items) {
        try {
          await prisma.item.create({
            data: {
              name: item.name || 'منتج بدون اسم',
              category: item.category || 'other',
              quantity: Number(item.quantity) || 1,
              notes: item.notes || '',
              isPurchased: Boolean(item.isPurchased),
              image: item.image || null,
              order: Number(item.order) || 0,
              userId: user.id,
              prices: {
                create: (item.prices || []).map((p: { store: string; price: number; date: string }) => ({
                  store: p.store || 'غير محدد',
                  price: Number(p.price) || 0,
                  date: p.date ? new Date(p.date) : new Date()
                }))
              }
            }
          })
          importedItems++
        } catch (itemError) {
          console.error('خطأ في استيراد غرض:', item.name, itemError)
        }
      }
    }

    // استيراد أفراد العائلة
    if (data.familyMembers && Array.isArray(data.familyMembers) && data.familyMembers.length > 0) {
      console.log(`👥 استيراد ${data.familyMembers.length} فرد من العائلة...`)
      
      try {
        await prisma.familyMember.createMany({
          data: data.familyMembers.map((m: { name: string; avatar?: string }) => ({
            name: m.name || 'بدون اسم',
            avatar: m.avatar || '👤',
            userId: user.id
          }))
        })
        importedFamilyMembers = data.familyMembers.length
      } catch (familyError) {
        console.error('خطأ في استيراد أفراد العائلة:', familyError)
      }
    }

    // استيراد المتاجر المخصصة
    if (data.customStores && Array.isArray(data.customStores) && data.customStores.length > 0) {
      console.log(`🏪 استيراد ${data.customStores.length} متجر...`)
      
      try {
        await prisma.customStore.createMany({
          data: data.customStores
            .filter((name): name is string => typeof name === 'string' && name.trim())
            .map((name: string) => ({
              name: name.trim(),
              userId: user.id
            }))
        })
        importedStores = data.customStores.length
      } catch (storeError) {
        console.error('خطأ في استيراد المتاجر:', storeError)
      }
    }

    // استيراد سجل الأسعار
    if (data.priceHistory && typeof data.priceHistory === 'object') {
      const priceKeys = Object.keys(data.priceHistory)
      console.log(`💰 استيراد أسعار ${priceKeys.length} منتج...`)
      
      const records: { productName: string; store: string; price: number; date: Date; userId: string }[] = []
      
      for (const [productName, prices] of Object.entries(data.priceHistory)) {
        if (Array.isArray(prices)) {
          for (const p of prices) {
            if (p && typeof p === 'object') {
              records.push({
                productName: productName || 'غير محدد',
                store: (p as Record<string, unknown>).store as string || 'غير محدد',
                price: Number((p as Record<string, unknown>).price) || 0,
                date: (p as Record<string, unknown>).date ? new Date((p as Record<string, unknown>).date as string) : new Date(),
                userId: user.id
              })
            }
          }
        }
      }
      
      if (records.length > 0) {
        try {
          await prisma.priceHistoryRecord.createMany({ data: records })
          importedPriceHistory = records.length
        } catch (priceError) {
          console.error('خطأ في استيراد الأسعار:', priceError)
        }
      }
    }

    // استيراد الميزانية
    if (data.budget) {
      console.log('💵 استيراد الميزانية...')
      
      try {
        await prisma.budget.upsert({
          where: { userId: user.id },
          update: {
            monthlyBudget: Number(data.budget.monthlyBudget) || 0,
            spentAmount: Number(data.budget.spentAmount) || 0,
            startDate: data.budget.startDate ? new Date(data.budget.startDate) : null,
            shoppingTurn: data.budget.shoppingTurn || null
          },
          create: {
            monthlyBudget: Number(data.budget.monthlyBudget) || 0,
            spentAmount: Number(data.budget.spentAmount) || 0,
            startDate: data.budget.startDate ? new Date(data.budget.startDate) : null,
            shoppingTurn: data.budget.shoppingTurn || null,
            userId: user.id
          }
        })
      } catch (budgetError) {
        console.error('خطأ في استيراد الميزانية:', budgetError)
      }
    }

    // استيراد التصنيفات المخصصة
    if (data.customCategories && Array.isArray(data.customCategories) && data.customCategories.length > 0) {
      console.log(`📁 استيراد ${data.customCategories.length} تصنيف...`)
      
      try {
        await prisma.customCategory.createMany({
          data: data.customCategories.map((cat: { name: string; icon?: string; color?: string; keywords?: string[] }) => ({
            name: cat.name || 'تصنيف بدون اسم',
            icon: cat.icon || '📦',
            color: cat.color || 'gray',
            keywords: Array.isArray(cat.keywords) ? cat.keywords.join(',') : '',
            userId: user.id
          }))
        })
        importedCategories = data.customCategories.length
      } catch (catError) {
        console.error('خطأ في استيراد التصنيفات:', catError)
      }
    }

    // استيراد أسماء المنتجات المحفوظة
    if (data.savedProductNames && Array.isArray(data.savedProductNames) && data.savedProductNames.length > 0) {
      console.log(`📝 استيراد ${data.savedProductNames.length} اسم منتج...`)
      
      for (const name of data.savedProductNames) {
        if (name && typeof name === 'string' && name.trim()) {
          try {
            await prisma.savedProductName.create({
              data: {
                name: name.trim(),
                userId: user.id
              }
            })
            importedProductNames++
          } catch {
            // تجاهل التكرار
          }
        }
      }
    }

    console.log('✅ تم استيراد البيانات بنجاح')

    return NextResponse.json({
      success: true,
      message: 'تم استيراد البيانات بنجاح',
      stats: {
        items: importedItems,
        familyMembers: importedFamilyMembers,
        stores: importedStores,
        priceHistory: importedPriceHistory,
        categories: importedCategories,
        productNames: importedProductNames
      }
    })
  } catch (error) {
    console.error('Import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
