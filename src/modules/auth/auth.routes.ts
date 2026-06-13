import { FastifyInstance } from 'fastify'
import { registerUser, loginUser } from './auth.service'

export default async function authRoutes(fastify: FastifyInstance) {
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