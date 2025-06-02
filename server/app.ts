import Fastify from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

async function setupServer() {
  // Register static files plugin for serving Vite build
  await fastify.register(import('@fastify/static'), {
    root: path.join(__dirname, '../dist'),
    prefix: '/',
  })

  // Simple log name endpoint
  fastify.post('/api/logname', async (request, reply) => {
    const { name } = request.body as { name: string }

    console.log(`👋 Hello, ${name}!`)

    return {
      success: true,
      message: `Logged name: ${name}`,
      timestamp: new Date().toISOString()
    }
  })

  // API Routes
  fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
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