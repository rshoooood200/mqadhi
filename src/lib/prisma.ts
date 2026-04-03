import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// تعطيل prepared statements للعمل مع Supabase Pooler (PgBouncer)
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
    // تعطيل prepared statements مهم للعمل مع PgBouncer
    __internal: {
      engine: {
        connection: {
          pool: {
            enabled: false
          }
        }
      }
    }
  } as any)
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
