import { FastifyInstance } from 'fastify'
import { registerPongWebSocket } from './game.routes'

// Import route modules
import healthRoutes from './health.routes'
import userRoutes from './users.routes'
import authRoutes from './auth.routes'


export async function registerRoutes(app: FastifyInstance) {
  // Health check routes (no prefix - accessible at root)
  await app.register(healthRoutes)

  // API routes with /api prefix
  await app.register(async function (fastify) {
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(userRoutes, { prefix: '/users' }) // Add /users prefix
    await fastify.register(registerPongWebSocket, { prefix: '/game' });
  }, { prefix: '/api' })

//   await app.register

  	// await app.register(oauth2, googleOAuth2Options);


  console.log('✅ Routes registered')
}