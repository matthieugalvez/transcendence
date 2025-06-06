// import { FastifyInstance } from 'fastify'
// import { GameController } from '../controllers/game.controller'

// export default async function gameRoutes(fastify: FastifyInstance) {
//   // GET /game/status - Get game status (will be /api/game/status)
//   fastify.get('/game/status', GameController.getGameStatus)

//   // Future game routes:
//   // POST /game/start - Start a new game (will be /api/game/start)
//   fastify.post('/game/start', GameController.startGame)

//   // GET /game/:id - Get game by ID (will be /api/game/:id)
//   fastify.get('/game/:id', GameController.getGame)

//   // POST /game/move - Make a game move
//   // POST /game/score - Update game score
//   // etc.
// }

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameInstance } from '../game/game-instance';

// interface FastifyWebsocketRequest extends FastifyRequest {
//   socket: WebSocket;
//   isServer: boolean;
// }

// On stocke toutes les parties actives dans ce Map
const gamesMap: Map<string, GameInstance> = new Map();

export async function registerPongWebSocket(fastify: FastifyInstance) {
  // ---------------
  // VIA WEBSOCKET (/ws/pong/gameId)
  // ---------------
  fastify.get(
    '/ws/pong/:gameId',
    { websocket: true },
    (connection: any, req: any) => {
      const ws: WebSocket = connection.socket;
      const params = req.params as { gameId: string };
      const gameId = params.gameId;

      // 1) Récupérer ou créer l’instance GameInstance
      let game = gamesMap.get(gameId);
      if (!game) {
        game = new GameInstance(gameId);
        gamesMap.set(gameId, game);
      }

      // 2) Ajouter cette WebSocket à la partie
      game.addPlayer(ws);

      // 3) Dès qu’on reçoit un message du client, on interprète l’action
      ws.on('message', (data: string) => {
        // On s’attend à recevoir { playerId: 1 | 2, action: "up" | "down" }
        try {
          const parsed = JSON.parse(data) as {
            playerId: number;
            action: 'up' | 'down';
          };
          const { playerId, action } = parsed;
          game?.onClientAction(playerId, action);
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      });

      // 4) Quand le client ferme, GameInstance s’occupera de se nettoyer
    }
  );

  // ---------------
  // VIA ENDPOINTS POUR CLI : creer nouvelle partie (POST /api/game/start)
  // ---------------
  fastify.post(
    '/start',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // generer ID unique
      const gameId = uuidv4();
      
      // creer instance gameInstance
      const game = new GameInstance(gameId);
      gamesMap.set(gameId, game);

      // repondre au client avec ID
      return reply.send({ success: true, gameId });
    }
  );
  // ---------------
  // VIA ENDPOINTS POUR CLI : envoyer gameState actuel (GET /api/game/:gameId)
  // ---------------
  fastify.get(
    '/:gameId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { gameId } = request.params as { gameId: string };
      const game = gamesMap.get(gameId);
      if (!game) {
        return reply.code(404).send({
          success: false,
          error: 'Game not found',
        });
      }

      // recuperer etat depuis gameInstance
      const state = game.getCurrentState();
      return reply.send({ success: true, state });
    }
  );
  // ---------------
  // VIA ENDPOINTS POUR CLI : envoyer deplacement (POST /api/game/move)
  // ---------------
  fastify.post(
    '/move',
    async(request: FastifyRequest, reply: FastifyReply) => {
      const { gameId, playerId, action } = request.body as {
        gameId: string;
        playerId: 1 | 2;
        action: 'up' | 'down';
      };
      const game = gamesMap.get(gameId);
      if (!game) {
        return reply.code(404).send({
          success: false,
          error: 'Game not found',
        });
      }
      // appliquer mouvement
      game.onClientAction(playerId, action);
      return reply.send({
        success: true,
      });
    }
  );
}
