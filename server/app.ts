import Fastify from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase, insertUser } from './database.js'
import { db } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

async function setupServer() {
  // Initialize SQLite database
  await initializeDatabase()

  // Register static files plugin for serving Vite build
  await fastify.register(import('@fastify/static'), {
    root: path.join(__dirname, '../dist'),
    prefix: '/',
  })

  // Simple log name endpoint - now saves to SQLite
  fastify.post('/api/logname', async (request, reply) => {
    try {
      const { name } = request.body as { name: string }

      if (!name || name.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Name is required'
        })
      }

      // Save to database
      const user = await insertUser(name.trim())

      console.log(`👋 Hello, ${name}! Saved to database with ID: ${user.id}`)

      return {
        success: true,
        message: `Logged name: ${name}`,
        user: user,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Database error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to save name to database'
      })
    }
  })

  //Endpoint for get and .json formatting from GET REQUEST
  fastify.get('/api/users', async (request, reply) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users ORDER BY logged_at DESC', [], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve({ users: rows, count: rows.length })
      }
    })
  })
})

  // SPA fallback - serve index.html for all non-API routes
  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
      reply.code(404).send({ error: 'API endpoint not found' })
    } else {
      // Serve index.html for SPA routing
      return reply.sendFile('index.html')
    }
  })
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