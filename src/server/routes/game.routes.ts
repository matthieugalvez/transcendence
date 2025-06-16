import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GameInstance } from '../game/gameInstance';
import { handleStartGame, handleMove } from '../utils/PongGame/handlePongHTTP.utils';
import { handlePongWebSocket } from '../utils/PongGame/handlePongWebSocket.utils';
import { handleGetGame } from '../utils/PongGame/handleGetGameState.utils';
import AuthMiddleware from '../middlewares/auth.middleware.ts'

// On stocke toutes les parties actives dans cette Map
export const gamesMap: Map<string, GameInstance> = new Map();

export async function registerPongWebSocket(fastify: FastifyInstance) {
	// 1) Route WebSocket (consider adding auth validation here too)
	fastify.get(
		'/ws/pong/:gameId',
		{ websocket: true },
		(connection: any, req: any) => {
			handlePongWebSocket(connection, req);
		}
	);

	// 2) Route HTTP POST /api/game/start (PROTECTED)
	fastify.post('/start', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleStartGame);

	// 3) Route HTTP GET /api/game/:gameId (PROTECTED)
	fastify.get('/:gameId', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleGetGame);

	// 4) Route HTTP POST /api/game/move (PROTECTED)
	fastify.post('/move', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleMove);
}