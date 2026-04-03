import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateSessionToken, validatePasswordStrength, validateEmail, sanitizeInput, checkRateLimit } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // الحصول على IP للمستخدم للـ rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const rateLimitKey = `register:${ip}`
    
    // التحقق من Rate Limiting
    const rateCheck = checkRateLimit(rateLimitKey, 5, 3600000) // 5 محاولات كل ساعة
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      return NextResponse.json({ 
        error: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${Math.ceil(retryAfter / 60)} دقيقة`,
        retryAfter 
      }, { 
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      })
    }

    const body = await request.json()
    const { name, email, password } = body

    // التحقق من وجود البيانات
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    // تنظيف المدخلات
    const sanitizedName = sanitizeInput(name, 100)
    const sanitizedEmail = email.toLowerCase().trim()

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 })
    }

    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.errors[0] }, { status: 400 })
    }

    // التحقق من عدم وجود الحساب
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 })
    }

    // تشفير كلمة المرور باستخدام bcrypt
    const hashedPassword = await hashPassword(password)

    // إنشاء الحساب
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
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
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    })

    // تعيين كوكي الجلسة
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // تم تحسينه من 'lax' إلى 'strict'
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء الحساب' }, { status: 500 })
  }
}
