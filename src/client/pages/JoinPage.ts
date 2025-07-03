import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { GameSettingsComponent } from '../components/game.component';
import { AuthComponent } from '../components/auth.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { TournamentComponent } from '../components/tournament.component';
import { router } from "../configs/simplerouter";
import { GameService } from "../services/game.service";
import {
	hideOverlay,
	startPongInContainer,
	showGameOverOverlay,
	getShareableLink
} from '../utils/game.utils';
import pongPreviewImg from '../assets/gameimg/screen-pongGame.png'; // Add this import
import { safeNavigate } from "../utils/navigation.utils";

let pongHandle: { start: () => void; socket: any } | null = null;
let pauseState = { value: false };
let bothPlayersConnected = false;
let isrendered = true;
let hasHadDisconnection = false;
let resumeAlertShown = false;
let joinedPlayers: number[] = [];
let gameEnded = false;


// Récupérer le username connecté
async function getUsername() {
	try {
		const user = await UserService.getCurrentUser();
		return user?.displayName || "";
	} catch {
		return "";
	}
}

export async function renderJoinPage(params: { gameId: string; mode: 'duo' | 'tournament' }) {
	const { gameId, mode } = params;

	document.body.innerHTML = '';
	document.title = mode === 'duo' ? 'Pong - Online Duo' : 'Pong - Tournoi Online';
	BackgroundComponent.applyNormalGradientLayout();

	let user;
	try {
		user = await UserService.getCurrentUser();
	} catch (error) {
		console.error('User not authenticated:', error);
		// Set redirect before navigating to auth
		if (!localStorage.getItem('postAuthRedirect')) {
			localStorage.setItem('postAuthRedirect', window.location.pathname + window.location.search);
		}
		safeNavigate('/auth');
		return;
	}

	// Handle display name setup BEFORE rendering game UI
	if (!user.displayName || user.displayName === '' || user.displayName === user.email) {
		try {
			const result = await AuthComponent.checkAndHandleDisplayName();
			if (result.success && result.userData) {
				// Use the updated user data
				user = result.userData;
			} else {
				// If display name setup failed, user is already redirected
				return;
			}
		} catch (error) {
			console.error('Display name setup failed:', error);
			safeNavigate('/auth');
			return;
		}
	}

	// Only render UI if user is fully authenticated with display name
	try {
		SidebarComponent.render({
			userName: user?.displayName || '',
			avatarUrl: user.avatar,
			showStats: false,
			showBackHome: true,
			showUserSearch: false,
			showFriendsBtn: true

		});
	} catch (error) {
		CommonComponent.handleAuthError();
		return;
	}


	// Wrapper principal
	const wrapper = document.createElement('div');
	wrapper.className = 'flex min-h-screen w-full items-center justify-center relative';
	document.body.appendChild(wrapper);

	const gameContainer = document.createElement('div');
	gameContainer.className = 'relative z-10';
	wrapper.appendChild(gameContainer);

	// screen du jeu avant toute partie
	const previewImg = document.createElement('img');
	previewImg.src = pongPreviewImg;
	previewImg.alt = 'Pong preview';
	previewImg.className = 'absolute top-[12%] left-[0.5%] z-50 opacity-70 rounded-md transition-all';
	gameContainer.appendChild(previewImg);

	// --- Récupère le username du joueur connecté (GUEST ou HOST) ---
	const myUsername = await getUsername();

	// --- Etats de la partie ---
	let playerId: number | 'spectator' | null = null;
	let hostUsername = 'Player 1';
	let guestUsername = 'Player 2';

	// --- Tournament tracking ---
	const matchups: [string, string][] = [['', ''], ['', ''], ['', '']];
	const winners: string[] = [];
	let currentMatchIndex = 0;
	let lastWinner: string | null = null;

	if (playerId === 1) hostUsername = user?.displayName;
	if (playerId === 2) guestUsername = user?.displayName;

	// S'assurer qu'on ne garde pas un vieux token si on entre dans une nouvelle room
	//   const lastId = getCookie('lastGameId');
	//   if (lastId && lastId !== gameId) {
	//     deleteCookie(`pongPlayerToken-${getCookie('lastGameId')}`);
	//     deleteCookie(`pongPlayerId-${getCookie('lastGameId')}`);
	//   } else {
	//     setCookie('lastGameId', gameId);
	//   }

	// --- Attente de la websocket ---
	const matchTitle = `${hostUsername} vs ${guestUsername}`;
	// duo finish
	const onFinish = mode === 'duo'
		? async (winnerId: number, score1: number, score2: number) => {
			const titleText = gameContainer.querySelector('h2')!.textContent!;
			const [hostName, guestName] = titleText.split(' vs ');
			const winnerName = winnerId === 1 ? hostName : guestName;
			const p1 = await UserService.getUserProfileByDisplayName(hostName);
			const p2 = await UserService.getUserProfileByDisplayName(guestName);

			showGameOverOverlay(wrapper, `${winnerName}`, "online");
			// pongHandle?.socket.close();
			// deleteCookie(`pongPlayerToken-${gameId}`);
			// deleteCookie(`pongPlayerId-${gameId}`);
			setTimeout(() => {
				window.dispatchEvent(new Event('app:close-sockets'));
				safeNavigate('/statistics');
			}, 3000);

			await GameService.createMatch(gameId, {
				playerOneId: p1.id,
				playerTwoId: p2.id,
				winnerId: winnerId === 1 ? p1.id : p2.id,
				matchType: 'ONE_V_ONE',
				playerOneScore: score1,
				playerTwoScore: score2
			}
			).catch(err => console.error('Erreur stats:', err));
		}
		: () => { };
	const wsHandler = startPongInContainer(
		gameContainer,
		matchTitle,
		myUsername,
		"",
		onFinish,
		gameId,
		mode === 'duo' ? 'duo-online' : 'tournament-online'
	);
	pongHandle = wsHandler;

	const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement | null;
	if (canvas) {
		canvas.classList.add('blur-xs');

		// Add debug info
		console.log('Canvas debug info:', {
			width: canvas.width,
			height: canvas.height,
			style: canvas.style.cssText,
			classes: canvas.className,
			display: getComputedStyle(canvas).display,
			visibility: getComputedStyle(canvas).visibility,
			opacity: getComputedStyle(canvas).opacity
		});

		// Force canvas to be visible
		canvas.style.display = 'block';
		canvas.style.visibility = 'visible';
		canvas.style.opacity = '1';
	}

	// Message d’attente
	const waiting = document.createElement('div');
	waiting.className = `
    text-white text-2xl p-10 z-20 absolute top-[14,5%] left-1/2 -translate-x-1/2
    capitalize
    font-[Orbitron]
  `;
	waiting.textContent = "Connecting...";
	wrapper.appendChild(waiting);

	// const messageDisplay = document.createElement('div');
	// messageDisplay.id = 'signup-msg-display';
	// messageDisplay.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
	// document.body.appendChild(messageDisplay);

	// Pour savoir si la partie est lancée (venant du host)
	let gameStarted = false;
	let hasError = false; // Add error state tracking

	// Ecoute les messages du WS
	pongHandle.socket.addEventListener('message', async (event: MessageEvent) => {
		try {
			const data = JSON.parse(event.data);
			//console.log('WebSocket message received:', data);

			if (data.type === 'end') {
				console.log('Game ended:', data);

				// Show appropriate message based on the reason
				if (data.reason === 'timeout') {
					CommonComponent.showMessage(`⏰ ${data.message}`, 'warning');
				} else {
					CommonComponent.showMessage(`Game ended: ${data.message}`, 'warning');
				}

				// Always redirect to home when game ends, regardless of reason
				// Always reload on close (previously checked shouldReloadOnClose)
				setTimeout(() => {
					window.dispatchEvent(new Event('app:close-sockets'));
					// Use the router to navigate properly
					if (typeof safeNavigate === 'function') {
						safeNavigate('/home');
					} else {
						window.location.href = '/home';
					}
				}, 2000);
				return;
			}

			if (data.type === 'error') {
				console.log('Error message received:', data);
				hasError = true;

				if (data.error === 'already_joined') {
					console.log('Already joined error detected');
					waiting.textContent = "❌ You are already in this game";
					waiting.className = waiting.className.replace('text-white', 'text-red-500');

					// CommonComponent.showMessage(
					// 	`❌ ${data.message || 'You are already in this game'}`,
					// 	'error'
					// );

					setTimeout(() => {
						console.log('Redirecting to home...');
						window.dispatchEvent(new Event('app:close-sockets'));
						pongHandle?.socket.close();
						safeNavigate('/home');
					}, 2000);
					return;
				}

				waiting.textContent = `❌ Error: ${data.error}`;
				waiting.className = waiting.className.replace('text-white', 'text-red-500');

				CommonComponent.showMessage(`❌ Game error: ${data.error}`, 'error');
				setTimeout(() => {
					window.dispatchEvent(new Event('app:close-sockets'));
					pongHandle?.socket.close();
					router.navigate('/home');
				}, 2000);
				return;
			}
			if (data.type === 'error' && data.error === 'invite_expired') {
				CommonComponent.showMessage('❌ Your invite expired. Redirecting...', 'error');
				setTimeout(() => {
					window.dispatchEvent(new Event('app:close-sockets'));
					router.navigate('/home');
				}, 2000);
				return;
			}

			// Only process other messages if no error occurred
			if (!hasError) {
				// PlayerId : host (1), guest (2), spectator
				if (data.type === 'playerToken') {
					playerId = data.playerId;
					console.log('Player ID assigned:', playerId);

					// If assigned as spectator, show message but allow viewing
					if (playerId === 'spectator') {
						waiting.textContent = "👀 Watching as spectator";
						// CommonComponent.showMessage('👀 Watching as spectator', 'info');
					} else {
						waiting.textContent = "Waiting for another player to join...";
					}

					if (playerId === 1) {
						hostUsername = myUsername;
					} else if (playerId === 2) {
						guestUsername = myUsername;
					}
					// renderSettingsBar();
					return;
				}

				// Tournament specific logic
				if (mode === 'tournament') {
					if (data.type === 'playersJoined') {
						joinedPlayers = data.players || [];
						bothPlayersConnected = joinedPlayers.length === 4;
						console.log('Tournament players joined:', joinedPlayers.length);

						// Update waiting message for tournament
						if (joinedPlayers.length < 4) {
							waiting.textContent = `Waiting for players... (${joinedPlayers.length}/4)`;
						} else {
							waiting.textContent = "All players joined! Waiting for host to start...";
						}
						renderSettingsBar();
						return;
					}

					if (data.type === 'matchStart') {
						console.log('Tournament match starting');
						previewImg.remove();

						const transition = document.createElement('div');
						transition.style.backgroundColor = "#530196";
						transition.className = `
                        fixed top-[40%]
                        flex flex-col items-center justify-center p-8
                        backdrop-blur-2xl z-100 w-[28%] h-[22%]
                        border-2 border-black
                        whitespace-nowrap
                        rounded-lg
                        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
                    `;

						if (lastWinner) {
							const nextMsg = document.createElement('p');
							nextMsg.textContent = `Next Match :⬆️`;
							nextMsg.className = `font-["Orbitron"] text-white mt-2 text-xl`;
							transition.appendChild(nextMsg);

							const winnerMsg = document.createElement('h2');
							winnerMsg.textContent = `${lastWinner} wins this match!`;
							winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
							transition.appendChild(winnerMsg);

							wrapper.appendChild(transition);
							lastWinner = null;
							currentMatchIndex++;
						}

						matchups[currentMatchIndex] = [data.players[0], data.players[1]];
						gameStarted = false;
						isrendered = true;

						setTimeout(() => {
							if (canvas) canvas.classList.remove('blur-xs');
							transition.remove();
							pongHandle?.start();
						}, 4000);
						renderSettingsBar();
						return;
					}

					if (data.type === 'matchEnd') {
						gameEnded = true;
						lastWinner = data.winner;
						winners.push(data.winner);
						return;
					}

					if (data.type === 'tournamentEnd') {
						const transition = document.createElement('div');
						transition.style.backgroundColor = "#530196";
						transition.className = `
                        fixed top-[40%]
                        flex flex-col items-center justify-center p-8
                        backdrop-blur-2xl z-100 w-[28%] h-[22%]
                        border-2 border-black
                        whitespace-nowrap
                        rounded-lg
                        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
                    `;

						const winnerMsg = document.createElement('h2');
						winnerMsg.textContent = `${data.winner} wins this tournament!`;
						winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
						transition.appendChild(winnerMsg);

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

						setTimeout(() => {
							window.dispatchEvent(new Event('app:close-sockets'));
							safeNavigate('/statistics');
						}, 2300);

						transition.appendChild(info);
						wrapper.appendChild(transition);
						return;
					}
				}

				if (data.type === 'pause' && data.reason === 'disconnect') {
					if (!gameEnded) {
						hasHadDisconnection = true;
						// Show disconnect message
					}
					return;
				}

				// Game state updates - THIS IS THE KEY PART
				if (data.type === 'gameState' || (typeof data === "object" && "isRunning" in data && "score1" in data && "score2" in data)) {
					// console.log('Game state received:', { isRunning: data.isRunning, gameStarted, connectedPlayers: data.connectedPlayers });

					if (mode === 'duo') {
						const wasConnected = bothPlayersConnected;

						bothPlayersConnected = !!data.connectedPlayers && data.connectedPlayers.length === 2;
						if (wasConnected !== bothPlayersConnected) {
							renderSettingsBar();
						}
					} else if (mode === 'tournament') {
						bothPlayersConnected = joinedPlayers.length === 4;
					}

					// Handle reconnection scenario
					if (bothPlayersConnected && hasHadDisconnection && data.isPaused) {
						if (playerId === 1 && !resumeAlertShown) {
							CommonComponent.showMessage("Both player are back. Click Start Game to continue.", 'info');
							// alert("Both players are back. Click Start Game to continue.");
							renderSettingsBar();
							resumeAlertShown = true;
							hideOverlay();
							if (previewImg.parentNode) previewImg.remove();
						} else {
							waiting.textContent = "Waiting for the host to restart the game...";
							hideOverlay();
						}
						return;
					}

					// Initial game setup when both players connect (for duo mode)
					if (mode === 'duo' && bothPlayersConnected && isrendered && !hasHadDisconnection) {
						console.log('Both players connected for duo game');
						if (previewImg.parentNode) previewImg.remove();
						renderSettingsBar();
						isrendered = false;
						hideOverlay();
					}

					// Update waiting message based on game state
					if (playerId === 1 || playerId === 2) {
						if (data.isRunning) {
							waiting.textContent = '';
						} else {
							waiting.textContent = bothPlayersConnected
								? (playerId === 1 ? "Click 'Start Game' to begin" : "Waiting for the host to start the game...")
								: "Waiting for another player to join...";
						}
					}

					// remove blur while countdown
					if (data.isFreeze) {
						if (canvas) canvas.classList.remove('blur-xs');
						if (previewImg.parentNode) previewImg.parentNode.removeChild(previewImg);
						if (waiting.parentNode) waiting.remove();
					}

					// Start the game when running
					if (data.isRunning && !gameStarted) {
						console.log('Starting game...');
						pongHandle?.start();
						if (canvas) canvas.classList.remove('blur-xs');
						if (previewImg.parentNode) previewImg.parentNode.removeChild(previewImg);
						if (waiting.parentNode) waiting.remove();
						gameStarted = true;
						resumeAlertShown = false;
						hideOverlay();
					}
				}
			}
		} catch (error) {
			console.error('Error parsing WebSocket message:', error);
		}
	});

	// Move event listeners OUTSIDE the message handler
	const cleanupGameOnLeave = async () => {
		console.log('User leaving game, triggering cleanup...');

		try {
			// Use ApiClient for authenticated requests with better error handling
			const response = await fetch('/api/game/cleanup', {
				method: 'POST',
				credentials: 'include', // Important for authentication
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ gameId, mode }),
				// Add timeout to prevent hanging requests
				signal: AbortSignal.timeout(5000) // 5 second timeout
			});

			if (!response.ok) {
				console.warn(`Game cleanup failed with status: ${response.status}`);
				// Don't throw error, just log it since cleanup is not critical for user experience
			} else {
				console.log('Game cleanup successful');
			}
		} catch (error) {
			// Improve error handling - don't let cleanup errors affect user experience
			if (error.name === 'AbortError') {
				console.warn('Game cleanup request timed out');
			} else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
				console.warn('Network error during game cleanup - server may be unreachable');
			} else {
				console.warn('Game cleanup failed:', error.message);
			}
			// Continue with cleanup even if server request fails
		}

		// Close WebSocket regardless of cleanup API success
		if (pongHandle?.socket) {
			pongHandle.socket.close();
		}

		// Dispatch close event
		window.dispatchEvent(new Event('app:close-sockets'));
	};

	// Move event listeners OUTSIDE the message handler
	window.addEventListener('beforeunload', cleanupGameOnLeave);

	window.addEventListener('popstate', cleanupGameOnLeave);

	// Add cleanup when navigating away
	const originalNavigate = router.navigate;
	router.navigate = (path: string) => {
		if (window.location.pathname.includes('/game/online/')) {
			cleanupGameOnLeave();
		}
		return originalNavigate.call(router, path);
	};

	function renderSettingsBar() {
		console.log('Rendering settings bar for mode:', mode, 'playerId:', playerId, 'bothPlayersConnected:', bothPlayersConnected);

		if (mode === 'duo') {
			// Host : copy link, start game
			if (playerId === 1) {
				GameSettingsComponent.render('duo-online', {
					getOnlineLink: () => getShareableLink(gameId, 'duo'),
					onCopyLink: async (link) => {
						navigator.clipboard.writeText(link);
						// CommonComponent.showMessage('✅ Link copied to clipboard!', 'success');
					},
					canStart: () => {
						const canStart = bothPlayersConnected && playerId === 1;
						console.log('Can start game check:', { bothPlayersConnected, playerId, canStart });
						return canStart;
					},
					onStartGame: async () => {
						console.log('Host starting game...');
						pongHandle?.socket.send(JSON.stringify({ action: 'start' }));
						GameSettingsComponent.render('solo-start', {
							onPauseGame: () => {
								pauseState.value = !pauseState.value;
								pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
							},
							onRestartGame: () => window.location.reload(),
						});
					},
					onPauseGame: () => {
						pauseState.value = !pauseState.value;
						pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
					},
					onRestartGame: () => window.location.reload(),
					onDifficultyChange: (difficulty) => {
						if (pongHandle && pongHandle.socket && pongHandle.socket.readyState === pongHandle.socket.OPEN) {
							pongHandle.socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
						}
					}
				});
			}
			// Guest : pas de bouton start/copy, juste pause
			else if (playerId === 2) {
				GameSettingsComponent.render('duo-guest', {
					onPauseGame: () => {
						pauseState.value = !pauseState.value;
						pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
					},
				});
			}
			else {
				GameSettingsComponent.render('initial', {});
			}
		} else {
			// Tournament mode
			GameSettingsComponent.render('tournament-online', {
				getOnlineLink: () => getShareableLink(gameId, 'tournament'),
				onCopyLink: async (link) => {
					// navigator.clipboard.writeText(link);
					// CommonComponent.showMessage('✅ Link copied to clipboard!', 'success');
				},
				canStart: () => {
					const canStart = bothPlayersConnected && playerId === 1;
					console.log('Tournament can start check:', { bothPlayersConnected, playerId, joinedPlayers: joinedPlayers.length, canStart });
					return canStart;
				},
				onStartGame: async () => {
					console.log('Host starting tournament...');
					pongHandle?.socket.send(JSON.stringify({ action: 'start' }));
					GameSettingsComponent.render('solo', {
						onPauseGame: () => {
							pauseState.value = !pauseState.value;
							pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
						},
						onRestartGame: () => window.location.reload(),
					});
				},
				onPauseGame: () => {
					pauseState.value = !pauseState.value;
					pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
				},
				onRestartGame: () => window.location.reload(),
				onDifficultyChange: (difficulty) => {
					if (pongHandle && pongHandle.socket && pongHandle.socket.readyState === pongHandle.socket.OPEN) {
						pongHandle.socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
					}
				}
			});
		}
	}
}