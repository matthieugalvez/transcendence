import { FastifyInstance } from 'fastify'
import { GameController } from '../controllers/game.controller'

export default async function gameRoutes(fastify: FastifyInstance) {
  // GET /game/status - Get game status (will be /api/game/status)
  fastify.get('/game/status', GameController.getGameStatus)

  // Future game routes:
  // POST /game/start - Start a new game (will be /api/game/start)
  fastify.post('/game/start', GameController.startGame)

  // GET /game/:id - Get game by ID (will be /api/game/:id)
  fastify.get('/game/:id', GameController.getGame)

  // POST /game/move - Make a game move
  // POST /game/score - Update game score
  // etc.
}