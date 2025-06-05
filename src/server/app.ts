import Fastify from 'fastify'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { registerDb } from './db'
import { registerPlugins } from './config/plugins.config'
import { registerRoutes } from './routes/router'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create Fastify instance
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
})

// Server setup function
async function setupServer() {
  try {
    console.log('🔧 Setting up server...')

    // 1. Initialize database connection
    await registerDb(app)

    // 2. Register plugins (static files, CORS, etc.)
    await registerPlugins(app, __dirname)

    // 3. Register all routes
    await registerRoutes(app)

    console.log('✅ Server setup completed')
  } catch (error) {
    console.error('❌ Server setup failed:', error)
    throw error
  }
}

// Start server
async function start() {
  try {
    await setupServer()

    const port = Number(process.env.PORT) || 3000
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })
    console.log(`🚀 Server running on http://${host}:${port}`)

  } catch (error) {
    app.log.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await app.close()
  console.log('✅ Server closed')
  process.exit(0)
})

start()