import { FastifyRequest, FastifyReply } from 'fastify'
import { GameService } from '../services/game.service.js'
import { ResponseUtils as Send } from '../utils/response.utils.js'
import { GameCleanupService } from '../services/gamecleanup.service.js'

export class GameController {
	static async getGameStatus(request: FastifyRequest, reply: FastifyReply) {
		try {
			const statusData = await GameService.getGameStatus()
			return Send.success(reply, statusData, 'Game status retrieved')
		} catch (error) {
			console.error('Game status error:', error)
			return Send.internalError(reply, 'Failed to get game status')
		}
	}

	static async startGame(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { player1Id, player2Id } = request.body as { player1Id: string, player2Id: string }
			const gameData = await GameService.startGame(player1Id, player2Id)
			return Send.created(reply, gameData, 'Game started successfully')
		} catch (error) {
			console.error('Start game error:', error)
			return Send.internalError(reply, 'Failed to start game')
		}
	}

	static async getGame(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { id } = request.params as { id: string }
			const gameData = await GameService.getGameById(id)

			if (!gameData) {
				return Send.notFound(reply, 'Game not found')
			}

			return Send.success(reply, gameData, 'Game retrieved successfully')
		} catch (error) {
			console.error('Get game error:', error)
			return Send.internalError(reply, 'Failed to get game')
		}
	}

	static async cleanupGame(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { gameId, mode } = request.body as { gameId: string; mode: string };

			if (!userId || !gameId) {
				return Send.badRequest(reply, 'Missing required fields');
			}

			const result = await GameCleanupService.cleanupGameAndInvites(gameId, userId);
			const { success, ...restResult } = result;

			return Send.success(reply, restResult, 'Game cleaned up successfully');
		} catch (error) {
			console.error('Game cleanup error:', error);
			return Send.internalError(reply, 'Failed to cleanup game');
		}
	}
}