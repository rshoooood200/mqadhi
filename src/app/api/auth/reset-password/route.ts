import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// تشفير كلمة المرور
const hashPassword = (password: string): string => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36) + randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // التحقق من الرمز
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 })
    }

    // التحقق من صلاحية الرمز
    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      return NextResponse.json({ error: 'رمز التحقق منتهي الصلاحية' }, { status: 400 })
    }

    // تحديث كلمة المرور
    const hashedPassword = hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationCode: null,
        verificationExpires: null,
        isVerified: true
      }
    })

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
