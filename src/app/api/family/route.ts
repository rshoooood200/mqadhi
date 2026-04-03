import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInviteCode, sanitizeInput } from '@/lib/auth-utils'

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

// GET - الحصول على معلومات العائلة
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    // الحصول على معلومات العائلة
    const userWithFamily = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        family: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                familyRole: true
              }
            }
          }
        }
      }
    })

    // الحصول على الدعوات المعلقة
    let invitations = []
    if (userWithFamily?.family) {
      invitations = await prisma.familyInvitation.findMany({
        where: {
          familyId: userWithFamily.family.id,
          status: 'pending',
          expiresAt: { gt: new Date() }
        }
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        familyId: userWithFamily?.familyId,
        familyRole: userWithFamily?.familyRole
      },
      family: userWithFamily?.family ? {
        id: userWithFamily.family.id,
        name: userWithFamily.family.name,
        inviteCode: userWithFamily.family.inviteCode,
        members: userWithFamily.family.members
      } : null,
      invitations
    })
  } catch (error) {
    console.error('Get family error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - إنشاء عائلة جديدة أو الانضمام
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const body = await request.json()
    const { action, familyName, inviteCode } = body

    if (action === 'create') {
      // إنشاء عائلة جديدة
      const inviteCode = generateInviteCode()
      
      const family = await prisma.family.create({
        data: {
          name: familyName || `عائلة ${user.name}`,
          inviteCode,
          members: {
            connect: { id: user.id }
          }
        }
      })

      // تحديث دور المستخدم
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          familyId: family.id,
          familyRole: 'owner'
        }
      })

      return NextResponse.json({
        success: true,
        family: {
          id: family.id,
          name: family.name,
          inviteCode: family.inviteCode
        }
      })
    }

    if (action === 'join') {
      // الانضمام لعائلة عبر كود الدعوة
      const family = await prisma.family.findUnique({
        where: { inviteCode }
      })

      if (!family) {
        return NextResponse.json({ error: 'كود الدعوة غير صحيح' }, { status: 400 })
      }

      // التحقق من عدم انضمام المستخدم مسبقاً
      const existingMember = await prisma.user.findFirst({
        where: {
          id: user.id,
          familyId: family.id
        }
      })

      if (existingMember) {
        return NextResponse.json({ error: 'أنت عضو بالفعل في هذه العائلة' }, { status: 400 })
      }

      // الانضمام للعائلة
      await prisma.user.update({
        where: { id: user.id },
        data: {
          familyId: family.id,
          familyRole: 'member'
        }
      })

      return NextResponse.json({
        success: true,
        family: {
          id: family.id,
          name: family.name
        }
      })
    }

    if (action === 'invite') {
      // إنشاء دعوة جديدة
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { family: true }
      })

      if (!currentUser?.family) {
        return NextResponse.json({ error: 'يجب أن تكون عضواً في عائلة أولاً' }, { status: 400 })
      }

      if (currentUser.familyRole === 'member') {
        return NextResponse.json({ error: 'ليس لديك صلاحية الدعوة' }, { status: 403 })
      }

      const code = generateInviteCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // تنتهي بعد أسبوع

      const invitation = await prisma.familyInvitation.create({
        data: {
          code,
          email: body.email || '',
          familyId: currentUser.family.id,
          invitedBy: user.id,
          role: body.role || 'member',
          expiresAt
        }
      })

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          code: invitation.code,
          expiresAt: invitation.expiresAt
        }
      })
    }

    if (action === 'leave') {
      // مغادرة العائلة
      await prisma.user.update({
        where: { id: user.id },
        data: {
          familyId: null,
          familyRole: 'member'
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error) {
    console.error('Family action error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
