import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    // البحث عن الجلسة
    const session = await prisma.session.findFirst({
      where: {
        id: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    })

    if (!session) {
      // تنظيف الجلسات المنتهية الصلاحية
      await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      }).catch(() => {})

      return NextResponse.json({ error: 'الجلسة منتهية' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.avatar
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
