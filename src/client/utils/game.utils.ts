import { GameState } from '../types/game.types';
import { CommonComponent } from '../components/common.component';
import { safeNavigate } from '../utils/navigation.utils.js';
import { router } from '../configs/simplerouter.js';
import { drawBackground } from '../renders/game.render.js';
import { drawScores } from '../renders/game.render.js';
import { language_obj } from '../index.js';

let g_game_state: GameState = {
	paddle1: { x: 20, y: 250, width: 10, height: 100 },
	paddle2: { x: 770, y: 250, width: 10, height: 100 },
	ball: { x: 400, y: 300, radius: 8 },
	score1: 0,
	score2: 0,
	ballVelocity: { vx: 0, vy: 0 },
	isRunning: false,
	isPaused: false,
	isFreeze: false
};

// type pour le callback de fin de match
type FinishCallback = (winnerAlias: 1 | 2, score1: number, score2: number) => void;

export interface PongHandle {
	start: () => void;
}

// --- WebSocket handler ---
function createGameWebSocket(
	gameId: string,
	leftPlayer: string,
	rightPlayer: string,
	onFinish: FinishCallback,
	mode: 'duo-local' | 'duo-online' | 'solo' | 'tournament-online'
) {
	const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
	let wsUrl = `${protocol}://${location.host}/ws/pong/${gameId}`;
	const params: string[] = [];
	params.push(`username=${encodeURIComponent(leftPlayer)}`);
	if (mode === 'tournament-online')
		params.push('mode=tournament');
	if (params.length) wsUrl += `?${params.join('&')}`;
	const socket = new WebSocket(wsUrl);
	let shouldReloadOnClose = true;
	window.addEventListener('app:close-sockets', () => {
		shouldReloadOnClose = false;
		if (socket.readyState === WebSocket.OPEN) {
			socket.close();
		}
	});

	let playerId = null;

	socket.addEventListener('message', (event) => {
		try {
			if (typeof event.data !== 'string') {
				console.warn('WS non-string message ignored:', event.data);
				return;
			}
			const data = JSON.parse(event.data);

			// Handle specific errors with user-friendly messages
			if (data.type === 'error') {
				console.error('Server error:', data.error);

				// Handle specific error types
				if (data.error === 'already_joined') {
					// CommonComponent.showMessage(
					// 	`❌ ${data.message || 'You are already in this game'}`,
					// 	'error'
					// );
					if (shouldReloadOnClose) {
						setTimeout(() => {
							window.dispatchEvent(new Event('app:close-sockets'));
							safeNavigate('/home');
						}, 2000);
					}
					return;
				}

				if (data.error === 'game_not_found') {
					CommonComponent.showMessage('❌ Game not found', 'error');
					if (shouldReloadOnClose) {
						setTimeout(() => {
							window.dispatchEvent(new Event('app:close-sockets'));
							safeNavigate('/home');
						}, 2000);
					}
					return;
				}

				if (data.error === 'invalid_token' || data.error === 'invite_expired') {
					CommonComponent.showMessage('❌ Session expired. Redirecting...', 'error');
					if (shouldReloadOnClose) {
						setTimeout(() => {
							window.dispatchEvent(new Event('app:close-sockets'));
							safeNavigate('/home');
						}, 2000);
					}
					return;
				}

				// Generic error handling
				CommonComponent.showMessage(`❌ Game error: ${data.error}`, 'error');
				if (shouldReloadOnClose) {
					setTimeout(() => {
						window.dispatchEvent(new Event('app:close-sockets'));
						safeNavigate('/home');
					}, 2000);
				}
				return;
			}

			// Handle other message types...
			if (data.type === 'playerToken') {
				playerId = data.playerId;
				return;
			}

			if (data.type === 'pause') {
				showOverlay(data.message);
				return;
			}

			if (data.type === 'resume') {
				hideOverlay();
				return;
			}

			if (data.type === 'countdown') {
				showCountdown(data.seconds.toString());
				if (data.seconds === 0) hideCountdown();
				return;
			}

			if (data.type === 'end') {
				CommonComponent.showMessage(`Game ended: ${data.message}`, 'warning');
				if (shouldReloadOnClose) {
					setTimeout(() => {
						window.dispatchEvent(new Event('app:close-sockets'));
						safeNavigate('/profile');
					}, 2000);
				}
				return;
			}

			if (data.type === 'matchEnd') {
				setTimeout(() => onFinish(data.winner, data.score1, data.score2), 150);
				return;
			}

		} catch (err) {
			console.error('WS message parse error:', err);
		}
	});

	// Handle WebSocket connection errors
	socket.addEventListener('error', (error) => {
		if (!shouldReloadOnClose) return;
		console.error('WebSocket error:', error);
		CommonComponent.showMessage('❌ Connection error occurred', 'error');
		setTimeout(() => {
			window.dispatchEvent(new Event('app:close-sockets'));
			safeNavigate('/home');
		}, 2000);
	});

	socket.addEventListener('close', (event) => {
		if (!shouldReloadOnClose) return;
		if (event.code !== 1000) { // Not a normal closure
			// CommonComponent.showMessage('❌ Connection lost', 'error');
			setTimeout(() => {
				window.dispatchEvent(new Event('app:close-sockets'));
				safeNavigate('/home');
			}, 2000);
		}
	});

	// Expose ces méthodes pour le reste du code
	return {
		socket,
		getPlayerId: () => playerId
	};
}

// --- Clavier handler ---
function setupKeyboardHandlers(
	socket: WebSocket,
	keysPressed: Record<string, boolean>
) {
	window.addEventListener('keydown', (e) => {
		keysPressed[e.code] = true;
	});
	window.addEventListener('keyup', (e) => {
		keysPressed[e.code] = false;
	});
}

class AI_class {
	lastCheck = new Date(0);
	expectedHitpoint = 300;
	knownScore: { p1: number, p2: number } = { p1: 0, p2: 0 };
}

// --- Boucle de polling des touches ---
function startClientInputLoop(
	socket: WebSocket,
	keysPressed: Record<string, boolean>,
	getPlayerId,
	mode: 'duo-local' | 'duo-online' | 'solo' | 'tournament-online'
) {
	let AI: AI_class;
	if (mode === 'solo') {
		AI = new AI_class
	}

	// let lastFrameTime = performance.now();
	let frameTimes: number[] = [];
	let frameCount = 0;
	let animationId: number;
	let isRunning = true;

	// Cleanup function
	const cleanup = () => {
		isRunning = false;
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	};

	// Listen for cleanup events
	window.addEventListener('app:close-sockets', cleanup);
	socket.addEventListener('close', cleanup);

	function frame() {
		if (!isRunning) return;

		// const now = performance.now();
		// const frameTime = now - lastFrameTime;
		// lastFrameTime = now;

		// frameTimes.push(frameTime);
		// frameCount++;

		// // Log performance metrics every 60 frames
		// if (frameCount >= 60) {
		// 	const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
		// 	const maxFrameTime = Math.max(...frameTimes);
		// 	const fps = 1000 / avgFrameTime;

		// 	console.log(`[PERFORMANCE] Avg: ${avgFrameTime.toFixed(2)}ms | Max: ${maxFrameTime.toFixed(2)}ms | FPS: ${fps.toFixed(1)}`);

		// 	// Reset metrics
		// 	frameTimes = [];
		// 	frameCount = 0;

		// 	// REMOVE THIS PROBLEMATIC CONDITION:
		// 	// if (g_game_state && (g_game_state.score1 >= 5 || g_game_state.score2 >= 5)) {
		// 	//     return; // This was breaking tournaments!
		// 	// }
		// }

		// Input handling logic
		const pId = getPlayerId();

		if (socket.readyState === WebSocket.OPEN && pId !== 'spectator' && pId !== null && g_game_state?.isRunning) {
			if (mode === 'duo-local') {
				if (keysPressed['KeyW']) {
					socket.send(JSON.stringify({ playerId: 1, action: 'up' }));
				} else if (keysPressed['KeyS']) {
					socket.send(JSON.stringify({ playerId: 1, action: 'down' }));
				}
				if (keysPressed['ArrowUp']) {
					socket.send(JSON.stringify({ playerId: 2, action: 'up' }));
				} else if (keysPressed['ArrowDown']) {
					socket.send(JSON.stringify({ playerId: 2, action: 'down' }));
				}
			} else {
				if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
					socket.send(JSON.stringify({ playerId: pId, action: 'up' }));
				} else if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
					socket.send(JSON.stringify({ playerId: pId, action: 'down' }));
				}
			}
			if (mode === 'solo') {
				makeAIInput(AI, socket);
			}
		}

		if (isRunning) {
			animationId = requestAnimationFrame(frame);
		}
	}

	// Start the loop
	animationId = requestAnimationFrame(frame);
}

function makeAIInput(AI: AI_class, socket: WebSocket) {
	const date = new Date;
	const current_position = { x: g_game_state.paddle2.x, y: g_game_state.paddle2.y };

	if (g_game_state.score1 != AI.knownScore.p1 || g_game_state.score2 != AI.knownScore.p2) {
		AI.expectedHitpoint = 300;
		AI.knownScore = { p1: g_game_state.score1, p2: g_game_state.score2 };
	}

	if (date.getTime() - AI.lastCheck.getTime() >= 1000) {
		AI.lastCheck = date;
		const ball_position = { x: g_game_state.ball.x, y: g_game_state.ball.y };
		const ball_speed = g_game_state.ballVelocity;
		if (ball_speed.vx <= 0) {
			AI.expectedHitpoint = 300;
		} else {
			AI.expectedHitpoint = linear_extrapolation(ball_position, ball_speed, current_position.x);
			if (AI.expectedHitpoint < 0) {
				AI.expectedHitpoint *= -1;
			} else if (AI.expectedHitpoint > 600) {
				AI.expectedHitpoint = 600 - (AI.expectedHitpoint % 600);
			}
		}
	}

	if (Number(AI.expectedHitpoint) < Number(current_position.y + g_game_state.paddle2.height / 2)
		&& Number(current_position.y + g_game_state.paddle2.height / 2) - Number(AI.expectedHitpoint) > g_game_state.paddle2.height / 2) {
		socket.send(JSON.stringify({ playerId: 2, action: 'up' }));
	} else if (Number(AI.expectedHitpoint) > Number(current_position.y + g_game_state.paddle2.height / 2)
		&& Number(AI.expectedHitpoint) - Number(current_position.y + g_game_state.paddle2.height / 2) > g_game_state.paddle2.height / 2) {
		socket.send(JSON.stringify({ playerId: 2, action: 'down' }));
	}
}

function linear_extrapolation(ball_position: { x: number, y: number }, ball_speed: { vx: number, vy: number }, x_hitpoint: number) {
	const dt = 1 / 60;
	const x_line = (ball_position.x + ball_speed.vx * dt) - ball_position.x;
	const y_line = (ball_position.y + ball_speed.vy * dt) - ball_position.y;
	const slope = y_line / x_line;

	return ball_position.y + slope * (x_hitpoint - ball_position.x);
}

// --- Création du jeu et intégration au DOM ---
export function startPongInContainer(
	container: HTMLDivElement,
	matchTitle: string,
	leftPlayer: string,
	rightPlayer: string,
	onFinish: FinishCallback,
	gameId: string,
	mode: 'duo-local' | 'duo-online' | 'tournament-online' | 'solo' = 'solo',
): PongHandle & { socket: WebSocket } {
	const player1Color = '#FFA940';
	const player2Color = '#B946EF';

	const title = document.createElement('h2');
	title.textContent = `${language_obj['Ready_to_pong']}`;
	title.className = 'text-2xl font-["Orbitron"] text-white text-center mt-8 mb-4';
	container.appendChild(title);

	function updateTitle(name1: string, name2: string) {
		let prefix = '';
		const match = name1.match(/^(Match\s+\d+\s*:\s*)/);
		if (match) {
			prefix = match[1];
			name1 = name1.slice(prefix.length);
		}
		title.innerHTML = `
			<span style="color:${player1Color};-webkit-text-stroke:0.5px #fff;text-shadow:0 0 4px font-['Canada-big'] #fff">${name1}</span>` +
			' vs ' +
			`<span style="color:${player2Color};-webkit-text-stroke:0.5px #fff;text-shadow:0 0 4px #fff">${name2}</span>
		`;
	}

	const bg_canvas = document.createElement('canvas');
	bg_canvas.className = 'border-2 border-black rounded-md shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]';
	bg_canvas.style.position = 'relative';
	bg_canvas.width = 800;
	bg_canvas.height = 600;
	bg_canvas.style.zIndex = '1';
	container.appendChild(bg_canvas);

	const bg_ctx = bg_canvas.getContext('2d')!;
	if (!bg_ctx) throw new Error('Impossible de récupérer le context 2D');

	drawBackground(bg_ctx);

	const game_canvas = document.createElement('canvas');
	game_canvas.className = 'border-2 border-black rounded-md';
	game_canvas.width = 800;
	game_canvas.height = 600;
	game_canvas.style.position = 'absolute';
	game_canvas.style.bottom = '0';
	game_canvas.style.zIndex = '2';
	container.appendChild(game_canvas);

	const game_ctx = game_canvas.getContext('2d')!;
	if (!game_ctx) throw new Error('Impossible de récupérer le context 2D');

	const UI_canvas = document.createElement('canvas');
	UI_canvas.className = 'border-2 border-black rounded-md';
	UI_canvas.width = 800;
	UI_canvas.height = 600;
	UI_canvas.style.position = 'absolute';
	UI_canvas.style.bottom = '0';
	UI_canvas.style.zIndex = '3';
	container.appendChild(UI_canvas);

	const UI_ctx = UI_canvas.getContext('2d')!;
	if (!UI_ctx) throw new Error('Impossible de récupérer le context 2D');
	UI_ctx.font = '80px Canada-big';
	UI_ctx.fillStyle = '#fff';
	UI_ctx.shadowBlur = 18;

	drawScores(UI_ctx, 0, 0);

	const wsHandler = createGameWebSocket(gameId, leftPlayer, rightPlayer, onFinish, mode);
	const { socket, getPlayerId } = wsHandler;

	// A chaque état reçu, on met à jour le titre
	socket.addEventListener('message', (event) => {
		try {
			const data = JSON.parse(event.data);
			if ((mode === 'duo-online' || mode === 'tournament-online') && data.playerNames && data.playerNames[1] && data.playerNames[2]) {
				// title.textContent = `${data.playerNames[1]} vs ${data.playerNames[2]}`;
				updateTitle(data.playerNames[1], data.playerNames[2]);
			}
		} catch { }
	});

	// Gestion clavier différée
	let keysPressed: Record<string, boolean> = {};
	let inputLoopStarted = false;

	function setupInputHandlers() {
		if (inputLoopStarted) return; // Prevent multiple setups
		// Clear any existing handlers
		keysPressed = {};
		setupKeyboardHandlers(socket, keysPressed);
		startClientInputLoop(socket, keysPressed, getPlayerId, mode);
		inputLoopStarted = true;
	}

	socket.addEventListener('message', (event) => {
		try {
			if (typeof event.data !== 'string') {
				console.warn('WS non-string message ignored:', event.data);
				return;
			}
			const data = JSON.parse(event.data);

			if (data.type === 'playerToken') {
				// Set up input handlers when we get our player token
				if (mode != 'tournament-online' && !inputLoopStarted) {
					setupInputHandlers();
				}
				return;
			}

			if (data.type === 'matchStart' && !inputLoopStarted) {
				setupInputHandlers();
				return;
			}


			const isGameState = data.type === 'gameState' ||
				(typeof data === 'object' &&
					data.hasOwnProperty('paddle1') &&
					data.hasOwnProperty('paddle2') &&
					data.hasOwnProperty('ball') &&
					data.hasOwnProperty('score1') &&
					data.hasOwnProperty('score2'));

			if (isGameState) {
				if (g_game_state && (data.score1 != g_game_state.score1 || data.score2 != g_game_state.score2)) {
					drawScores(UI_ctx, data.score1, data.score2);
				}
				g_game_state = data;

				if (!inputLoopStarted) {
					setupInputHandlers();
				}
				import('../renders/game.render.js').then(({ renderGame }) => {
					renderGame(game_ctx, data);
				});

				// Check for match end
				if (mode != 'tournament-online' && (data.score1 >= 5 || data.score2 >= 5)) {
					const winnerId = data.score1 >= 5 ? 1 : 2;
					onFinish(winnerId, data.score1, data.score2);
				}
				return;
			}
		} catch (err) {
			console.error('WS message parse error:', err);
		}
	});

	// Set up input handlers immediately for local modes
	if (mode === 'duo-local' || mode === 'solo') {
		setupInputHandlers();
	}

	function start() {
		// title.textContent = matchTitle;
		if (matchTitle.includes(' vs ')) {
			const [name1, name2] = matchTitle.split(' vs ');
			updateTitle(name1, name2);
		} else {
			updateTitle(leftPlayer, rightPlayer);
		}
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ action: 'start' }));
		} else {
			socket.addEventListener('open', () => {
				socket.send(JSON.stringify({ action: 'start' }));
			});
		}
	}

	return { start, socket };
}

// --- Overlay de fin de partie ---
// Optionnel : Déplacer ce composant dans `src/client/components/gameover.overlay.ts`
export function showGameOverOverlay(
	parent: HTMLElement,
	winner: string,
	mode: string
) {
	const ov = document.createElement('div');
	ov.className = `
		absolute inset-0 flex flex-col items-center justify-center
		space-y-4 z-20
	`.replace(/\s+/g, ' ').trim();
	parent.appendChild(ov);

	const canvas = parent.querySelector('canvas');
	if (canvas) canvas.classList.add('blur-xs');

	const panel = document.createElement('div');
	panel.style.backgroundColor = "#362174";
	panel.className = `
		text-center backdrop-blur-2xl
		rounded-lg p-6
		border-2 border-black
		shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
	`;
	ov.appendChild(panel);

	const msg = document.createElement('p');
	msg.textContent = `${winner} ${language_obj['Win_overlay_won']}! 🎉`;
	msg.className = `
		text-2xl text-white
		font-["Canada-big"] mb-4
	`;
	panel.appendChild(msg);

	if (mode === "local") {
		const replay = CommonComponent.createStylizedButton(`${language_obj['Ingamepage_replay_button']}`, 'blue');
		replay.onclick = () => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/game');
		};
		panel.appendChild(replay);
	} else if (mode === "online") {
		const info = document.createElement('button');
		info.textContent = `${language_obj['Ingame_back_to_stats']}`;
		info.className = `
			text-lg text-white
			font-["Orbitron"]
			border-2 border-black
			py-2 px-12
			mt-4
			bg-blue-500 hover:bg-blue-600
			rounded-lg text-lg transition-colors
			focus:outline-none focus:ring-2
			cursor-pointer
			shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
			disabled:opacity-50 disabled:cursor-not-allowed
		`;
		panel.appendChild(info);
		panel.onclick = () => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/statistics');
		};
		setTimeout(() => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/statistics');
		}, 10000);
	}
}

export function getShareableLink(gameId: string, mode: string) {
	// const playerToken = getCookie(`pongPlayerToken-${gameId}`);
	if (mode === 'duo') {
		// if (playerToken) {
		// 	return `${window.location.origin}/game/online/duo/${gameId}`;// ?playerToken=${playerToken}
		// }
		return `${window.location.origin}/game/online/duo/${gameId}`;
	}
	else if (mode === 'tournament') {
		// if (playerToken) {
		// 	return `${window.location.origin}/game/online/tournament/${gameId}`;
		// }
		return `${window.location.origin}/game/online/tournament/${gameId}`;
	}
}

// --- Fonctions pour overlay en cas de deco/reco ---

function showOverlay(message: string) {
	let overlay = document.getElementById('game-overlay') as HTMLDivElement | null;

	if (!overlay) {
		overlay = document.createElement('div');
		overlay.id = 'game-overlay';
		overlay.style.position = 'absolute';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		overlay.style.color = 'white';
		overlay.style.display = 'flex';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		overlay.style.fontSize = '24px';
		overlay.style.zIndex = '1000';
		document.body.appendChild(overlay);
	}

	overlay.textContent = message;
	overlay.style.display = 'flex';
}

export function hideOverlay() {
	const overlay = document.getElementById('game-overlay') as HTMLDivElement | null;
	if (overlay) {
		overlay.style.display = 'none';
	}
}

function showCountdown(message: string) {
	// Find the game container instead of using document.body
	const gameContainer = document.querySelector('.relative.z-10.flex.flex-col.items-center') as HTMLElement;
	const targetContainer = gameContainer || document.body;

	let overlay = document.getElementById('game-countdown') as HTMLDivElement | null;
	if (!overlay) {
		overlay = document.createElement('div');
		overlay.id = 'game-countdown';
		Object.assign(overlay.style, {
			position: 'absolute',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			pointerEvents: 'none',
			zIndex: '150'
		});

		const panel = document.createElement('div');
		panel.id = 'game-countdown-panel';
		Object.assign(panel.style, {
			background: 'rgba(0,0,0,0.75)',
			padding: '0.4em 2em',
			borderRadius: '8px',
			fontFamily: 'Canada-big',
			fontSize: '90px',
			color: '#fff',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			minWidth: '240px',
			border: '2px solid rgba(255,255,255,0.3)'
		});
		overlay.appendChild(panel);
		targetContainer.appendChild(overlay); // Use target container instead of document.body
	}

	(overlay.querySelector('#game-countdown-panel') as HTMLDivElement).textContent = message;
	overlay.style.display = 'flex';
}

export function hideCountdown() {
	const overlay = document.getElementById('game-countdown') as HTMLDivElement | null;
	if (overlay) {
		overlay.style.display = 'none';
		overlay.remove();
	}
}
