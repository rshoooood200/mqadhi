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

    console.log('📥 تحميل البيانات للمستخدم:', user.email, 'ID:', user.id)

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

    console.log('📤 إرجاع البيانات:', {
      items: formattedItems.length,
      familyMembers: formattedFamilyMembers.length,
      customStores: customStores.length,
      priceHistoryRecords: priceHistory.length,
      customCategories: formattedCustomCategories.length,
      savedProductNames: savedProductNames.length
    })

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

// 📌 Map للتحكم في الطلبات المتوازية لكل مستخدم
const userSaveLocks = new Map<string, { promise: Promise<void>; resolve: () => void }>()

// POST - حفظ بيانات المستخدم
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    console.log('⚠️ POST /api/sync: المستخدم غير مسجل الدخول')
    return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
  }

  console.log('📥 POST /api/sync للمستخدم:', user.email, 'ID:', user.id)

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
      console.log('⚠️ خطأ في تنسيق البيانات')
      return NextResponse.json({ error: 'خطأ في تنسيق البيانات' }, { status: 400 })
    }
  }

  const { items, familyMembers, customStores, priceHistory, budget, customCategories, savedProductNames, clientTimestamp } = data

  console.log('📊 البيانات المستلمة:', {
    items: items?.length || 0,
    familyMembers: familyMembers?.length || 0,
    customStores: customStores?.length || 0,
    priceHistoryKeys: priceHistory ? Object.keys(priceHistory).length : 0,
    budget: budget ? { monthlyBudget: budget.monthlyBudget, spentAmount: budget.spentAmount, shoppingTurn: budget.shoppingTurn } : null,
    customCategories: customCategories?.length || 0,
    savedProductNames: savedProductNames?.length || 0,
    clientTimestamp
  })

  // التحقق مما إذا كانت items محددة (حتى لو فارغة)
  const itemsSpecified = items !== undefined
  const hasItems = items && items.length > 0
  const familyMembersSpecified = familyMembers !== undefined
  const hasFamilyMembers = familyMembers && familyMembers.length > 0
  const customStoresSpecified = customStores !== undefined
  const hasCustomStores = customStores && customStores.length > 0
  const priceHistorySpecified = priceHistory !== undefined
  const hasPriceHistory = priceHistory && Object.keys(priceHistory).length > 0
  const customCategoriesSpecified = customCategories !== undefined
  const hasCustomCategories = customCategories && customCategories.length > 0
  const savedProductNamesSpecified = savedProductNames !== undefined
  const hasSavedProductNames = savedProductNames && savedProductNames.length > 0
  const hasBudget = budget && (budget.monthlyBudget > 0 || budget.spentAmount > 0 || budget.shoppingTurn)

  // 🚨 حماية من Race Condition: انتظار أي عملية حفظ سابقة للمستخدم نفسه
  const existingLock = userSaveLocks.get(user.id)
  if (existingLock) {
    console.log('⏳ انتظار عملية حفظ سابقة للمستخدم:', user.email)
    try {
      await existingLock.promise
    } catch {
      // تجاهل أخطاء العملية السابقة
    }
  }

  // إنشاء قفل جديد لهذه العملية
  let resolveLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })
  userSaveLocks.set(user.id, { promise: lockPromise, resolve: resolveLock! })

  try {
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

    // 🚨 حفظ/تحديث العناصر مع حماية قوية من الحذف غير المقصود
    // 🚨 استخدام transaction لضمان atomicity
    if (itemsSpecified) {
      // التحقق من البيانات الحالية على السيرفر
      const currentItemsCount = await prisma.item.count({ where: { userId: user.id } })
      
      // 🛡️ حماية: إذا كان هناك عناصر على السيرفر ولا توجد بيانات جديدة، لا تحذف!
      // هذا يمنع الحذف غير المقصود بسبب race condition أو خطأ في إرسال البيانات
      if (currentItemsCount > 0 && !hasItems) {
        console.log(`⚠️ حماية items: يوجد ${currentItemsCount} عنصر على السيرفر ولا توجد بيانات جديدة - تم تخطي الحذف`)
      } else {
        await prisma.$transaction(async (tx) => {
          // حذف العناصر القديمة فقط إذا كانت هناك بيانات جديدة
          console.log('🗑️ حذف العناصر القديمة...')
          await tx.item.deleteMany({ where: { userId: user.id } })

          // حفظ العناصر الجديدة (إذا وجدت)
          if (hasItems) {
            console.log('💾 حفظ', items.length, 'عناصر جديدة...')
            for (const item of items) {
              try {
                // 🚨 مهم: استخدام ID من client للحفاظ على التطابق
                // التحقق من صحة الـ ID (cuid format: يبدأ بـ 'c' و25 حرف)
                const isValidCuid = item.id && /^c[a-z0-9]{24}$/.test(item.id)
                
                await tx.item.create({
                  data: {
                    id: isValidCuid ? item.id : undefined, // 🔧 نستخدم ID من client إذا كان صالحاً
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
              } catch (itemError: any) {
                // 🚨 إذا فشل الحفظ بسبب تكرار ID، نحاول بدون ID
                if (itemError?.code === 'P2002') {
                  console.log('⚠️ ID مكرر، إنشاء ID جديد:', item.name)
                  try {
                    await tx.item.create({
                      data: {
                        // بدون ID - ندع Prisma يولد واحد جديد
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
                  } catch (retryError) {
                    console.error('❌ فشل الحفظ حتى مع ID جديد:', item.name, retryError)
                  }
                } else {
                  console.error('❌ خطأ في حفظ العنصر:', item.name, itemError)
                }
              }
            }
            console.log('✅ تم حفظ جميع العناصر')
          } else {
            console.log('📝 لا توجد عناصر للحفظ')
          }
        }, {
          // 🚨 إعدادات الـ transaction
          maxWait: 5000, // أقصى انتظار للحصول على lock
          timeout: 30000, // timeout للعملية
        })
      }
    }

    // 🚨 حفظ/تحديث أفراد العائلة مع حماية قوية من الحذف غير المقصود
    if (familyMembersSpecified) {
      const currentFamilyMembersCount = await prisma.familyMember.count({ where: { userId: user.id } })
      
      // 🛡️ حماية: إذا كان هناك أفراد على السيرفر ولا توجد بيانات جديدة، لا تحذف!
      if (currentFamilyMembersCount > 0 && !hasFamilyMembers) {
        console.log(`⚠️ حماية familyMembers: يوجد ${currentFamilyMembersCount} أفراد على السيرفر ولا توجد بيانات جديدة - تم تخطي الحذف`)
      } else {
        if (hasFamilyMembers || currentFamilyMembersCount === 0) {
          console.log('👥 حفظ', familyMembers?.length || 0, 'أفراد العائلة')
          await prisma.familyMember.deleteMany({ where: { userId: user.id } })
          
          if (hasFamilyMembers) {
            try {
              await prisma.familyMember.createMany({
                data: familyMembers.map((m: { id: string; name: string; avatar: string }) => ({
                  id: m.id,
                  name: m.name,
                  avatar: m.avatar || '👤',
                  userId: user.id
                }))
              })
              console.log('✅ تم حفظ أفراد العائلة')
            } catch (fmError) {
              console.error('❌ خطأ في حفظ أفراد العائلة:', fmError)
            }
          }
        }
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

    // 🚨 حفظ/تحديث سجل الأسعار مع حماية قوية من الحذف غير المقصود
    if (priceHistorySpecified) {
      // التحقق من البيانات الحالية على السيرفر
      const currentPriceHistoryCount = await prisma.priceHistoryRecord.count({ where: { userId: user.id } })
      
      // 🛡️ حماية: إذا كان هناك بيانات على السيرفر ولا توجد بيانات جديدة، لا تحذف!
      // هذا يمنع الحذف غير المقصود بسبب race condition أو خطأ في إرسال البيانات
      if (currentPriceHistoryCount > 0 && !hasPriceHistory) {
        console.log(`⚠️ حماية priceHistory: يوجد ${currentPriceHistoryCount} سجل على السيرفر ولا توجد بيانات جديدة - تم تخطي الحذف`)
      } else {
        // فقط احذف إذا كانت هناك بيانات جديدة صالحة للحفظ
        if (hasPriceHistory || currentPriceHistoryCount === 0) {
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
              console.log(`✅ تم حفظ ${records.length} سجل أسعار`)
            }
          }
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
          data: customCategories.map((cat: { name: string; icon: string; color: string; keywords: string[] }) => ({
            // 🔧 لا نمرر ID - ندع Prisma يولد cuid صالح
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

    console.log('✅ تم حفظ جميع البيانات بنجاح للمستخدم:', user.email)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Sync post error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  } finally {
    // 🚨 تحرير القفل دائماً - مهم جداً لمنع deadlock
    const lock = userSaveLocks.get(user.id)
    if (lock) {
      lock.resolve()
      // إزالة القفل بعد فترة قصيرة للسماح بالطلبات التالية
      setTimeout(() => {
        userSaveLocks.delete(user.id)
      }, 1000)
    }
  }
}
