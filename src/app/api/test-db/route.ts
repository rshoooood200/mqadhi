import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    const result = await prisma.$queryRaw`SELECT 1 as test`

    // عدد المستخدمين
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'connected',
      test: result,
      userCount,
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
      directUrl: process.env.DIRECT_DATABASE_URL ? 'set' : 'missing'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      status: 'error',
      error: errorMessage,
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
      directUrl: process.env.DIRECT_DATABASE_URL ? 'set' : 'missing'
    }, { status: 500 })
  }
}
