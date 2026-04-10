import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    console.log('Test login attempt:', { email, hasPassword: !!password })
    
    // Step 1: Check database connection
    let dbTest = 'ok'
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError: any) {
      dbTest = `failed: ${dbError.message}`
      return NextResponse.json({
        step: 'database_connection',
        error: dbTest,
        details: dbError.message
      }, { status: 500 })
    }
    
    // Step 2: Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    
    if (!user) {
      return NextResponse.json({
        step: 'find_user',
        status: 'user_not_found',
        email: email.toLowerCase().trim(),
        database: dbTest
      }, { status: 401 })
    }
    
    // Step 3: Verify password
    const passwordResult = await verifyPassword(password, user.password)
    
    return NextResponse.json({
      step: 'password_check',
      status: passwordResult.isValid ? 'success' : 'invalid_password',
      database: dbTest,
      userFound: true,
      email: user.email,
      name: user.name,
      passwordValid: passwordResult.isValid,
      needsRehash: passwordResult.needsRehash,
      hashType: user.password.startsWith('$2') ? 'bcrypt' : 'old_hash'
    })
    
  } catch (error: any) {
    console.error('Test login error:', error)
    return NextResponse.json({
      step: 'unknown_error',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
