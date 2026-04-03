import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, findUserByEmail, verifyPassword, hashPassword, findUserById } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { name, email, currentPassword, newPassword } = await request.json()

    // التحقق من كلمة المرور الحالية إذا كان هناك تغيير في البيانات الحساسة
    if (email || newPassword) {
      const fullUser = findUserById(user.id)
      if (!fullUser) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }
    }

    // تحديث الاسم
    if (name && name !== user.name) {
      db.prepare('UPDATE users SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(name, user.id)
    }

    // تحديث البريد الإلكتروني
    if (email && email !== user.email) {
      // التحقق من عدم وجود البريد مسبقاً
      const existingUser = findUserByEmail(email)
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 })
      }
      db.prepare('UPDATE users SET email = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(email, user.id)
    }

    // تحديث كلمة المرور
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'يجب إدخال كلمة المرور الحالية' }, { status: 400 })
      }

      const fullUser = findUserById(user.id)
      if (!fullUser) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }

      // التحقق من كلمة المرور الحالية
      const fullUserWithPassword = db.prepare('SELECT password FROM users WHERE id = ?').get(user.id) as { password: string }
      const isValid = await verifyPassword(currentPassword, fullUserWithPassword.password)
      if (!isValid) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
      }

      const hashedPassword = await hashPassword(newPassword)
      db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, user.id)
    }

    // جلب البيانات المحدثة
    const updatedUser = findUserById(user.id)

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
    const fullUser = db.prepare('SELECT password FROM users WHERE id = ?').get(user.id) as { password: string }
    const isValid = await verifyPassword(password, fullUser.password)
    if (!isValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 400 })
    }

    // حذف جميع بيانات المستخدم
    db.prepare('DELETE FROM items WHERE userId = ?').run(user.id)
    db.prepare('DELETE FROM custom_stores WHERE userId = ?').run(user.id)
    db.prepare('DELETE FROM budgets WHERE userId = ?').run(user.id)
    db.prepare('DELETE FROM price_history WHERE userId = ?').run(user.id)
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الحساب' }, { status: 500 })
  }
}
