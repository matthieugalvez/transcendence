import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'


//Health check, si on s'y connecte l'API fonctionne
// Repond aux requetes GET envoyes a /api/health

export default async function healthRoutes(fastify: FastifyInstance) {
  // GET /api/health - Health check endpoint
  fastify.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })
}