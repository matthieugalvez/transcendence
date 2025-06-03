import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'



// Route temporaire, ne sert a rien actuellement

export default async function gameRoutes(fastify: FastifyInstance) {
  // GET /api/game/status - Get game status
  fastify.get('/api/game/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      success: true,
      message: 'Game API is working',
      timestamp: new Date().toISOString()
    }
  })

  // Example de points api possible pour le jeu:
  // POST /api/game/start
  // POST /api/game/move
  // GET /api/game/:id
  // POST /api/game/score
  // etc.
}