import type { WebSocket } from 'ws';
import type { GameState } from '../types/game.types.js';
import { removeGameRoom } from './gameRooms.js';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../services/users.service.js';

import { StatsService } from '../services/stats.service';
interface Position { x: number; y: number; }
interface Velocity { vx: number; vy: number; }

/**
 * Store player info for a game
 */
type PlayerInfo = {
	playerId: number,
	username: string,
	playerToken: string,
	ws: WebSocket | null,
};

/**
 * Store state of game
 * Receive movements from players
 * Call tick() 60 times a sec for movement update
 * Broadcast updated state to clients
 */
export class GameInstance {
	private gameId: string;
	private isRunning: boolean = false;
	private hasReallyStarted: boolean = false;
	// pour pause/resume
	private isPaused: boolean = false;
	private isFreeze: boolean = false;
	private currentBallSpeed: number = 380;
	// pour gerer deconnexions en remote
	private players: PlayerInfo[] = [
		{ playerId: 1, username: "", playerToken: "", ws: null },
		{ playerId: 2, username: "", playerToken: "", ws: null },
	];
	private playerTokens: { [playerId: number]: string } = {};
	private pauseTimeoutHandle: NodeJS.Timeout | null = null;
	private spectators: WebSocket[] = [];
	private onEndCallback?: (winnerId: number) => void;
	// Paddles
	private paddle1Pos: Position;
	private paddle2Pos: Position;
	private readonly paddleWidth = 10;
	private readonly paddleHeight = 100;
	// Ball
	private ballPos: Position;
	private ballVel: Velocity;
	private readonly ballRadius = 8;
	private readonly ballAcceleration = 1.05;
	// Score
	private score1: number = 0;
	private score2: number = 0;
	private readonly maxScore: number = 5;
	// Tick interval
	private intervalHandle?: NodeJS.Timeout;
	// Parameters that won't change
	private readonly canvasWidth = 800;
	private readonly canvasHeight = 600;
	private paddleSpeed = 400; // px/sec
	private basePaddleSpeed = 400;
	private waitingTimeout?: NodeJS.Timeout;


	public inviterId?: string;


	constructor(gameId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM', inviterId?: string) {
		this.gameId = gameId;
		this.setDifficulty(difficulty);
		// initial pos of paddles
		this.paddle1Pos = { x: 20, y: (this.canvasHeight - this.paddleHeight) / 2 };
		this.paddle2Pos = { x: this.canvasWidth - 20 - this.paddleWidth, y: (this.canvasHeight - this.paddleHeight) / 2 };
		this.ballPos = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
		this.ballVel = this.randomBallVel();
		// Main loop (tick) at 60 FPS
		this.intervalHandle = setInterval(() => { this.tick(); }, 1000 / 60);
		this.inviterId = this.inviterId;
	}

	/** ---------- PUBLIC METHODS ----------- */
	// Add player (websocket) to this instance
	public addClient(ws: WebSocket, username: string | undefined): number | 'spectator' | 'already_joined' {
		// Check if user is already in the game by username
		if (username) {
			const existingPlayer = this.players.find(p => p.username === username && p.ws);
			if (existingPlayer) {
				console.log(`Player ${username} already in game ${this.gameId}`);
				return 'already_joined'; // Return specific status
			}
		}

		// Find empty slot
		for (let i = 0; i < this.players.length; i++) {
			if (!this.players[i].ws) {
				this.players[i].ws = ws;
				this.players[i].username = username || `Player ${i + 1}`;
				this.players[i].playerId = i + 1;

				const token = this.assignTokenToPlayer(i + 1);
				ws.send(JSON.stringify({ type: 'playerToken', playerId: i + 1, playerToken: token }));

				this.setupDisconnect(ws, i + 1);

				// Handle waiting timeout logic here
				const connectedCount = this.getConnectedPlayersCount();

				// Start timeout when first player joins
				if (connectedCount === 1 && !this.waitingTimeout) {
					this.waitingTimeout = setTimeout(() => {
						if (this.getConnectedPlayersCount() < 2 && !this.isRunning) {
							// Use a more specific message type for timeout cancellation
							const payload = JSON.stringify({
								type: 'end',
								reason: 'timeout',
								message: "No other player joined within 2 minutes. Game cancelled.",
								shouldRedirect: true
							});
							this.broadcastToAll(payload);
							this.destroy();
							removeGameRoom(this.gameId);
						}
					}, 2 * 60 * 1000);
				}

				// Clear timeout when second player joins
				if (connectedCount === 2 && this.waitingTimeout) {
					clearTimeout(this.waitingTimeout);
					this.waitingTimeout = undefined;
				}

				this.broadcastState(this.isRunning);
				return i + 1;
			}
		}

		// If no slots available, add as spectator
		this.addSpectator(ws);
		return 'spectator';
	}

	public addSpectator(ws: WebSocket) {
		this.spectators.push(ws);
		ws.send(JSON.stringify({ type: 'playerToken', playerId: 'spectator', playerToken: '' }));
		ws.on('close', () => {
			this.spectators = this.spectators.filter(s => s !== ws);
		});
		this.broadcastState(this.isRunning);
	}

	public getConnectedPlayersCount(): number {
		return this.players.filter(p => p.ws).length;
	}


	public onEnd(callback: (winnerId: number) => void) {
		this.onEndCallback = callback;
	}

	// public to get state
	public getCurrentState(): GameState {
		return this.buildState(true);
	}
	// when player moves
	public onClientAction(playerId: number, action: 'up' | 'down') {
		if (this.isFreeze) return;
		const dt = 1 / 60;
		if (playerId === 1) {
			this.movePaddle(this.paddle1Pos, action, dt);
		} else {
			this.movePaddle(this.paddle2Pos, action, dt);
		}
	}
	// start game
	public start() {
		if (this.hasReallyStarted) return;
		this.isFreeze = true;
		this.hasReallyStarted = true;
		this.broadcastToAll(JSON.stringify({ type: 'countdown', seconds: 3 }));
		this.isRunning = false;
		this.resetBall();
		this.resetPaddles();
		if (this.pauseTimeoutHandle) {
			clearTimeout(this.pauseTimeoutHandle);
			this.pauseTimeoutHandle = null;
		}
		let s = 3;
		const id = setInterval(() => {
			s--;
			if (s >= 0) this.broadcastToAll(JSON.stringify({ type: 'countdown', seconds: s }));
			else {
				clearInterval(id);
				this.isFreeze = false;
				this.ballVel = this.randomBallVel();
				this.isRunning = true;
			}
		}, 1000);
		this.broadcastState(true);
	}
	// pause game
	public pause() {
		this.isPaused = true;
		this.isFreeze = true;
		this.broadcastState(this.isRunning);
	}
	// resume game
	public resume() {
		this.isPaused = false;
		this.isFreeze = false;
		this.broadcastState(this.isRunning);
	}
	// set difficulty
	public setDifficulty(difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
		if (difficulty === 'EASY') this.currentBallSpeed = 240;
		else if (difficulty === 'MEDIUM') this.currentBallSpeed = 380;
		else if (difficulty === 'HARD') this.currentBallSpeed = 480;
		this.ballVel = this.randomBallVel();
	}
	// Génère un token unique pour le joueur et l'associe
	public assignTokenToPlayer(playerId: number): string {
		const token = uuidv4();
		this.playerTokens[playerId] = token;
		return token;
	}
	// Essaye de reconnecter un joueur en cas de deconnexion
	public tryReconnectPlayer(token: string, ws: WebSocket): boolean {
		const player = this.findPlayerByToken(token);
		if (!player) return false;
		player.ws = ws;
		this.setupDisconnect(ws, player.playerId);
		this.cancelPauseOnReconnect();
		this.broadcastState(this.isRunning);
		this.broadcastPlayerReconnected(player.playerId);
		ws.send(JSON.stringify({ type: "resume", message: "You have reconnected. Game resumes." }));
		ws.send(JSON.stringify({
			type: "playerToken",
			playerId: player.playerId,
			playerToken: player.playerToken
		}));
		return true;
	}

	public getPlayerToken(playerId: number): string | undefined {
		const player = this.players.find(p => p.playerId === playerId);
		return player?.playerToken;
	}

	/** ----------- PRIVATE METHODS ------------ */
	private setupDisconnect(ws: WebSocket, id: number) {
		ws.on('close', () => {
			const player = this.players.find(p => p.playerId === id);
			if (player) player.ws = null;
			this.broadcastState(this.isRunning);
			if (this.players.every(p => !p.ws)) {
				this.destroy();
				removeGameRoom(this.gameId);
			} else {
				this.startPauseOnDisconnect();
			}
		});
	}

	public getPlayerIdByWebSocket(ws: WebSocket): number | null {
		const player = this.players.find(p => p.ws === ws);
		return player ? player.playerId : null;
	}
	// to have random initial velocity of ball
	private randomBallVel(): Velocity {
		const angle = (Math.random() * 2 - 1) * (Math.PI / 4); // [-45°, +45°]
		const dir = Math.random() < 0.5 ? -1 : 1;
		return {
			vx: this.currentBallSpeed * Math.cos(angle) * dir,
			vy: this.currentBallSpeed * Math.sin(angle),
		};
	}
	// if no player we stop the instance
	private destroy() {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
			this.intervalHandle = undefined;
		}
	}
	// move paddle up or down
	private movePaddle(paddlePos: Position, action: 'up' | 'down', dt: number) {
		if (action === 'up') {
			paddlePos.y = Math.max(0, paddlePos.y - this.paddleSpeed * dt);
		} else {
			paddlePos.y = Math.min(
				this.canvasHeight - this.paddleHeight,
				paddlePos.y + this.paddleSpeed * dt
			);
		}
	}
	// 60 FPS loop
	private async tick() {
		if (!this.isRunning || this.isPaused) {
			this.broadcastState(false);
			return;
		}

		this.moveBall();
		this.checkCollisions();
		this.checkScoreAndReset();
		const ended = this.checkEndOfGame();

		if (ended) {
			this.broadcastState(false);
			const winner = this.score1 > this.score2 ? 1 : 2;
			const payload = JSON.stringify({
				type: 'matchEnd',
				winner,
				score1: this.score1,
				score2: this.score2,
				matchType: 'ONE_V_ONE'
			});
			this.broadcastToAll(payload);
			if (this.onEndCallback) this.onEndCallback(winner);
			this.destroy();
			return;
		}
		this.broadcastState(true);
	}

	private moveBall() {
		const dt = 1 / 60;
		this.ballPos.x += this.ballVel.vx * dt;
		this.ballPos.y += this.ballVel.vy * dt;

		// Rebond sur le plafond
		if (this.ballPos.y - this.ballRadius <= 0) {
			this.ballPos.y = this.ballRadius;
			this.ballVel.vy = -this.ballVel.vy;
		}
		// Rebond sur le sol
		if (this.ballPos.y + this.ballRadius >= this.canvasHeight) {
			this.ballPos.y = this.canvasHeight - this.ballRadius;
			this.ballVel.vy = -this.ballVel.vy;
		}
	}

	private checkCollisions() {
		// Collision avec paddle1
		if (
			this.ballPos.x - this.ballRadius <= this.paddle1Pos.x + this.paddleWidth &&
			this.ballPos.x + this.ballRadius >= this.paddle1Pos.x &&
			this.ballPos.y + this.ballRadius >= this.paddle1Pos.y &&
			this.ballPos.y - this.ballRadius <= this.paddle1Pos.y + this.paddleHeight
		) {
			// Position relative du point d'impact sur la raquette (de -1 à +1)
			const paddleCenter = this.paddle1Pos.y + this.paddleHeight / 2;
			const impactY = (this.ballPos.y - paddleCenter) / (this.paddleHeight / 2);
			// Clamp entre -1 et 1 pour éviter les valeurs extrêmes
			const clampedImpactY = Math.max(-1, Math.min(1, impactY));
			// Angle max (45° en radian)
			const maxBounceAngle = Math.PI / 4;
			const bounceAngle = clampedImpactY * maxBounceAngle;
			// Nouvelle vitesse
			const speed = Math.sqrt(this.ballVel.vx ** 2 + this.ballVel.vy ** 2) * this.ballAcceleration;
			this.ballVel.vx = Math.cos(bounceAngle) * speed;
			this.ballVel.vy = Math.sin(bounceAngle) * speed;
			// La balle doit repartir vers la droite (après avoir touché le paddle gauche)
			if (this.ballVel.vx < 0) this.ballVel.vx = Math.abs(this.ballVel.vx);
			this.ballPos.x = this.paddle1Pos.x + this.paddleWidth + this.ballRadius;
			this.paddleSpeed *= 1.02;
		}
		// Collision avec paddle2
		if (
			this.ballPos.x + this.ballRadius >= this.paddle2Pos.x &&
			this.ballPos.x - this.ballRadius <= this.paddle2Pos.x + this.paddleWidth &&
			this.ballPos.y + this.ballRadius >= this.paddle2Pos.y &&
			this.ballPos.y - this.ballRadius <= this.paddle2Pos.y + this.paddleHeight
		) {
			const paddleCenter = this.paddle2Pos.y + this.paddleHeight / 2;
			const impactY = (this.ballPos.y - paddleCenter) / (this.paddleHeight / 2);
			const clampedImpactY = Math.max(-1, Math.min(1, impactY));
			const maxBounceAngle = Math.PI / 4;
			const bounceAngle = clampedImpactY * maxBounceAngle;
			const speed = Math.sqrt(this.ballVel.vx ** 2 + this.ballVel.vy ** 2) * this.ballAcceleration;

			this.ballVel.vx = -Math.cos(bounceAngle) * speed;
			this.ballVel.vy = Math.sin(bounceAngle) * speed;
			// La balle doit repartir vers la gauche
			if (this.ballVel.vx > 0) this.ballVel.vx = -Math.abs(this.ballVel.vx);
			this.ballPos.x = this.paddle2Pos.x - this.ballRadius;
			this.paddleSpeed *= 1.02;
		}
	}

	private checkScoreAndReset() {
		if (this.ballPos.x - this.ballRadius <= 0) {
			this.score2++;
			this.resetBall();
			this.resetPaddles();
			this.freezeAfterScore();
		} else if (this.ballPos.x + this.ballRadius >= this.canvasWidth) {
			this.score1++;
			this.resetBall();
			this.resetPaddles();
			this.freezeAfterScore();
		}
	}

	private resetPaddles() {
		this.paddle1Pos.y = this.paddle2Pos.y = (this.canvasHeight - this.paddleHeight) / 2;
		this.ballVel = { vx: 0, vy: 0 };
	}

	private freezeAfterScore() {
		this.isFreeze = true;
		this.broadcastState(true);
		setTimeout(() => {
			this.ballVel = this.randomBallVel();
			this.isFreeze = false;
		}, 1000);
	}

	private checkEndOfGame(): boolean {
		if (this.score1 >= this.maxScore || this.score2 >= this.maxScore) {
			return true;
		}
		return false;
	}

	private buildState(isRunning: boolean): GameState & { connectedPlayers: number[], playerNames?: { 1: string, 2: string } } {
		return {
			paddle1: {
				x: this.paddle1Pos.x,
				y: this.paddle1Pos.y,
				width: this.paddleWidth,
				height: this.paddleHeight,
			},
			paddle2: {
				x: this.paddle2Pos.x,
				y: this.paddle2Pos.y,
				width: this.paddleWidth,
				height: this.paddleHeight,
			},
			ball: {
				x: this.ballPos.x,
				y: this.ballPos.y,
				radius: this.ballRadius,
			},
			score1: this.score1,
			score2: this.score2,
			ballVelocity: {
				vx: this.ballVel.vx,
				vy: this.ballVel.vy,
			},
			isRunning: this.isRunning && isRunning,
			isPaused: this.isPaused,
			isFreeze: this.isFreeze,
			connectedPlayers: [
				...this.players.filter(p => p.ws).map(p => p.playerId),
				...this.spectators.map((_, idx) => 100 + idx)
			],
			playerNames: {
				1: this.players[0].username || 'Player 1',
				2: this.players[1].username || 'Player 2',
			}
		};
	}

	// broadcast state to all connected websockets
	private broadcastState(isRunning: boolean) {
		const state = this.buildState(isRunning);
		const message = JSON.stringify(state);
		this.players.forEach(player => {
			if (player.ws && player.ws.readyState === player.ws.OPEN)
				player.ws.send(message);
		});
		this.spectators.forEach(ws => {
			if (ws.readyState === ws.OPEN) ws.send(message);
		});
	}
	// place ball in center after a point and randomly change direction
	private resetBall() {
		this.ballPos = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
		this.ballVel = this.randomBallVel();
		this.paddleSpeed = this.basePaddleSpeed;
	}

	private startPauseOnDisconnect() {

		if (this.score1 >= this.maxScore || this.score2 >= this.maxScore) {
			return;
		}
		this.isPaused = true;
		this.broadcastPause("Waiting for the other player to reconnect...");

		this.pauseTimeoutHandle = setTimeout(() => {
			this.endGameDueToDisconnect();
		}, 20000);  // 20 sec
	}

	private cancelPauseOnReconnect() {
		if (this.pauseTimeoutHandle) {
			clearTimeout(this.pauseTimeoutHandle);
			this.pauseTimeoutHandle = null;
		}
		if (this.players.every(p => p.ws)) {
			this.isPaused = true;
			this.broadcastPause("Both players reconnected. Host can restart the game.");
			this.broadcastState(this.isRunning);
		}
	}

	private endGameDueToDisconnect() {
		// Mark as ended first
		this.isRunning = false;

		// Send a clear end message that will trigger redirection
		const payload = JSON.stringify({
			type: 'end',
			reason: 'disconnect_timeout',
			message: "The other player did not reconnect. Game cancelled.",
			shouldRedirect: true,
			forceRedirect: true // Add this flag
		});
		this.broadcastToAll(payload);

		this.destroy();
		removeGameRoom(this.gameId);
	}

	private broadcastPause(message: string) {
		const payload = JSON.stringify({ type: 'pause', reason: 'disconnect', message });
		this.broadcastToAll(payload);
	}

	private broadcastEnd(message: string, reason: string = 'general') {
		const payload = JSON.stringify({
			type: 'end',
			reason: reason,
			message: message,
			shouldRedirect: true
		});
		this.broadcastToAll(payload);
	}

	private broadcastToAll(payload: string) {
		this.players.forEach(player => {
			if (player.ws && player.ws.readyState === player.ws.OPEN)
				player.ws.send(payload);
		});
		this.spectators.forEach(ws => {
			if (ws.readyState === ws.OPEN) ws.send(payload);
		});
	}

	private broadcastPlayerReconnected(playerId: number) {
		const payload = JSON.stringify({
			type: 'playerReconnected',
			playerId,
			message: `Player ${playerId} has reconnected.`
		});
		this.broadcastToAll(payload);
	}

	private findPlayerByToken(token: string): PlayerInfo | undefined {
		return this.players.find(p => p.playerToken === token);
	}

	public removePlayer(playerId: number): void {
		if (playerId >= 1 && playerId <= this.players.length) {
			const player = this.players[playerId - 1];
			const wasInviter = this.inviterId && player.username === this.inviterId;

			player.ws = null;
			player.username = '';
			player.playerId = playerId;

			console.log(`Player ${playerId} removed from game ${this.gameId}`);

			// If the inviter left, trigger cleanup
			if (wasInviter) {
				this.handleInviterLeave();
			}

			this.broadcastState(this.isRunning);
		}
	}

	private async handleInviterLeave(): Promise<void> {
		console.log(`Inviter left game ${this.gameId}, triggering cleanup`);

		// Import cleanup service dynamically to avoid circular imports
		try {
			const { GameCleanupService } = await import('../services/gamecleanup.service.js');
			await GameCleanupService.cleanupGameAndInvites(this.gameId, this.inviterId!);
		} catch (error) {
			console.error('Error handling inviter leave:', error);
		}
	}
}