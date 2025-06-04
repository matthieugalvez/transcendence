import Fastify from 'fastify'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase } from './database/database.js'

// Import API route modules
import healthRoutes from './api/health.js'
import userRoutes from './api/users'
import gameRoutes from './api/game'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Declaration de l'instance fastify
const app = Fastify({
  logger: true
})

// Setup une instance fastify et recupere les endpoints API
async function setupServer() {
  await initializeDatabase()

  // Register static files
  await app.register(import('@fastify/static'), {
    root: join(__dirname, '../../dist'),
    prefix: '/',
  })

  // Enregistre les modules API(routes) sur cette instance de fastify (une instance = un serveur);
  await app.register(healthRoutes)  // Health check routes
  await app.register(userRoutes)    // User management routes
  await app.register(gameRoutes)    // Game-related routes
}

// Start le serveur
const start = async () => {
  try {
    await setupServer()
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

// The communication flow is:

// -Frontend (port 5173) → sends POST to /api/signup
// -Vite proxy → forwards to backend (port 3000) OU Docker expose 3000
// -Backend → processes request, hashes password, stores in SQLite
// -Response → sent back to frontend with success/error message