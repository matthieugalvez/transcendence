import type { WebSocket } from 'ws';
import { addPlayerToRoom, createGameRoom, getGameRoom } from '../../game/gameRooms';
import { GameInstance } from '../../game/gameInstance';

function attachMessageHandler(ws: WebSocket, game: GameInstance) {
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data);
      if (msg.action === 'start')      return game.start();
      if (msg.action === 'pause')      return game.pause();
      if (msg.action === 'resume')     return game.resume();
      if (msg.action === 'difficulty' && msg.difficulty) {
        return game.setDifficulty(msg.difficulty);
      }
      if (msg.action === 'up' || msg.action === 'down') {
        return game.onClientAction(msg.playerId, msg.action);
      }
    } catch (err) {
      console.error('WS message parse error:', err);
    }
  });
}

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
    attachMessageHandler(ws, game);
    return;
  }

  // 1.3 Ajouter ce client dans l’instance
  let username = req.query.username as string | undefined;
  let role = addPlayerToRoom(gameId, ws, username);
  if (role == null) {
    ws.send(JSON.stringify({ type: 'error', error: 'game_not_found' }));
    ws.close();
    return;
  }
  let token = game.getPlayerToken(role);
  if (!token) {
    token = game.assignTokenToPlayer(role);
  }
  ws.send(JSON.stringify({ type: 'playerToken', playerId: role, playerToken: token }));

  // 1.4 Quand on reçoit un message WS, on l’interprète
  attachMessageHandler(ws, game);
  // 1.5 La destruction de l’instance se fera automatiquement quand il n’y a plus de sockets
}