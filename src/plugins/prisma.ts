import fp from 'fastify-plugin'
import { Pool } from 'pg'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: any
  }
}

export default fp(async (fastify) => {
  // Importación dinámica para que funcione después del generate
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as any)

  await prisma.$connect()
  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})