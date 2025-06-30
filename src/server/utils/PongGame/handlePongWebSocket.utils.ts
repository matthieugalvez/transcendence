import type { WebSocket } from 'ws';
import { addPlayerToRoom, getGameRoom } from '../../game/gameRooms.js';
import { GameInstance } from '../../game/gameInstance';
import { getTournamentRoom, createTournamentRoom } from '../../game/tournamentRooms.js';

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

function attachTournamentHandler(ws: WebSocket, tour: any, playerId: number | 'spectator') {
  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data);
      if (msg.action === 'start' && playerId === 1 && !tour.currentGame) {
        tour.startTournament();
        return;
      }
      tour.forwardMessage(playerId as number, msg);
    } catch {}
  });
  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({ type: 'playersJoined', players: tour.getConnectedPlayerIds() })
    );
  }
}

/** Gere jeu via websocket (pour site web) */
export async function handlePongWebSocket(ws: WebSocket, req: any) {
	console.log("handlePongWebSocket called", req.url);
  const gameId = req.params.gameId;
  const playerToken = req.query.playerToken as string | undefined;
  const mode = req.query.mode as string | undefined;

  if (mode === 'tournament') {
    let tour = getTournamentRoom(gameId);
    if (!tour) {
      tour = createTournamentRoom(gameId, 'MEDIUM');
    }
    const username = req.query.username as string | undefined;
    const role = await tour.addClient(ws, username);
    ws.send(JSON.stringify({ type: 'playerToken', playerId: role, playerToken: '' }));
    attachTournamentHandler(ws, tour, role);
    return;
  }

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
        ws.send(JSON.stringify({ type: 'error', error: 'invalid_token', clearCookies: true }));
        ws.close();
    }
	console.log("Attaching message handler for game", gameId);

    attachMessageHandler(ws, game);
	console.log("We are here");
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
  let token: string | undefined;
  if (typeof role === 'number') {
    token = game.getPlayerToken(role);
    if (!token) {
      token = game.assignTokenToPlayer(role);
    }
  }
  ws.send(JSON.stringify({ type: 'playerToken', playerId: role, playerToken: token }));

  // 1.4 Quand on reçoit un message WS, on l’interprète
  attachMessageHandler(ws, game);
  // 1.5 La destruction de l’instance se fera automatiquement quand il n’y a plus de sockets
}