import type { WebSocket } from 'ws';
import { GameInstance } from '../../game/gameInstance';
import { gamesMap } from '../../routes/game.routes'

/** Gere jeu via websocket (pour site web) */
export function handlePongWebSocket(ws: WebSocket, gameId: string) {
  // const ws: WebSocket = connection.socket;
  // const { gameId } = req.params as { gameId: string };

  // 1.1 Récupérer ou créer l’instance GameInstance
  let game = gamesMap.get(gameId);
  if (!game) {
    game = new GameInstance(gameId);
    gamesMap.set(gameId, game);
  }

  // 1.2 Ajouter ce client dans l’instance
  game.addPlayer(ws);

  // 1.3 Quand on reçoit un message WS, on l’interprète comme un déplacement
  ws.on('message', (data: string) => {
    try {
      const { playerId, action } = JSON.parse(data) as { 
        playerId: number;
        action: 'up' | 'down'
      };
      game!.onClientAction(playerId, action);
    } catch (err) {
      console.error('WS message parse error:', err);
    }
  });
  // 1.4 La destruction de l’instance se fera automatiquement quand il n’y a plus de sockets
}