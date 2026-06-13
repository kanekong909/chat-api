import { FastifyInstance } from 'fastify'
import { registerUser, loginUser } from './auth.service'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/users/search', async (req, reply) => {
    const { q } = req.query as { q: string }
    if (!q || q.length < 2) return reply.send([])

    const users = await fastify.prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' }
      },
      select: { id: true, username: true, avatar: true },
      take: 10
    })
    return reply.send(users)
  })

  fastify.post('/register', async (req, reply) => {
    const body = req.body as { username: string; email: string; password: string }
    const user = await registerUser(fastify, body)
    return reply.code(201).send(user)
  })

  fastify.post('/login', async (req, reply) => {
    const body = req.body as { email: string; password: string }
    const result = await loginUser(fastify, body)
    return reply.send(result)
  })
}