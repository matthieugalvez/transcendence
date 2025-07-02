import { GameState } from '../types/game.types';
import { renderGame } from '../renders/game.render';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
// import { setCookie, getCookie, deleteCookie } from './cookies.utils';
let	g_game_state: GameState

// type pour le callback de fin de match
type FinishCallback = (winnerAlias: 1 | 2, score1: number, score2: number) => void;

export interface PongHandle {
	start: () => void;
}

function isGameState(data: any): data is GameState {
	return data
		&& typeof data === "object"
		&& data.paddle1 && data.paddle2 && data.ball
		&& typeof data.paddle1.x === "number"
		&& typeof data.paddle2.x === "number"
		&& typeof data.ball.x === "number"
		&& typeof data.score1 === "number"
		&& typeof data.score2 === "number";
}

// --- WebSocket handler ---
function createGameWebSocket(
	gameId: string,
	ctx: CanvasRenderingContext2D,
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
	let wasRunning = false;
	let wasPaused = false;

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
					CommonComponent.showMessage(
						`❌ ${data.message || 'You are already in this game'}`,
						'error'
					);
					setTimeout(() => {
						window.dispatchEvent(new Event('app:close-sockets'));
						router.navigate('/home');
					}, 2000);
					return;
				}

				if (data.error === 'game_not_found') {
					CommonComponent.showMessage('❌ Game not found', 'error');
					setTimeout(() => {
						window.dispatchEvent(new Event('app:close-sockets'));
						router.navigate('/home');
					}, 2000);
					return;
				}

				if (data.error === 'invalid_token') {
					CommonComponent.showMessage('❌ Invalid game session', 'error');
					setTimeout(() => {
						window.dispatchEvent(new Event('app:close-sockets'));
						router.navigate('/home');
					}, 2000);
					return;
				}

				// Generic error handling
				CommonComponent.showMessage(`❌ Game error: ${data.error}`, 'error');
				setTimeout(() => {
					window.dispatchEvent(new Event('app:close-sockets'));
					router.navigate('/home');
				}, 2000);
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

			if (data.type === 'end') {
				CommonComponent.showMessage(`Game ended: ${data.message}`, 'warning');
				setTimeout(() => {
					window.dispatchEvent(new Event('app:close-sockets'));
					router.navigate('/home');
				}, 2000);
				return;
			}

		} catch (err) {
			console.error('WS message parse error:', err);
		}
	});

	// Handle WebSocket connection errors
	socket.addEventListener('error', (error) => {
		console.error('WebSocket error:', error);
		CommonComponent.showMessage('❌ Connection error occurred', 'error');
		setTimeout(() => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/home');
		}, 2000);
	});

	socket.addEventListener('close', (event) => {
//		console.log('WebSocket closed:', event.code, event.reason);
		if (event.code !== 1000) { // Not a normal closure
			CommonComponent.showMessage('❌ Connection lost', 'error');
			setTimeout(() => {
				window.dispatchEvent(new Event('app:close-sockets'));
				router.navigate('/home');
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

class	AI_class {
	lastCheck = new Date(0);
	expectedHitpoint = 300;
	knownScore: {p1: number, p2: number} = {p1: 0, p2:  0};
}

// --- Boucle de polling des touches ---
function startClientInputLoop(
	socket: WebSocket,
	keysPressed: Record<string, boolean>,
	getPlayerId,
	mode: 'duo-local' | 'duo-online' | 'solo' | 'tournament-online'
) {
	let	AI: AI_class;
	if (mode === 'solo') {
		AI = new AI_class
	}
	function frame() {
	// On check à chaque frame si on n’est PAS spectateur (et playerId est bien set)
		const pId = getPlayerId();
		if (socket.readyState === WebSocket.OPEN && pId !== 'spectator' && pId !== null && !g_game_state.isPaused) {
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
			} if (mode === 'solo') {
				makeAIInput(AI, socket);
			}
		}
		requestAnimationFrame(frame); // Toujours continuer la boucle, même en spectateur
	}
	requestAnimationFrame(frame);
}

function	makeAIInput(AI: AI_class, socket: WebSocket) {
	const	date = new Date;
	const	current_position = {x: g_game_state.paddle2.x, y: g_game_state.paddle2.y};

	if (g_game_state.score1 != AI.knownScore.p1 || g_game_state.score2 != AI.knownScore.p2) {
		AI.expectedHitpoint = 300;
		AI.knownScore = {p1: g_game_state.score1, p2: g_game_state.score2};
	}

	if (date.getTime() - AI.lastCheck.getTime() >= 1000) {
		AI.lastCheck = date;
		const	ball_position = { x: g_game_state.ball.x, y: g_game_state.ball.y };
		const	ball_speed = g_game_state.ballVelocity;
		if (ball_speed.vx < 0) {
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

function	linear_extrapolation(ball_position:{x: number, y: number}, ball_speed:{vx: number, vy: number}, x_hitpoint: number) {
	const dt = 1 / 60;
	const	x_line = (ball_position.x + ball_speed.vx * dt) - ball_position.x;
	const	y_line = (ball_position.y + ball_speed.vy * dt) - ball_position.y;
	const	slope = y_line / x_line;

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
    // Titre
    const title = document.createElement('h2');
    title.textContent = "Ready to pong?";
    title.className = 'text-2xl font-["Orbitron"] text-white text-center mt-8 mb-4';
    container.appendChild(title);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.className = 'border-2 border-black rounded-md shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Impossible de récupérer le context 2D');

    // WebSocket
    const wsHandler = createGameWebSocket(gameId, ctx, leftPlayer, rightPlayer, onFinish, mode);
    const { socket, getPlayerId } = wsHandler;

    // A chaque état reçu, on met à jour le titre
    socket.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            if ((mode === 'duo-online' || mode === 'tournament-online') && data.playerNames && data.playerNames[1] && data.playerNames[2]) {
                title.textContent = `${data.playerNames[1]} vs ${data.playerNames[2]}`;
            }
        } catch { }
    });

    // Gestion clavier différée
    let keysPressed: Record<string, boolean> = {};
    let inputLoopStarted = false;

    function setupInputHandlers() {
        if (inputLoopStarted) return; // Prevent multiple setups

//        console.log('[GAME UTILS] Setting up input handlers');

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
//            console.log('[GAME UTILS] WebSocket message:', data.type, data);

            // Handle specific errors
            if (data.type === 'error') {
                console.error('Server error:', data.error);
                // Don't handle errors here if we're in JoinPage context
                if (!window.location.pathname.includes('/game/online/')) {
                    CommonComponent.showMessage(`❌ Game error: ${data.error}`, 'error');
                    setTimeout(() => {
                        window.dispatchEvent(new Event('app:close-sockets'));
                        router.navigate('/home');
                    }, 2000);
                }
                return;
            }

            // Handle other message types...
            if (data.type === 'playerToken') {
//                console.log('[GAME UTILS] Player token received:', data.playerId);
                // Set up input handlers when we get our player token
                if (!inputLoopStarted) {
                    setupInputHandlers();
                }
                return;
            }

            if (data.type === 'pause') {
//                console.log('[GAME UTILS] Game paused:', data.message);
                showOverlay(data.message);
                return;
            }

            if (data.type === 'resume') {
//                console.log('[GAME UTILS] Game resumed');
                hideOverlay();
                return;
            }

            if (data.type === 'end') {
//                console.log('[GAME UTILS] Game ended:', data.message);
                CommonComponent.showMessage(`Game ended: ${data.message}`, 'info');
                setTimeout(() => {
                    window.dispatchEvent(new Event('app:close-sockets'));
                    router.navigate('/home');
                }, 2000);
                return;
            }

            // ADDED: Game state detection and rendering
            const isGameState = data.type === 'gameState' ||
                               (typeof data === 'object' &&
                                data.hasOwnProperty('paddle1') &&
                                data.hasOwnProperty('paddle2') &&
                                data.hasOwnProperty('ball') &&
                                data.hasOwnProperty('score1') &&
                                data.hasOwnProperty('score2'));

            if (isGameState) {
//                console.log('[GAME UTILS] Rendering game state:', {
//                    isRunning: data.isRunning,
//                    score1: data.score1,
//                    score2: data.score2,
//                    ball: data.ball,
//                    paddle1: data.paddle1,
//                    paddle2: data.paddle2
//                });
				g_game_state = data;
                // Import and use renderGame
                import('../renders/game.render.js').then(({ renderGame }) => {
                    renderGame(ctx, data);
                });

                // Check for match end
                if (data.score1 >= 5 || data.score2 >= 5) {
                    const winnerId = data.score1 >= 5 ? 1 : 2;
                    console.log('[GAME UTILS] Match ended, winner:', winnerId);
                    onFinish(winnerId, data.score1, data.score2);
                }
                return;
            }

            // Log unhandled messages for debugging
//            console.log('[GAME UTILS] Unhandled message type:', data.type, data);

        } catch (err) {
            console.error('WS message parse error:', err);
        }
    });

    // Set up input handlers immediately for local modes
    if (mode === 'duo-local' || mode === 'solo') {
        setupInputHandlers();
    }

    function start() {
        title.textContent = matchTitle;
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
	msg.textContent = `${winner} won! 🎉`;
	msg.className = `
    text-2xl text-white
    font-["Canada-big"] mb-4
  `;
	panel.appendChild(msg);

	if (mode === "local") {
		const replay = CommonComponent.createStylizedButton('Back to home', 'blue');
		replay.onclick = () => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/game');
		};
		panel.appendChild(replay);
	} else if (mode === "online") {
		const info = document.createElement('p');
		info.textContent = `Going to your stats…`;
		info.className = `
			text-lg text-gray-300
			font-["Orbitron"]
			border-2 border-black
			py-2 px-12
			bg-blue-500
			rounded-lg text-lg transition-colors
			focus:outline-none focus:ring-2
			shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
		`;
		panel.appendChild(info);
		setTimeout(() => {
			window.dispatchEvent(new Event('app:close-sockets'));
			router.navigate('/statistics');
		}, 2000);
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
