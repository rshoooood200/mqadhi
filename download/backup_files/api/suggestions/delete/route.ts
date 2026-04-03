import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const productNameLower = productName.toLowerCase().trim()
    let savedNamesDeleted = 0, priceHistoryDeleted = 0, itemsDeleted = 0

    try {
      const allSavedNames = await prisma.savedProductName.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      })
      const idsToDelete = allSavedNames.filter(s => s.name.toLowerCase().trim() === productNameLower).map(s => s.id)
      if (idsToDelete.length > 0) {
        await prisma.savedProductName.deleteMany({ where: { id: { in: idsToDelete } } })
        savedNamesDeleted = idsToDelete.length
      }
    } catch {}

    try {
      const deleted = await prisma.priceHistoryRecord.deleteMany({
        where: { userId: user.id, productName: productNameLower }
      })
      priceHistoryDeleted = deleted.count
    } catch {}

    try {
      const allItems = await prisma.item.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      })
      const itemIds = allItems.filter(item => item.name.toLowerCase().trim() === productNameLower).map(item => item.id)
      if (itemIds.length > 0) {
        const deleted = await prisma.item.deleteMany({ where: { id: { in: itemIds } } })
        itemsDeleted = deleted.count
      }
    } catch {}

    return NextResponse.json({ success: true, deleted: { savedNames: savedNamesDeleted, priceHistory: priceHistoryDeleted, items: itemsDeleted } })
  } catch (error) {
    console.error('Delete suggestion error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الحذف' }, { status: 500 })
  }
}
