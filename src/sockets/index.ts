import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { saveMessage } from '../modules/messages/messages.service.js'
import jwt from 'jsonwebtoken'

export function setupSockets(io: Server, fastify: FastifyInstance) {
  // Auth middleware para sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('No autorizado'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string }
      socket.data.user = decoded
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user
    console.log(`🔌 ${user.username} conectado`)

    // Unirse a sus grupos
    socket.on('join:groups', (groupIds: string[]) => {
      groupIds.forEach(id => socket.join(id))
    })

    // Enviar mensaje
    socket.on('message:send', async (data: {
      groupId: string
      content?: string
      fileUrl?: string
      fileType?: string
    }) => {
      const message = await saveMessage(fastify, { ...data, senderId: user.id })
      io.to(data.groupId).emit('message:new', message)
    })

    // Indicador de escritura
    socket.on('typing:start', (groupId: string) => {
      socket.to(groupId).emit('typing:update', { userId: user.id, username: user.username, typing: true })
    })

    socket.on('typing:stop', (groupId: string) => {
      socket.to(groupId).emit('typing:update', { userId: user.id, username: user.username, typing: false })
    })

    socket.on('disconnect', () => {
      console.log(`❌ ${user.username} desconectado`)
    })
  })
}