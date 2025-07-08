import type { FastifyReply, FastifyRequest } from 'fastify';
import { getGameRoom } from '../../game/gameRooms.js';

/** Envoi le state actuel du jeu */
export async function handleGetGame(request: FastifyRequest, reply: FastifyReply) {
  const { gameId } = request.params as { gameId: string };
  const game = getGameRoom(gameId);
  if (!game) {
    return reply.code(404).send({ success: false, error: 'Game not found' });
  }
  const state = game.getCurrentState();
  return reply.send({ success: true, state });
}