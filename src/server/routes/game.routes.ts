import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GameInstance } from '../game/gameInstance';
import { handleStartGame, handleMove } from '../utils/PongGame/handlePongHTTP.utils';
import { handlePongWebSocket } from '../utils/PongGame/handlePongWebSocket.utils';
import { handleGetGame } from '../utils/PongGame/handleGetGameState.utils';

// On stocke toutes les parties actives dans cette Map
export const gamesMap: Map<string, GameInstance> = new Map();

export async function registerPongWebSocket(fastify: FastifyInstance) {
  // 1) Route WebSocket
  fastify.get(
    '/ws/pong/:gameId',
    { websocket: true },
    (connection: any, req: any) => {
      handlePongWebSocket(connection, req);
    }
  );

  // 2) Route HTTP POST /api/game/start
  fastify.post('/start', handleStartGame);

  // 3) Route HTTP GET /api/game/:gameId
  fastify.get('/:gameId', handleGetGame);

  // 4) Route HTTP POST /api/game/move
  fastify.post('/move', handleMove);
}
