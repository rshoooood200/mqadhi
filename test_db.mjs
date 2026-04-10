import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const count = await prisma.user.count()
    console.log('✅ الاتصال ناجح! عدد المستخدمين:', count)
  } catch (error) {
    console.log('❌ فشل الاتصال:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
