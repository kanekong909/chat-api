import type { FastifyInstance } from 'fastify'

// Crear grupo normal o chat privado 1-a-1
export async function createGroup(fastify: FastifyInstance, data: {
  name: string
  isPrivate: boolean
  memberIds: string[]
  creatorId: string
}) {
  const group = await fastify.prisma.group.create({
    data: {
      name: data.name,
      isPrivate: data.isPrivate,
      members: {
        create: [
          { userId: data.creatorId, role: 'admin' },
          ...data.memberIds
            .filter(id => id !== data.creatorId)
            .map(id => ({ userId: id, role: 'member' }))
        ]
      }
    },
    include: { members: { include: { user: { select: { id: true, username: true, avatar: true } } } } }
  })
  return group
}

export async function getUserGroups(fastify: FastifyInstance, userId: string) {
  return fastify.prisma.group.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatar: true } }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, username: true } }
        }
      }
    }
  })
}