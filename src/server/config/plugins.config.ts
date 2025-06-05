import { FastifyInstance } from 'fastify'
import { join } from 'path'

export async function registerPlugins(app: FastifyInstance, dirname: string) {
  // Register static files
  await app.register(import('@fastify/static'), {
    root: join(dirname, '../../dist'),
    prefix: '/',
  })

  // SPA fallback - serve index.html for any non-API routes
  app.setNotFoundHandler(async (request, reply) => {
    // Only handle GET requests that don't start with /api
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      return reply.sendFile('index.html')
    }

    // For API routes or non-GET requests, return 404
    return reply.code(404).send({
      success: false,
      error: 'Route not found'
    })
  })

  // Add CORS if needed
  if (process.env.NODE_ENV !== 'production') {
    await app.register(import('@fastify/cors'), {
      origin: true
    })
  }

  console.log('✅ Plugins registered')
}