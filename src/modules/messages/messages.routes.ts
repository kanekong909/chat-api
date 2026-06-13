import { FastifyInstance } from 'fastify'
import { getMessages } from './messages.service'

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (req, reply, done) => {
    fastify.jwt.verify(req.headers.authorization?.replace('Bearer ', '') || '', (err, decoded) => {
      if (err) return reply.code(401).send({ error: 'No autorizado' })
      ;(req as any).user = decoded
      done()
    })
  })

  fastify.get('/:groupId', async (req, reply) => {
    const { groupId } = req.params as { groupId: string }
    const { cursor } = req.query as { cursor?: string }
    const messages = await getMessages(fastify, groupId, cursor)
    return reply.send(messages)
  })
}