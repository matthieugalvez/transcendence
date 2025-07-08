import type { WebSocket } from 'ws';
import { GameInstance } from './gameInstance.js';
import { UserService } from '../services/users.service.js';
import { StatsService } from '../services/stats.service.js';
import { ChatService } from '../services/chat.service.js'

export type TournamentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Player {
	id: number;
	username: string;
	userId: string;
	ws: WebSocket | null;
}

export class TournamentRoom {
	private gameId: string;
	private difficulty: TournamentDifficulty;
	private players: Player[] = [
		{ id: 1, username: '', userId: '', ws: null },
		{ id: 2, username: '', userId: '', ws: null },
		{ id: 3, username: '', userId: '', ws: null },
		{ id: 4, username: '', userId: '', ws: null },
	];
	private currentGame: GameInstance | null = null;
	private currentMatch = 0;
	private winners: Player[] = [];
	private currentPlayers: [Player, Player] | null = null;
	private matches: {
		playerOneId: string;
		playerTwoId: string;
		playerOneScore: number;
		playerTwoScore: number;
		winnerId: string;
	}[] = [];

	broadcastPlayerList() {
		const joined = this.players.filter(p => p.ws).map(p => p.id);
		this.broadcastAll(
			JSON.stringify({ type: 'playersJoined', players: joined })
		);
	}

	constructor(gameId: string, difficulty: TournamentDifficulty) {
		this.gameId = gameId;
		this.difficulty = difficulty;
	}

	async addClient(ws: WebSocket, username?: string): Promise<number | 'spectator' | 'already_joined'> {
		if (username) {
			const existingPlayer = this.players.find(p => p.username === username && p.ws);
			if (existingPlayer) {
				console.log(`Player ${username} already in tournament ${this.gameId}`);
				return 'already_joined';
			}
		}

		const slot = this.players.find(p => !p.ws);
		if (slot) {
			slot.ws = ws;
			if (!slot.username) slot.username = username || `Player ${slot.id}`;
			const user = await UserService.getUserByDisplayName(slot.username);
			slot.userId = user?.id ?? '';

			ws.on('close', () => {
				slot.ws = null;
				this.broadcastPlayerList();
			});

			this.broadcastPlayerList();
			return slot.id;
		}

		if (this.currentGame) this.currentGame.addSpectator(ws);
		else ws.send(JSON.stringify({ type: 'playerToken', playerId: 'spectator', playerToken: '' }));
		return 'spectator';
	}

	startTournament() {
		this.currentMatch = 0;
		this.winners = [];
		this.sendTournamentStartNotification();
		this.startMatch();
	}

	private startMatch() {
		let p1: Player, p2: Player, spectators: Player[] = [];
		if (this.currentMatch === 0) {
			p1 = this.players[0];
			p2 = this.players[1];
			spectators = [this.players[2], this.players[3]];
		} else if (this.currentMatch === 1) {
			p1 = this.players[2];
			p2 = this.players[3];
			spectators = [this.players[0], this.players[1]];
		} else {
			p1 = this.winners[0];
			p2 = this.winners[1];
			spectators = this.players.filter(p => p !== p1 && p !== p2);
		}

		this.currentPlayers = [p1, p2];
		this.currentGame = new GameInstance(this.gameId, this.difficulty);
		this.currentGame.onEnd(async (winnerId) => await this.handleMatchEnd(winnerId));

		if (p1.ws) this.currentGame.addClient(p1.ws, p1.username);
		if (p2.ws) this.currentGame.addClient(p2.ws, p2.username);

		spectators.forEach(s => { if (s.ws) this.currentGame!.addSpectator(s.ws); });

		// Send match start notification
		this.broadcastAll(JSON.stringify({
			type: 'matchStart',
			players: [p1.username, p2.username],
			currentMatch: this.currentMatch + 1,
			totalMatches: 3
		}));

		this.broadcastPlayerList();
	}

	private async handleMatchEnd(winnerId: number) {
		if (!this.currentPlayers) return;
		const winner = winnerId === 1 ? this.currentPlayers[0] : this.currentPlayers[1];
		const state = this.currentGame!.getCurrentState();
		const p1 = this.currentPlayers[0];
		const p2 = this.currentPlayers[1];
		this.matches.push({
			playerOneId: p1.userId,
			playerTwoId: p2.userId,
			playerOneScore: state.score1,
			playerTwoScore: state.score2,
			winnerId: winner.userId
		});
		this.broadcastAll(JSON.stringify({
			type: 'matchEnd',
			winner: winner.username,
			score1: state.score1,
			score2: state.score2,
			matchType: 'TOURNAMENT',
		}));

		if (this.currentMatch < 2) {
			this.winners.push(winner);
			this.currentMatch++;

			await this.sendRoundNotification();
			this.startMatch();
		} else {
			try {
				await StatsService.createTournament({
					tournamentId: this.gameId,
					participants: this.players.map(p => p.userId),
					winnerId: winner.userId,
					matches: this.matches
				});
			} catch (e) {
				console.error('[Tournament] save failed', e);
			}
			this.broadcastAll(JSON.stringify({ type: 'tournamentEnd', winner: winner.username }));
		}
	}

	forwardMessage(playerSlot: number, msg: any) {
		if (!this.currentGame || !this.currentPlayers) return;
		const idx = this.currentPlayers.findIndex(p => p.id === playerSlot);
		if (idx === -1) return;
		const pid = idx + 1 as 1 | 2;
		if (msg.action === 'up' || msg.action === 'down') {
			this.currentGame.onClientAction(pid, msg.action);
		} else if (msg.action === 'pause') {
			this.currentGame.pause();
		} else if (msg.action === 'resume') {
			this.currentGame.resume();
		} else if (msg.action === 'start') {
			if (!this.currentGame.getCurrentState().isRunning) this.currentGame.start();
		} else if (msg.action === 'difficulty' && msg.difficulty) {
			this.currentGame.setDifficulty(msg.difficulty);
		}
	}

	private broadcastAll(msg: string) {
		this.players.forEach(p => { if (p.ws && p.ws.readyState === p.ws.OPEN) p.ws.send(msg); });
	}
	getConnectedPlayerIds(): number[] {
		return this.players.filter(p => p.ws).map(p => p.id);
	}

	endTournamentAndKickAll(reason: string = "Host left, tournament cancelled") {
		const payload = JSON.stringify({
			type: 'end',
			reason: 'host_left',
			message: reason,
			shouldRedirect: true,
			forceRedirect: true
		});
		this.players.forEach(p => {
			if (p.ws && p.ws.readyState === p.ws.OPEN) {
				p.ws.send(payload);
				p.ws.close();
			}
		});
		// if (this.currentGame) {
		// 	this.currentGame.destroy();
		// }
	}

	private async sendRoundNotification(): Promise<void> {
		try {
			let roundMessage = '';
			let nextPlayers: [string, string];

			if (this.currentMatch === 1) {
				nextPlayers = [this.players[2].username, this.players[3].username];
				roundMessage = `🎯 Semi-Final 2: ${nextPlayers[0]} vs ${nextPlayers[1]} - Get ready for the next match!`;
			} else if (this.currentMatch === 2) {
				nextPlayers = [this.winners[0].username, this.winners[1].username];
				roundMessage = `🏆 FINAL ROUND: ${nextPlayers[0]} vs ${nextPlayers[1]} - The championship match begins now!`;
			} else {
				return;
			}

			const senderUserId = this.players[0].userId;

			const messagePromises = this.players
				.filter(player => player.userId && player.userId !== senderUserId)
				.map(async (player) => {
					try {
						await ChatService.createMessage(senderUserId, player.userId, roundMessage);
						console.log(`✅ Round notification sent from ${this.players[0].username} to ${player.username}`);
					} catch (error) {
						console.error(`❌ Failed to send round notification to ${player.username}:`, error);
					}
				});

			await Promise.all(messagePromises);
			console.log(`🎯 Round ${this.currentMatch} notifications sent to all players`);
		} catch (error) {
			console.error('❌ Failed to send round notifications:', error);
		}
	}

	private async sendTournamentStartNotification(): Promise<void> {
		try {
			const allPlayerNames = this.players.map(p => p.username).join(', ');
			const tournamentStartMessage = `🏆 TOURNAMENT STARTING NOW! 🏆

			Players: ${allPlayerNames}
			Format: Best of 3 matches
			First Match: ${this.players[0].username} vs ${this.players[1].username}

			Good luck to all participants! 🎮`;

			const senderUserId = this.players[0].userId;

			// Send tournament start message to all other players
			const messagePromises = this.players
				.filter(player => player.userId && player.userId !== senderUserId)
				.map(async (player) => {
					try {
						await ChatService.createMessage(senderUserId, player.userId, tournamentStartMessage);
						console.log(`✅ Tournament start notification sent from ${this.players[0].username} to ${player.username}`);
					} catch (error) {
						console.error(`❌ Failed to send tournament start notification to ${player.username}:`, error);
					}
				});

			await Promise.all(messagePromises);
			console.log('🎯 Tournament start notifications sent to all players');
		} catch (error) {
			console.error('❌ Failed to send tournament start notifications:', error);
		}
	}
}

const tournamentRooms: Map<string, TournamentRoom> = new Map();

export function createTournamentRoom(gameId: string, diff: TournamentDifficulty): TournamentRoom {
	const room = new TournamentRoom(gameId, diff);
	tournamentRooms.set(gameId, room);
	return room;
}
export function getTournamentRoom(gameId: string): TournamentRoom | undefined {
	return tournamentRooms.get(gameId);
}
export function removeTournamentRoom(gameId: string) {
	tournamentRooms.delete(gameId);
}

export { tournamentRooms };
