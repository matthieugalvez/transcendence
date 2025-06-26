import type { FastifyInstance } from 'fastify';
import { handleStartGame, handleMove, handleStartTournament } from '../utils/PongGame/handlePongHTTP.utils.js';
import { handlePongWebSocket } from '../utils/PongGame/handlePongWebSocket.utils.js';
import { handleGetGame } from '../utils/PongGame/handleGetGameState.utils.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

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

	// 3) Route HTTP POST /api/game/tournament/start (PROTECTED)
	fastify.post('/tournament/start', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleStartTournament);

	// 4) Route HTTP GET /api/game/:gameId (PROTECTED)
	fastify.get('/:gameId', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleGetGame);

	// 5) Route HTTP POST /api/game/move (PROTECTED)
	fastify.post('/move', {
		preHandler: AuthMiddleware.authenticateUser
	}, handleMove);
}
