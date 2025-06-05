import { FastifyRequest, FastifyReply } from 'fastify'
import { GameService } from '../services/game.service'

export class GameController {
  static async getGameStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const statusData = await GameService.getGameStatus()
      return statusData
    } catch (error) {
      console.error('Game status error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to get game status'
      })
    }
  }

  // Future game controller methods
  static async startGame(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { player1Id, player2Id } = request.body as { player1Id: number, player2Id: number }
      const gameData = await GameService.startGame(player1Id, player2Id)
      return gameData
    } catch (error) {
      console.error('Start game error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to start game'
      })
    }
  }

  static async getGame(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const gameData = await GameService.getGameById(id)
      return gameData
    } catch (error) {
      console.error('Get game error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to get game'
      })
    }
  }
}