import { FastifyInstance } from 'fastify'
import { createGroup, getUserGroups } from './groups.service'

export default async function groupRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (req, reply, done) => {
    fastify.jwt.verify(req.headers.authorization?.replace('Bearer ', '') || '', (err, decoded) => {
      if (err) return reply.code(401).send({ error: 'No autorizado' })
      ;(req as any).user = decoded
      done()
    })
  })

  fastify.post('/', async (req, reply) => {
    const user = (req as any).user
    const body = req.body as { name: string; isPrivate: boolean; memberIds: string[] }
    const group = await createGroup(fastify, { ...body, creatorId: user.id })
    return reply.code(201).send(group)
  })

  fastify.get('/mine', async (req, reply) => {
    const user = (req as any).user
    const groups = await getUserGroups(fastify, user.id)
    return reply.send(groups)
  })
}