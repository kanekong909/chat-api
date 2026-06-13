import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'

export async function registerUser(fastify: FastifyInstance, data: {
  username: string
  email: string
  password: string
}) { 
  const hashed = await bcrypt.hash(data.password, 10)
  const user = await fastify.prisma.user.create({
    data: { ...data, password: hashed },
    select: { id: true, username: true, email: true }
  })
  return user
}

export async function loginUser(fastify: FastifyInstance, data: {
  email: string
  password: string
}) {
  const user = await fastify.prisma.user.findUnique({ where: { email: data.email } })
  if (!user) throw new Error('Usuario no encontrado')

  const valid = await bcrypt.compare(data.password, user.password)
  if (!valid) throw new Error('Contraseña incorrecta')

  const token = fastify.jwt.sign({ id: user.id, username: user.username })
  return { token, user: { id: user.id, username: user.username, email: user.email } }
}