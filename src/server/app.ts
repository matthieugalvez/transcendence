import Fastify from 'fastify'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './configs/database.js'

// Import API route modules
import healthRoutes from './api/health.js'
import userRoutes from './api/users.js'
import gameRoutes from './api/game.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: true
})

async function setupServer() {
  await initializeDatabase()

  // Register static files
  await fastify.register(import('@fastify/static'), {
    root: join(__dirname, '../dist'),
    prefix: '/',
  })

  // Enregistre les modules API(routes) sur cette instance de fastify (une instance = un serveur);
  await fastify.register(healthRoutes)  // Health check routes
  await fastify.register(userRoutes)    // User management routes
  await fastify.register(gameRoutes)    // Game-related routes
}

const start = async () => {
  try {
    await setupServer()
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()