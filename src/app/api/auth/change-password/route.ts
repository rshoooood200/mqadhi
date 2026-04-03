import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// التحقق من كلمة المرور
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hashedPassword.startsWith(hash.toString(36))
}

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // التحقق من كلمة المرور الحالية
    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
    }

    // تحديث كلمة المرور
    const hashedPassword = hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
