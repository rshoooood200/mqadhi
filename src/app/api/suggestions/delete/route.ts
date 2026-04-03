import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/auth-utils'

async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null
  const session = await prisma.session.findFirst({
    where: { id: sessionToken, expiresAt: { gt: new Date() } },
    include: { user: true }
  })
  return session?.user || null
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const productName = body.productName

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 })
    }

    // تنظيف اسم المنتج
    const productNameLower = sanitizeInput(productName, 200).toLowerCase().trim()
    
    if (productNameLower.length === 0) {
      return NextResponse.json({ error: 'اسم المنتج غير صالح' }, { status: 400 })
    }

    let savedNamesDeleted = 0
    let priceHistoryDeleted = 0
    let itemsDeleted = 0

    // حذف من savedProductNames
    try {
      const allSavedNames = await prisma.savedProductName.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      })
      const idsToDelete = allSavedNames
        .filter(s => s.name.toLowerCase().trim() === productNameLower)
        .map(s => s.id)
      
      if (idsToDelete.length > 0) {
        await prisma.savedProductName.deleteMany({ where: { id: { in: idsToDelete } } })
        savedNamesDeleted = idsToDelete.length
      }
    } catch (error) {
      console.error('Error deleting saved names:', error)
      // نستمر حتى لو فشل هذا الجزء
    }

    // حذف من priceHistory
    try {
      const deleted = await prisma.priceHistoryRecord.deleteMany({
        where: { userId: user.id, productName: productNameLower }
      })
      priceHistoryDeleted = deleted.count
    } catch (error) {
      console.error('Error deleting price history:', error)
    }

    // حذف من items
    try {
      const allItems = await prisma.item.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      })
      const itemIds = allItems
        .filter(item => item.name.toLowerCase().trim() === productNameLower)
        .map(item => item.id)
      
      if (itemIds.length > 0) {
        const deleted = await prisma.item.deleteMany({ where: { id: { in: itemIds } } })
        itemsDeleted = deleted.count
      }
    } catch (error) {
      console.error('Error deleting items:', error)
    }

    return NextResponse.json({ 
      success: true, 
      deleted: { savedNames: savedNamesDeleted, priceHistory: priceHistoryDeleted, items: itemsDeleted } 
    })
  } catch (error) {
    console.error('Delete suggestion error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الحذف' }, { status: 500 })
  }
}
