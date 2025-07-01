import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { GameSettingsComponent } from '../components/game.component';
import { AuthComponent } from '../components/auth.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { router } from "../configs/simplerouter";

import { GameService } from "../services/game.service";
import {
	hideOverlay,
	startPongInContainer,
	showGameOverOverlay,
	getShareableLink
} from '../utils/game.utils';
// import {
//   setCookie,
//   getCookie,
//   deleteCookie,
// } from '../utils/cookies.utils'
import pongPreviewImg from '../assets/gameimg/screen-pongGame.png'; // Add this import


let pongHandle: { start: () => void; socket: any } | null = null;
let pauseState = { value: false };
let bothPlayersConnected = false;
let isrendered = true;
let hasHadDisconnection = false;
let resumeAlertShown = false;
let joinedPlayers: number[] = [];

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
        router.navigate('/auth');
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
            router.navigate('/auth');
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
            showUserSearch: false
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
	let playerId: number | null = null;
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
	if (canvas) canvas.classList.add('blur-xs');

	// Message d’attente
	const waiting = document.createElement('div');
	waiting.className = `
    text-white text-2xl p-10 z-20 absolute top-[14,5%] left-1/2 -translate-x-1/2
    capitalize
    font-[Orbitron]
  `;
	waiting.textContent = "Waiting for another player to join...";
	wrapper.appendChild(waiting);

	// Pour savoir si la partie est lancée (venant du host)
	let gameStarted = false;

	// Ecoute les messages du WS
	pongHandle.socket.addEventListener('message', async (event: MessageEvent) => {
		try {
			const data = JSON.parse(event.data);

			// PlayerId : host (1), guest (2), spectator
			if (data.type === 'playerToken') {
				playerId = data.playerId;
				if (playerId === 1) {
					hostUsername = myUsername;
				} else if (playerId === 2) {
					guestUsername = myUsername;
				}
				renderSettingsBar();
			}

			if (data.type === 'playersJoined') {
				joinedPlayers = data.players as number[];
				if (mode === 'tournament') {
					bothPlayersConnected = joinedPlayers.length === 4;
					renderSettingsBar();
					if (bothPlayersConnected) {
						waiting.textContent =
							playerId === 1
								? "Click 'Start Game' to begin"
								: 'Waiting for the host to start the game...';
					} else {
						waiting.textContent = 'Waiting for another player to join...';
					}
				}
			}

			if (mode === 'tournament') {
				if (data.type === 'matchStart') {
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
						// Sous message prochain match
						let nextMatchMsg = '';
						nextMatchMsg = `Next Match :⬆️`;
						const nextMsg = document.createElement('p');
						nextMsg.textContent = nextMatchMsg;
						nextMsg.className = `font-["Orbitron"] text-white mt-2 text-xl`;
						transition.appendChild(nextMsg);
						// Message principal
						const winnerMsg = document.createElement('h2');
						winnerMsg.textContent = `${lastWinner} wins this match!`;
						winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
						transition.appendChild(winnerMsg);

						wrapper.appendChild(transition);

						lastWinner = null;
						currentMatchIndex++;
					}
					matchups[currentMatchIndex] = [data.players[0], data.players[1]];
					// ajout
					gameStarted = false;
					isrendered = true;
					setTimeout(() => {
						if (canvas) canvas.classList.remove('blur-xs');
						transition.remove();
						wsHandler.start();
					}, 4000);
					renderSettingsBar();
				}

				if (data.type === 'matchEnd') {
					lastWinner = data.winner;
					winners.push(data.winner);
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
					// Message principal
					const winnerMsg = document.createElement('h2');
					winnerMsg.textContent = `${data.winner} wins this tournament!`;
					winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
					transition.appendChild(winnerMsg);
					// Bouton replay
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
						router.navigate('/statistics');
					}, 2000);
					transition.appendChild(info);

					wrapper.appendChild(transition);
				}
			}

			if (data.type === 'pause' && data.reason === 'disconnect') {
				hasHadDisconnection = true;
			}

			// On regarde si les deux joueurs sont connectés :
			if (typeof data === "object" && "isRunning" in data && "score1" in data && "score2" in data) {
				if (mode === 'duo')
					bothPlayersConnected = !!data.connectedPlayers && data.connectedPlayers.length === 2;
				else if (mode === 'tournament')
					bothPlayersConnected = joinedPlayers.length === 4;

				// SI les deux joueurs sont connectés ET il y a eu une déco
				if (bothPlayersConnected && hasHadDisconnection && data.isPaused) {
					if (playerId === 1 && !resumeAlertShown) {
						alert("Both players are back. Click Start Game to continue.");
						renderSettingsBar();
						resumeAlertShown = true;
						hideOverlay();
						previewImg.remove();
					} else {
						waiting.textContent = "Waiting for the host to restart the game...";
						hideOverlay();
					}
				}

				// rendu classique debut de partie
				if (data.connectedPlayers.length === 2 && isrendered == true && !hasHadDisconnection) {
					previewImg.remove();
					renderSettingsBar();
					isrendered = false;
					hideOverlay();
				}

				// On met à jour le message d’attente
				if (playerId === 1 || playerId === 2) {
					waiting.textContent = data.isRunning
						? ''
						: (playerId === 1
							? "Click 'Start Game' to begin"
							: "Waiting for the host to start the game...");
				}
				if (data.isRunning && !gameStarted) {
					if (playerId === 1 || playerId === 2) {
						pongHandle?.start();
						if (canvas) canvas.classList.remove('blur-xs');
						if (previewImg.parentNode) previewImg.parentNode.removeChild(previewImg);
						waiting.remove();
						gameStarted = true;
						resumeAlertShown = false;
						hideOverlay();
					}
					if (canvas) canvas.classList.remove('blur-xs');
					waiting.remove();
					gameStarted = true;
					resumeAlertShown = false;
					hideOverlay();
					previewImg.remove();
				}
			}
		} catch { }

		// juste après avoir créé ou démarré la partie
		window.addEventListener('beforeunload', () => {
			pongHandle?.socket.close();
		});
		window.addEventListener('popstate', () => {
			pongHandle?.socket.close();
		});
	});

	function renderSettingsBar() {
		if (mode === 'duo') {
			// Host : copy link, start game
			if (playerId === 1) {
				GameSettingsComponent.render('duo-online', {
					getOnlineLink: () => getShareableLink(gameId, 'duo'),
					onCopyLink: async (link) => {
						navigator.clipboard.writeText(link)
					},
					canStart: () => bothPlayersConnected && playerId === 1,
					onStartGame: async () => {
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
			// Guest : pas de bouton start/copy, juste pause
			else if (playerId === 2) {
				GameSettingsComponent.render('duo-guest', {
					onPauseGame: () => {
						pauseState.value = !pauseState.value;
						pongHandle?.socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
					},
				});
			}
			else {
				GameSettingsComponent.render('initial', {
				});
			}
		} else {
			GameSettingsComponent.render('tournament-online', {
				getOnlineLink: () => getShareableLink(gameId, 'tournament'),
				onCopyLink: async (link) => {
					navigator.clipboard.writeText(link)
				},
				canStart: () => bothPlayersConnected && playerId === 1,
				onStartGame: async () => {
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
