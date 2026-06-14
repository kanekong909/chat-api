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

  // Obtener perfil propio
  fastify.get('/me', async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.code(401).send({ error: 'No autorizado' })

    const decoded = fastify.jwt.verify(token) as { id: string }
    const user = await fastify.prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, avatar: true, phone: true, nationality: true, bio: true }
    })
    return reply.send(user)
  })

  // Actualizar perfil
  fastify.put('/me', async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return reply.code(401).send({ error: 'No autorizado' })

    const decoded = fastify.jwt.verify(token) as { id: string }
    const body = req.body as {
      username?: string
      phone?: string
      nationality?: string
      bio?: string
      avatar?: string
    }

    // Verificar que el username no esté tomado
    if (body.username) {
      const existing = await fastify.prisma.user.findUnique({
        where: { username: body.username }
      })
      if (existing && existing.id !== decoded.id) {
        return reply.code(400).send({ error: 'Ese nombre de usuario ya está en uso' })
      }
    }

    const user = await fastify.prisma.user.update({
      where: { id: decoded.id },
      data: body,
      select: { id: true, username: true, email: true, avatar: true, phone: true, nationality: true, bio: true }
    })
    return reply.send(user)
  })
}