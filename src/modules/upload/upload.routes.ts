import { FastifyInstance } from 'fastify'
import { v2 as cloudinary } from 'cloudinary'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export default async function uploadRoutes(fastify: FastifyInstance) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  // Auth guard
  fastify.addHook('onRequest', (req, reply, done) => {
    fastify.jwt.verify(
      req.headers.authorization?.replace('Bearer ', '') || '',
      (err, decoded) => {
        if (err) return reply.code(401).send({ error: 'No autorizado' })
        ;(req as any).user = decoded
        done()
      }
    )
  })

  fastify.post('/image', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'No se recibió archivo' })

    const mime = data.mimetype
    const isImage = mime.startsWith('image/')
    const isVideo = mime.startsWith('video/')
    const isFile = !isImage && !isVideo

    const folder = isImage ? 'chatapp/images' : isVideo ? 'chatapp/videos' : 'chatapp/files'
    const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw'

    const result = await new Promise<{ secure_url: string; resource_type: string }>(
      (resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType },
          (err, result) => {
            if (err || !result) return reject(err)
            resolve(result as any)
          }
        )
        pipeline(data.file as unknown as Readable, upload).catch(reject)
      }
    )

    return reply.send({
      url: result.secure_url,
      type: mime
    })
  })
}