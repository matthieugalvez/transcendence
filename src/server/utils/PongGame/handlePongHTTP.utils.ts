import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { createGameRoom, getGameRoom } from '../../game/gameRooms';

/** Création d’une nouvelle partie via HTTP (pour CLI) */
export async function handleStartGame(request: FastifyRequest, reply: FastifyReply) {
  const gameId = uuidv4();
  let difficulty = (request.body as any)?.difficulty || 'MEDIUM';
  let game = getGameRoom(gameId);
  if (!game) {
    game = createGameRoom(gameId, difficulty);
  }
  return reply.send({ success: true, gameId });
}

/** Démarrer un TOURNOI (4 joueurs) */ 
export async function handleStartTournament(req: FastifyRequest, reply: FastifyReply) {
  const gameId = uuidv4();
  const difficulty = (req.body as any)?.difficulty || 'MEDIUM';
  let game = getGameRoom(gameId);
  if (!game) {
    game = createGameRoom(gameId, difficulty);
  }
  return reply.send({ success: true, gameId });
}

/** Envoi d’un déplacement via HTTP */
export async function handleMove(request: FastifyRequest, reply: FastifyReply) {
  const { gameId, playerId, action } = request.body as {
    gameId: string;
    playerId: 1 | 2;
    action: 'up' | 'down';
  };
  const game = getGameRoom(gameId);
  if (!game) {
    return reply.code(404).send({ success: false, error: 'Game not found' });
  }
  game.onClientAction(playerId, action);
  return reply.send({ success: true });
}