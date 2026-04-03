import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode, sanitizeInput, validateEmail, checkRateLimit } from '@/lib/auth-utils'

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

// POST - إنشاء دعوة جديدة
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    if (!user.familyId) {
      return NextResponse.json({ error: 'أنت لست عضو في عائلة' }, { status: 400 })
    }

    // التحقق من صلاحية الدعوة
    if (user.familyRole !== 'owner' && user.familyRole !== 'admin') {
      return NextResponse.json({ error: 'ليس لديك صلاحية الدعوة' }, { status: 403 })
    }

    const { email, role = 'member' } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    // التحقق من عدم وجود دعوة سابقة نشطة
    const existingInvitation = await prisma.familyInvitation.findFirst({
      where: {
        familyId: user.familyId,
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() }
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'يوجد دعوة نشطة لهذا البريد بالفعل',
        existingCode: existingInvitation.code
      }, { status: 400 })
    }

    // التحقق من عدم انضمام المستخدم بالفعل
    const existingMember = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingMember?.familyId === user.familyId) {
      return NextResponse.json({ error: 'هذا المستخدم عضو بالفعل في العائلة' }, { status: 400 })
    }

    // إنشاء رمز الدعوة (16 حرف آمن)
    const code = generateInviteCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // صالحة لمدة أسبوع

    const invitation = await prisma.familyInvitation.create({
      data: {
        code,
        email: email.toLowerCase(),
        role,
        familyId: user.familyId,
        invitedBy: user.id,
        expiresAt
      }
    })

    // الحصول على معلومات العائلة
    const family = await prisma.family.findUnique({
      where: { id: user.familyId }
    })

    return NextResponse.json({
      success: true,
      invitation,
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL || ''}/?invite=${code}`,
      familyName: family?.name
    })
  } catch (error) {
    console.error('Create invitation error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// GET - التحقق من رمز الدعوة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'رمز الدعوة مطلوب' }, { status: 400 })
    }

    const invitation = await prisma.familyInvitation.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      include: {
        family: {
          select: { id: true, name: true }
        },
        inviter: {
          select: { name: true, avatar: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ 
        valid: false, 
        error: 'رمز الدعوة غير صالح أو منتهي' 
      }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        code: invitation.code,
        email: invitation.email,
        role: invitation.role,
        familyName: invitation.family.name,
        inviterName: invitation.inviter.name,
        inviterAvatar: invitation.inviter.avatar
      }
    })
  } catch (error) {
    console.error('Verify invitation error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
