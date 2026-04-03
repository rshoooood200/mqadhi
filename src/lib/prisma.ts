import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma with PgBouncer - prepared statements disabled via DATABASE_URL parameter
// Make sure DATABASE_URL ends with ?pgbouncer=true
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
