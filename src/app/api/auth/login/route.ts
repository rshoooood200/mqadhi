import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateSessionToken, checkRateLimit } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // الحصول على IP للمستخدم للـ rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const rateLimitKey = `login:${ip}`
    
    // التحقق من Rate Limiting
    const rateCheck = checkRateLimit(rateLimitKey, 10, 300000) // 10 محاولات كل 5 دقائق
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      return NextResponse.json({ 
        error: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${retryAfter} ثانية`,
        retryAfter 
      }, { 
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      })
    }

    const body = await request.json()
    const { email, password } = body

    // التحقق من وجود البيانات
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // التحقق من طول المدخلات
    if (email.length > 255 || password.length > 128) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // عدم كشف ما إذا كان البريد مسجل أم لا (security best practice)
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // التحقق من كلمة المرور (تدعم الطريقتين القديمة والجديدة)
    const passwordResult = await verifyPassword(password, user.password)
    
    if (!passwordResult.isValid) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // 🔄 ترحيل كلمة المرور للطريقة الجديدة إذا كانت قديمة
    if (passwordResult.needsRehash && passwordResult.newHash) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: passwordResult.newHash }
        })
        console.log(`✅ تم ترحيل كلمة المرور للمستخدم: ${user.email}`)
      } catch (rehashError) {
        // لا نفشل تسجيل الدخول إذا فشل الترحيل
        console.error('Failed to rehash password:', rehashError)
      }
    }

    // 🧹 تنظيف الجلسات المنتهية صلاحيتها
    try {
      await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      })
    } catch {
      // تجاهل أخطاء التنظيف
    }

    // إنشاء جلسة جديدة
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

    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 })
  }
}
