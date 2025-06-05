import { FastifyInstance } from 'fastify'

// Import route modules
import healthRoutes from './health.routes'
import userRoutes from './users.routes'
import gameRoutes from './game.routes'
import authRoutes from './auth.routes'

export async function registerRoutes(app: FastifyInstance) {
  // Health check routes (no prefix - accessible at root)
  await app.register(healthRoutes)

  // API routes with /api prefix
  await app.register(async function (fastify) {
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(userRoutes)
    await fastify.register(gameRoutes)
  }, { prefix: '/api' })

  console.log('✅ Routes registered')
}