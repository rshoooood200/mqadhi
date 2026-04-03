import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// توليد رمز الجلسة
const generateSessionToken = () => randomBytes(32).toString('hex')

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني ورمز التحقق مطلوبان' }, { status: 400 })
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'هذا الحساب موثق بالفعل' }, { status: 400 })
    }

    // التحقق من الرمز
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 })
    }

    // التحقق من صلاحية الرمز
    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      return NextResponse.json({ error: 'رمز التحقق منتهي الصلاحية' }, { status: 400 })
    }

    // تحديث المستخدم كموثق
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
      }
    })

    // إنشاء جلسة
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 يوم

    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt
      }
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    })

    // تعيين كوكي الجلسة
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 يوم
    })

    return response

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التحقق' }, { status: 500 })
  }
}
