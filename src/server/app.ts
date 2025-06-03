import Fastify from 'fastify'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase, insertUser, getAllUsers } from './configs/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: true
})

async function setupServer() {
  await initializeDatabase()

  await fastify.register(import('@fastify/static'), {
    root: join(__dirname, '../dist'),
    prefix: '/',
  })

  // Health check for docker
  fastify.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })

  // Simple log name endpoint - now saves to SQLite
  // REPOND AUX REQUETES POST A /api/signup (ctrl+f: /api/signup pour voir le front)
  fastify.post('/api/signup', async (request, reply) => {
    try {
      const { name, password} = request.body as { name: string, password:string }

      if (!name || name.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Name is required'
        })
      }

      if (!password || password.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Password is required'
        })
      }

      // Interaction avec la DB
      const user = await insertUser(name.trim(), password.trim());

      console.log(`👋 Hello, ${name}! Saved to database with ID: ${user.id}`)

      return {
        success: true,
        message: `Account created for: ${name}`,
        user: user,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Database error:', error)

      // Handle duplicate username
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return reply.code(409).send({
          success: false,
          error: 'Username already exists'
        })
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to save name to database'
      })
    }
  })

  // Get all users endpoint
  fastify.get('/api/users', async (request, reply) => {
    try {
      const users = await getAllUsers();
      return {
        success: true,
        users: users,
        count: users.length
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch users'
      })
    }
  })
} // <- This closing brace was missing!

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

start();