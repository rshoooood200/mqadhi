import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (sessionToken) {
      // حذف الجلسة من قاعدة البيانات
      await prisma.session.deleteMany({
        where: { id: sessionToken }
      })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('session-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
