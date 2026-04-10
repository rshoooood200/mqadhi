import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const sessionCount = await prisma.session.count()
    
    // Get a sample user (without password)
    const sampleUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true, createdAt: true }
    })
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      stats: {
        users: userCount,
        sessions: sessionCount
      },
      sampleUser: sampleUser ? {
        email: sampleUser.email,
        name: sampleUser.name,
        createdAt: sampleUser.createdAt
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
