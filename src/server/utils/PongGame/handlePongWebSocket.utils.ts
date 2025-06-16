import type { WebSocket } from 'ws';
import { addPlayerToRoom, createGameRoom, getGameRoom } from '../../game/gameRooms';

/** Gere jeu via websocket (pour site web) */
export function handlePongWebSocket(ws: WebSocket, req: any) {
  // const ws = connection.socket;
  const gameId = req.params.gameId;
  // const { gameId } = req.params as { gameId: string };

  // 1.1 Récupérer ou créer l’instance GameInstance
  let game = getGameRoom(gameId);
  if (!game) {
    game = createGameRoom(gameId);
  }

  // 1.2 Ajouter ce client dans l’instance (player ou spectator)
  // game.addPlayer(ws);
  let role = addPlayerToRoom(gameId, ws); // number (1, 2) ou 'spectator'
  if (role == null) {
    ws.send(JSON.stringify({ type: 'error', error: 'game_not_found' }));
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: 'playerId', playerId: role }));

  // 1.3 Quand on reçoit un message WS, on l’interprète
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data);
      if (role === 'spectator') return; // spectateur peuvent pas agir dans la room
      if (msg.action === 'start') {
        game.start(); // demarre partie
        return;
      }
      if (msg.action === 'pause') {
        game.pause(); // pause partie
        return;
      }
      if (msg.action === 'resume') {
        game.resume(); // reprend partie
        return;
      }
      if (msg.action === 'difficulty' && msg.difficulty) {
        game.setDifficulty(msg.difficulty);
        return;
      }
      if (msg.action === 'up' || msg.action === 'down') {
        game.onClientAction(msg.playerId, msg.action);
        return;
      }
    } catch (err) {
      console.error('WS message parse error:', err);
    }
  });
  // 1.4 La destruction de l’instance se fera automatiquement quand il n’y a plus de sockets
}