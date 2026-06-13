import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwtPlugin from '@fastify/jwt'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'

import prismaPlugin from './plugins/prisma'
import redisPlugin from './plugins/redis'
import authRoutes from './modules/auth/auth.routes'
import groupRoutes from './modules/groups/groups.routes'
import messageRoutes from './modules/messages/messages.routes'
import { setupSockets } from './sockets'

const fastify = Fastify({ logger: true })

async function start() {
  await fastify.register(cors, { origin: true })
  await fastify.register(jwtPlugin, { secret: process.env.JWT_SECRET! })
  await fastify.register(prismaPlugin)
  await fastify.register(redisPlugin)

  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(groupRoutes, { prefix: '/api/groups' })
  await fastify.register(messageRoutes, { prefix: '/api/messages' })

  const port = Number(process.env.PORT) || 3000
  await fastify.listen({ port, host: '0.0.0.0' })

  // Socket.IO se adjunta al servidor de Fastify DESPUÉS de que esté escuchando
  const io = new Server(fastify.server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
  })

  // Redis adapter
  const pubClient = new Redis(process.env.REDIS_URL!)
  const subClient = pubClient.duplicate()
  io.adapter(createAdapter(pubClient, subClient))

  setupSockets(io, fastify)

  console.log(`🚀 Server corriendo en puerto ${port}`)
}

start().catch(console.error)