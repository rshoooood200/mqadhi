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

// تشغيل الـ migrations المطلوبة
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    // السماح فقط للمستخدمين المسجلين
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    console.log('🔧 بدء تشغيل الـ migrations...')

    // التحقق من وجود عمود selectedStore
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Item' 
      AND column_name = 'selectedStore'
    `

    const columnExists = Array.isArray(checkColumn) && checkColumn.length > 0

    if (!columnExists) {
      console.log('📝 إضافة عمود selectedStore...')
      await prisma.$executeRaw`
        ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "selectedStore" TEXT
      `
      console.log('✅ تم إضافة عمود selectedStore')
    } else {
      console.log('✅ عمود selectedStore موجود بالفعل')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم تشغيل الـ migrations بنجاح',
      columnAdded: !columnExists
    })

  } catch (error) {
    console.error('Migration error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// GET للتحقق من حالة الـ migrations
export async function GET(request: NextRequest) {
  try {
    // التحقق من وجود عمود selectedStore
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Item' 
      AND column_name = 'selectedStore'
    `

    const columnExists = Array.isArray(checkColumn) && checkColumn.length > 0

    return NextResponse.json({ 
      selectedStoreExists: columnExists,
      status: columnExists ? 'migrated' : 'needs_migration'
    })

  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
