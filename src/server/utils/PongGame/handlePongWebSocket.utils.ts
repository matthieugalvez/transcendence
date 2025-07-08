import type { WebSocket } from 'ws';
import { addPlayerToRoom, getGameRoom, createGameRoom } from '../../game/gameRooms.js'; // Add createGameRoom import
import { GameInstance } from '../../game/gameInstance.js'; // Add .js extension
import { getTournamentRoom, createTournamentRoom, removeTournamentRoom } from '../../game/tournamentRooms.js';
import { prisma } from '../../db.js'
import { InviteService } from '../../services/invite.service.js';

function attachMessageHandler(ws: WebSocket, game: GameInstance) {
	ws.on('message', (data: string) => {
		try {
			const msg = JSON.parse(data);
			// console.log('Received message:', msg); // Debug log

			if (msg.action === 'start') return game.start();
			if (msg.action === 'pause') return game.pause();
			if (msg.action === 'resume') return game.resume();
			if (msg.action === 'difficulty' && msg.difficulty) {
				return game.setDifficulty(msg.difficulty);
			}

			// Handle player input with playerId from message
			if (msg.action === 'up' || msg.action === 'down') {
				if (msg.playerId) {
					// console.log(`Player ${msg.playerId} action: ${msg.action}`); // Debug log
					return game.onClientAction(msg.playerId, msg.action);
				} else {
					// Fallback: determine playerId from WebSocket
					const playerId = game.getPlayerIdByWebSocket(ws);
					if (playerId) {
						// console.log(`Player ${playerId} action: ${msg.action} (from WS)`); // Debug log
						// console.log(`Player ${playerId} action: ${msg.action} (from WS)`); // Debug log
						return game.onClientAction(playerId, msg.action);
					}
				}
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
		} catch { }
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
	const username = req.query.username as string | undefined;

	const invites = await InviteService.getGameInvites(gameId);
	console.log('Invite expiresAt:', invites.map(i => i.expiresAt), 'Now:', new Date());
	console.log('All invites:', invites.map(i => ({
		inviter: i.inviter?.displayName,
		invitee: i.invitee?.displayName,
		status: i.status,
		expiresAt: i.expiresAt
	})));

	// Check if this user was invited to this game
	const userWasInvited = invites.some(invite =>
		invite.invitee?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
	);

	console.log('userWasInvited:', userWasInvited, 'for username:', username);

	// Check if this user is the game creator (inviter)
	const userIsCreator = invites.some(invite =>
		invite.inviter?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
	);

	console.log('userIsCreator:', userIsCreator, 'for username:', username);

	// Only check invite validity for invited users (not creators)
	if (userWasInvited && !userIsCreator) {
		const userInvite = invites.find(invite =>
			invite.invitee?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase() &&
			(invite.status === 'pending' || invite.status === 'accepted') &&
			invite.expiresAt > new Date()
		);

		console.log('userInvite found:', userInvite);

		if (!userInvite) {
			console.log('No valid invite found - checking why:');
			const allUserInvites = invites.filter(i =>
				i.invitee?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
			);
			console.log('All invites for this user:', allUserInvites.map(i => ({ status: i.status, expiresAt: i.expiresAt })));

			ws.send(JSON.stringify({
				type: 'error',
				error: 'invite_expired',
				message: 'Your invite has expired. You have been removed from the game.'
			}));
			ws.close();
			console.log('Invite expired so this was called');
			return;
		}
	}


	if (mode === 'tournament') {
		let tour = getTournamentRoom(gameId);
		if (!tour) {
			tour = createTournamentRoom(gameId, 'MEDIUM');
		}
		const username = req.query.username as string | undefined;
		const role = await tour.addClient(ws, username);

		// Handle already_joined for tournament
		if (role === 'already_joined') {
			ws.send(JSON.stringify({
				type: 'error',
				error: 'already_joined',
				message: 'You are already in this tournament'
			}));
			ws.close();
			return;
		}

		ws.send(JSON.stringify({ type: 'playerToken', playerId: role, playerToken: '' }));
		attachTournamentHandler(ws, tour, role);
		return;
	}

	// 1.1 Récupérer ou créer l'instance GameInstance
	let game = getGameRoom(gameId);
	if (!game) {
		// Check if this game was created via invite
		const gameInvites = await prisma.gameInvite.findMany({
			where: { gameId, status: 'pending' }
		});

		const inviterId = gameInvites.length > 0 ? gameInvites[0].inviterId : undefined;

		// Create the game room with inviter tracking
		game = createGameRoom(gameId, 'MEDIUM', inviterId);
	}

	ws.on('close', () => {
		console.log(`WebSocket closed for user ${username} in game ${gameId}`);

		if (game && username) {
			const userIsInviter = invites.some(invite =>
				invite.inviter?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
			);

			if (userIsInviter && !game.getCurrentState().isRunning) {
				console.log(`Inviter ${username} left before game started, triggering cleanup`);
				const inviterInvite = invites.find(invite =>
					invite.inviter?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
				);
				if (inviterInvite) {
					import('../../services/gamecleanup.service.js').then(({ GameCleanupService }) => {
						GameCleanupService.cleanupGameAndInvites(gameId, inviterInvite.inviterId);
					}).catch(error => { });
				}
			}
		}

		// --- Add this block for tournaments ---
		if (mode === 'tournament') {
			const tour = getTournamentRoom(gameId);
			const userIsInviter = invites.some(invite =>
				invite.inviter?.displayName?.trim().toLowerCase() === username?.trim().toLowerCase()
			);
			if (tour && userIsInviter) {
				tour.endTournamentAndKickAll("Host left, tournament cancelled");
				removeTournamentRoom(gameId);
			}
		}
	});

	// // 1.2 En cas de deco, essayer de reconnecter le joueur
	if (playerToken && game) {
		const success = game.tryReconnectPlayer(playerToken, ws);
		if (!success) {
			ws.send(JSON.stringify({ type: 'error', error: 'invalid_token', clearCookies: true }));
			ws.close();
			return;
		}
		console.log("Attaching message handler for game", gameId);
		attachMessageHandler(ws, game);
		console.log("We are here");
		return;
	}

	// 1.3 Ajouter ce client dans l'instance
	if (game) {
		// let username = req.query.username as string | undefined;
		let role = addPlayerToRoom(gameId, ws, username);

		// Handle already_joined for duo games
		if (role === 'already_joined') {
			ws.send(JSON.stringify({
				type: 'error',
				error: 'already_joined',
				message: 'You are already in this game'
			}));
			ws.close();
			return;
		}

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

		attachMessageHandler(ws, game);
	}
}