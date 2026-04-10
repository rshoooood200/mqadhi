import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing database connection...')
    
    // Try to count users
    const userCount = await prisma.user.count()
    console.log('Users count:', userCount)
    
    // Try to find a user
    const users = await prisma.user.findMany({
      take: 3,
      select: { id: true, email: true, name: true }
    })
    console.log('Sample users:', users)
    
  } catch (error) {
    console.error('Database error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
