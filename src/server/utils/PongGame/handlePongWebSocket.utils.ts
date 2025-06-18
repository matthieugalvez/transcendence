import type { WebSocket } from 'ws';
import { addPlayerToRoom, createGameRoom, getGameRoom } from '../../game/gameRooms';

/** Gere jeu via websocket (pour site web) */
export function handlePongWebSocket(ws: WebSocket, req: any) {
  const gameId = req.params.gameId;
  const playerToken = req.query.playerToken as string | undefined;

  // 1.1 Récupérer ou créer l’instance GameInstance
  let game = getGameRoom(gameId);
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', error: 'game_not_found' }));
    ws.close();
    return;
  }

  // 1.2 En cas de deco, essayer de reconnecter le joueur
  if (playerToken) {
    const success = game.tryReconnectPlayer(playerToken, ws);
    if (!success) {
        ws.send(JSON.stringify({ type: 'error', error: 'invalid_token' }));
        ws.close();
    }
    return;
  }

  // 1.3 Ajouter ce client dans l’instance
  let role = addPlayerToRoom(gameId, ws);
  if (role == null) {
    ws.send(JSON.stringify({ type: 'error', error: 'game_not_found' }));
    ws.close();
    return;
  }
  const token = game.assignTokenToPlayer(role);
  ws.send(JSON.stringify({ type: 'playerToken', playerId: role, playerToken: token }));

  // 1.4 Quand on reçoit un message WS, on l’interprète
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data);
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
  // 1.5 La destruction de l’instance se fera automatiquement quand il n’y a plus de sockets
}