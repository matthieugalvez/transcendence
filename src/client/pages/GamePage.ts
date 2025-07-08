import '../styles.css';
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { GameSettingsComponent } from '../components/game.component';
import previewImg from '../assets/gameimg/screen-pongGame.png'

// memoriser etat de la partie en cours
let pongHandle: { start: () => void; socket: any } | null = null;
// etat de pause
let pauseState = { value: false };

// Sous-fonction pour le wrapper principal
function createMainWrapper(): HTMLDivElement {
	const wrapper = document.createElement('div');
	wrapper.className = 'main-content responsive-container flex items-center justify-center relative';
	document.body.appendChild(wrapper);
	return wrapper;
}

// Sous-fonction pour la barre de contrôles
function createGameControls(
	wrapper: HTMLElement,
	onSolo: () => void,
	onDuo: () => void,
	onTournament: () => void
) {
	const controls = document.createElement('div');
	controls.className = `
    absolute flex flex-col items-center justify-center
    space-y-4 z-10
  `.replace(/\s+/g, ' ').trim();

	const gameMode = document.createElement('div');
	gameMode.className = `flex flex-row space-x-4 z-10 w-full`;

	const soloBtn = CommonComponent.createStylizedButton('Solo', 'blue');
	soloBtn.classList.add("cursor-pointer", "px-8");
	soloBtn.onclick = () => {
		controls.remove();
		onSolo();
	};
	gameMode.appendChild(soloBtn);

	const duoBtn = CommonComponent.createStylizedButton('Duo', 'purple');
	duoBtn.classList.add("cursor-pointer", "px-8");
	duoBtn.onclick = () => {
		controls.remove();
		onDuo();
	};
	gameMode.appendChild(duoBtn);

	controls.appendChild(gameMode);

	const tourBtn = CommonComponent.createStylizedButton('Tournament', 'red');
	tourBtn.classList.add("cursor-pointer");
	tourBtn.onclick = () => {
		controls.remove();
		onTournament();
	};
	controls.appendChild(tourBtn); '../assets/gameimg/screen-pongGame.png';

	wrapper.appendChild(controls);
}

// Verifie auth avant d'ouvrir page
export async function GamePageCheck() {
	document.title = "Home";
	document.body.innerHTML = "";
	BackgroundComponent.applyAnimatedGradient();

	try {
		// Fetch user data first - if this fails, we handle it in catch block
		let user = await UserService.getCurrentUser();

		// Handle display name setup BEFORE rendering any UI
		if (!user.displayName || user.displayName === '' || user.displayName === user.name) {
			const result = await AuthComponent.checkAndHandleDisplayName();
			if (result.success && result.userData) {
				// Use the updated user data
				user = result.userData;
			} else {
				// If checkAndHandleDisplayName failed, it already handled redirect
				return;
			}
		}

		// Only render sidebar and main content if authentication succeeds
		await SidebarComponent.render({
			userName: user.displayName,
			avatarUrl: user.avatar,
			showStats: true,
			showSettings: true,
			showBackHome: false,
			showUserSearch: false,
			showFriendsBtn: true
		});

		// const main = document.createElement("div");
		// main.className = 'ml-80 w-[calc(100%-20rem)] min-h-screen flex items-center justify-center p-8 relative';
		// document.body.appendChild(main);
	} catch (error) {
		console.error('Failed to fetch user data:', error);
		// Show error and redirect to auth - same as SettingsRender
		CommonComponent.handleAuthError();
	}
}

// Fonction principale
export async function renderPongGamePage() {
	await GamePageCheck();
	document.body.innerHTML = '';
	document.title = 'Pong';

	const user = await UserService.getCurrentUser();
	const leftPlayer = user.displayName || "Player 1";
	const rightPlayer = "Player 2";
	const matchTitle = `${leftPlayer} vs ${rightPlayer}`;

	// Layout de base
	SidebarComponent.render({
		userName: user.displayName,
		avatarUrl: user.avatar,
		showStats: true,
		showBackHome: true,
		showUserSearch: false
	});
	BackgroundComponent.applyNormalGradientLayout();

	const wrapper = createMainWrapper();

	// Create flex container for game and settings
	const gameAndSettingsContainer = document.createElement('div');
	gameAndSettingsContainer.className = 'flex items-start justify-center gap-6 w-full max-w-7xl mx-auto';
	wrapper.appendChild(gameAndSettingsContainer);

	// Game container
	const gameContainer = document.createElement('div');
	gameContainer.className = 'relative z-10 flex flex-col items-center';
	gameAndSettingsContainer.appendChild(gameContainer);

	// Settings container
	const settingsContainer = document.createElement('div');
	settingsContainer.id = 'settings-container';
	settingsContainer.className = 'flex-shrink-0';
	gameAndSettingsContainer.appendChild(settingsContainer);

	// Titre initial avant le canvas / preview
	const initialTitle = document.createElement('h2');
	initialTitle.textContent = 'Ready to pong?';
	initialTitle.className = 'text-2xl font-["Orbitron"] text-white text-center mb-4';
	gameContainer.appendChild(initialTitle);

	// Screen du jeu avant toute partie
	const previewImgElement = document.createElement('img');
	previewImgElement.src = previewImg;
	previewImgElement.alt = 'Pong preview';
	previewImgElement.className = `
        w-[800px] h-[610px]
        opacity-70 border-2 border-black rounded-md
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)] transition-all
    `.replace(/\s+/g, ' ').trim();
	gameContainer.appendChild(previewImgElement);

	createGameControls(
		wrapper,
		// --- Callback SOLO ---
		async () => {
			const settingsBar = GameSettingsComponent.render('solo', {
				onStartGame: async () => {
					gameContainer.removeChild(initialTitle);
					if (previewImgElement.parentNode) previewImgElement.remove();

					const res = await fetch('/api/game/start', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
					});
					const { gameId } = await res.json();
					const matchTitle = `${leftPlayer} vs Bot`;

					pongHandle = startPongInContainer(
						gameContainer,
						matchTitle,
						leftPlayer,
						"Bot",
						(winnerId) => {
							const titleText = gameContainer.querySelector('h2')!.textContent!;
							const [name1, name2] = titleText.split(' vs ');
							const winnerName = winnerId === 1 ? name1 : name2;
							showGameOverOverlay(gameContainer, `${winnerName}`, "local")
						},
						gameId,
						"solo"
					);

					const { socket } = pongHandle;
					pongHandle?.start();

					// Update settings bar
					const newSettingsBar = GameSettingsComponent.render('solo-start', {
						onPauseGame: () => {
							pauseState.value = !pauseState.value;
							if (socket && socket.readyState === socket.OPEN) {
								socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
							}
						},
						onRestartGame: () => {
							renderPongGamePage();
						},
					});
					settingsContainer.innerHTML = '';
					settingsContainer.appendChild(newSettingsBar);
				},
				onRestartGame: () => {
					renderPongGamePage();
				},
				onDifficultyChange: (difficulty) => {
					if (pongHandle && pongHandle.socket && pongHandle.socket.readyState === pongHandle.socket.OPEN) {
						pongHandle.socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
					}
				}
			});
			settingsContainer.appendChild(settingsBar);
		},
		// --- Callback DUO ---
		async () => {
			const settingsBar = GameSettingsComponent.render('duo', {
				onStartGame: async (mode) => {
					if (mode === 'duo-local') {
						// Render the duo-local settings bar
						const newSettingsBar = GameSettingsComponent.render('duo-local', {
							onStartGame: async () => {
								gameContainer.removeChild(initialTitle);
								if (previewImgElement.parentNode) previewImgElement.remove();

								const res = await fetch('/api/game/start', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
								});
								const { gameId } = await res.json();

								pongHandle = startPongInContainer(
									gameContainer, matchTitle, leftPlayer, rightPlayer,
									(winnerId) => {
										const titleText = gameContainer.querySelector('h2')!.textContent!;
										const [name1, name2] = titleText.split(' vs ');
										const winnerName = winnerId === 1 ? name1 : name2;
										showGameOverOverlay(gameContainer, `${winnerName}`, "local")
									},
									gameId, "duo-local"
								);
								pongHandle?.start();

								// Update settings bar to show game controls
								const gameSettingsBar = GameSettingsComponent.render('duo-start', {
									onPauseGame: () => {
										pauseState.value = !pauseState.value;
										const socket = pongHandle?.socket;
										if (socket && socket.readyState === socket.OPEN) {
											socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
										}
									},
									// onDifficultyChange: (difficulty) => {
									// 	if (pongHandle && pongHandle.socket && pongHandle.socket.readyState === pongHandle.socket.OPEN) {
									// 		pongHandle.socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
									// 	}
									// },
									onRestartGame: () => renderPongGamePage()
								});
								settingsContainer.innerHTML = '';
								settingsContainer.appendChild(gameSettingsBar);
							},
							onPauseGame: () => {
								pauseState.value = !pauseState.value;
								const socket = pongHandle?.socket;
								if (socket && socket.readyState === socket.OPEN) {
									socket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
								}
							},
							onDifficultyChange: (difficulty) => {
								if (pongHandle && pongHandle.socket && pongHandle.socket.readyState === pongHandle.socket.OPEN) {
									pongHandle.socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
								}
							},
							onRestartGame: () => renderPongGamePage()
						});
						settingsContainer.innerHTML = '';
						settingsContainer.appendChild(newSettingsBar);
					}
					else if (mode === 'duo-online') {
						const res = await fetch('/api/game/start', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
						});
						const { gameId } = await res.json();
						router.navigate(`/game/online/duo/${gameId}`);
					}
				}
			});
			settingsContainer.appendChild(settingsBar);
		},
		// --- TOURNOI ---
		() => {
			const settingsBar = GameSettingsComponent.render('tournament', {
				onStartGame: async (mode) => {
					if (mode === 'tournament-local') {
						router.navigate('/tournament');
					}
					else if (mode === 'tournament-online') {
						const res = await fetch('/api/game/tournament/start', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
						});
						const { gameId } = await res.json();
						router.navigate(`/game/online/tournament/${gameId}`);
					}
				}
			});
			settingsContainer.appendChild(settingsBar);
		}
	);

	window.addEventListener('beforeunload', () => {
		pongHandle?.socket.close();
	});
	window.addEventListener('popstate', () => {
		pongHandle?.socket.close();
	});
}
