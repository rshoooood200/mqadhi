import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, validatePasswordStrength, sanitizeInput, validateEmail } from '@/lib/auth-utils'

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

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // التحقق من كلمة المرور الحالية إذا كان هناك تغيير في البيانات الحساسة
    if (email || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'يجب إدخال كلمة المرور الحالية للتغييرات الحساسة' }, { status: 400 })
      }

      // التحقق من كلمة المرور
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
      })

      if (!fullUser) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }

      const passwordResult = await verifyPassword(currentPassword, fullUser.password)
      if (!passwordResult.isValid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
      }
    }

    // تحديث الاسم
    if (name && name !== user.name) {
      const sanitizedName = sanitizeInput(name, 100)
      await prisma.user.update({
        where: { id: user.id },
        data: { name: sanitizedName }
      })
    }

    // تحديث البريد الإلكتروني
    if (email && email !== user.email) {
      const sanitizedEmail = email.toLowerCase().trim()
      
      if (!validateEmail(sanitizedEmail)) {
        return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 })
      }

      // التحقق من عدم وجود البريد مسبقاً
      const existingUser = await prisma.user.findUnique({
        where: { email: sanitizedEmail }
      })

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { email: sanitizedEmail }
      })
    }

    // تحديث كلمة المرور
    if (newPassword) {
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        return NextResponse.json({ error: passwordValidation.errors[0] }, { status: 400 })
      }

      const hashedPassword = await hashPassword(newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
    }

    // جلب البيانات المحدثة
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 })
  }
}

// حذف الحساب
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'يجب إدخال كلمة المرور للتأكيد' }, { status: 400 })
    }

    // التحقق من كلمة المرور
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!fullUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const passwordResult = await verifyPassword(password, fullUser.password)
    if (!passwordResult.isValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 400 })
    }

    // حذف جميع بيانات المستخدم (cascade سيحذف الباقي تلقائياً)
    await prisma.session.deleteMany({
      where: { userId: user.id }
    })

    await prisma.user.delete({
      where: { id: user.id }
    })

    const response = NextResponse.json({ success: true })
    response.cookies.delete('session-token')

    return response
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الحساب' }, { status: 500 })
  }
}
