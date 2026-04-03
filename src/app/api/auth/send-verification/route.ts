import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// توليد رمز تحقق من 6 أرقام
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
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

    // توليد رمز تحقق جديد
    const verificationCode = generateVerificationCode()
    const verificationExpires = new Date()
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 10) // صلاحية 10 دقائق

    // حفظ الرمز في قاعدة البيانات
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpires
      }
    })

    // في بيئة التطوير، نرجع الرمز مباشرة
    // في الإنتاج، يجب إرساله بالبريد الإلكتروني
    const isDevelopment = process.env.NODE_ENV !== 'production'

    // محاولة إرسال الإيميل إذا كان هناك إعداد لـ Resend
    let emailSent = false
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'مقاضي <noreply@maqadi.com>',
            to: email,
            subject: 'رمز التحقق - مقاضي',
            html: `
              <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; border-radius: 20px 20px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🏠 مقاضي</h1>
                </div>
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 20px 20px; text-align: center;">
                  <h2 style="color: #1e293b; margin-bottom: 20px;">رمز التحقق الخاص بك</h2>
                  <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <span style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px;">${verificationCode}</span>
                  </div>
                  <p style="color: #64748b; font-size: 14px;">هذا الرمز صالح لمدة 10 دقائق فقط</p>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة</p>
                </div>
              </div>
            `
          })
        })

        if (response.ok) {
          emailSent = true
        }
      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
    })

  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إرسال رمز التحقق' }, { status: 500 })
  }
}
