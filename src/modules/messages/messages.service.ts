import type { FastifyInstance } from 'fastify'

export async function getMessages(fastify: FastifyInstance, groupId: string, cursor?: string) {
  return fastify.prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 40,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { sender: { select: { id: true, username: true, avatar: true } } }
  })
}

export async function saveMessage(fastify: FastifyInstance, data: {
  content?: string
  fileUrl?: string
  fileType?: string
  senderId: string
  groupId: string
}) {
  return fastify.prisma.message.create({
    data,
    include: { sender: { select: { id: true, username: true, avatar: true } } }
  })
}