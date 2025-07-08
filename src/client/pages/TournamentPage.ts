import '../styles.css';
import { startPongInContainer } from '../utils/game.utils';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { TournamentComponent } from '../components/tournament.component';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service.ts';
import { GameSettingsComponent } from '../components/game.component';
import pongPreviewImg from '../assets/gameimg/screen-pongGame.png'; // Add this import
const	language_obj = await UserService.GetLanguageFile();

let pauseState = { value: false };
let currentMatchSocket: WebSocket | null = null;
const playedMatches: any[] = [];
// let aliasesIdArray: string[] = [];

export async function renderTournamentPage() {
	document.title = `${language_obj['Tournamentpage_title']}`;
	document.body.innerHTML = '';

	// Sidebar et BG
	const user = await UserService.getCurrentUser();
	SidebarComponent.render({
		userName: user.displayName,
		avatarUrl: user.avatar,
		showStats: true,
		showBackHome: true,
		showUserSearch: false,
		showFriendsBtn: true,
	});
	BackgroundComponent.applyNormalGradientLayout();

	// Main layout
	const wrapper = document.createElement('div');
	wrapper.className = `
		ml-40 w-[calc(100%-15rem)] min-h-screen
		flex items-center justify-center
		p-8 relative
	`.replace(/\s+/g, ' ').trim();
	document.body.appendChild(wrapper);

	const layout = document.createElement('div');
	layout.className = 'flex items-start justify-center gap-6 w-full max-w-7xl mx-auto';
	wrapper.appendChild(layout);

	const gameContainer = document.createElement('div');
	gameContainer.className = 'relative z-10 flex flex-col items-center';
	layout.appendChild(gameContainer);

	const settingsContainer = document.createElement('div');
	settingsContainer.id = 'settings-container';
	settingsContainer.className = 'flex-shrink-0';
	layout.appendChild(settingsContainer);

	// settings bar initiale (demande alias)
	GameSettingsComponent.tournamentStarted = false;

	TournamentComponent.showPlayerSelection(gameContainer, (players) => {
		const settingsBar = GameSettingsComponent.render('duo-local', {
			onStartGame: () => {
				GameSettingsComponent.tournamentStarted = true;
				const newBar = GameSettingsComponent.render('duo-start', {
						onPauseGame: () => {
								pauseState.value = !pauseState.value;
								if (currentMatchSocket && currentMatchSocket.readyState === currentMatchSocket.OPEN) {
										currentMatchSocket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
								}
						},
						onRestartGame: () => renderTournamentPage(),
						// onDifficultyChange: (difficulty) => {
						// 		if (currentMatchSocket && currentMatchSocket.readyState === currentMatchSocket.OPEN) {
						// 				currentMatchSocket.send(JSON.stringify({ action: 'difficulty', difficulty }));
						// 		}
						// },
				});
                settingsContainer.innerHTML = '';
                settingsContainer.appendChild(newBar);
				launchTournament(players, gameContainer);
			},
			onPauseGame: () => {
				pauseState.value = !pauseState.value;
				if (currentMatchSocket && currentMatchSocket.readyState === currentMatchSocket.OPEN) {
					currentMatchSocket.send(JSON.stringify({ action: pauseState.value ? 'pause' : 'resume' }));
				}
			},
			onRestartGame: () => renderTournamentPage(),
			onDifficultyChange: (difficulty) => {
				if (currentMatchSocket && currentMatchSocket.readyState === currentMatchSocket.OPEN) {
					currentMatchSocket.send(JSON.stringify({ action: 'difficulty', difficulty }));
				}
			},
		});
		settingsContainer.innerHTML = '';
    	settingsContainer.appendChild(settingsBar);
	});

	const previewImg = document.createElement('img');
	previewImg.src = pongPreviewImg;
	previewImg.alt = 'Pong preview';
	previewImg.className = 'w-[800px] h-[610px] opacity-70 border-2 border-black rounded-md shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)] transition-all';
	gameContainer.appendChild(previewImg);
}

export async function launchTournament(aliases: string[], wrapper: HTMLElement) {
	// Prépare la structure des matchs (demi-finales + finale)
	const shuffled = [...aliases].sort(() => Math.random() - 0.5); // clone et shuffle les alias pour pas voir toujours le meme ordre
	const matchups: [string, string][] = [
		[shuffled[0], shuffled[1]],
		[shuffled[2], shuffled[3]],
		['', ''], // Finale, remplie après les demi-finales
	];
	const winners: string[] = [];
	wrapper.innerHTML = '';

	// recupere id des 4 joueurs
	const participants = await Promise.all(
		aliases.map(async alias => {
			const profile = await UserService.getUserProfileByDisplayName(alias);
			return { alias, id: profile.id };
		})
	);
	const participantsIds = participants.map(p => p.id);

	// Fonction récursive pour enchaîner les matchs
	async function playMatch(i: number) {
		let matchFinished = false;
		if (i === 2) {
			matchups[2][0] = winners[0];
			matchups[2][1] = winners[1];
		}

		const [leftAlias, rightAlias] = matchups[i];
    	const matchTitle = `${language_obj['Tournamentpage_match']} ${i + 1} : ${leftAlias} vs ${rightAlias}`;
		wrapper.innerHTML = '';
		const gameContainer = document.createElement('div');
		gameContainer.className = 'relative flex flex-col items-center justify-center';
		wrapper.appendChild(gameContainer);

		let gameId: string;
		try {
			gameId = await GameService.requestNewGameId();
		} catch (err) {
			const errMsg = document.createElement('p');
      		errMsg.textContent = `${language_obj['Tournamentpage_error_server']}`;
			errMsg.className = 'text-red-600';
			wrapper.appendChild(errMsg);
			return;
		}

		if (currentMatchSocket && currentMatchSocket.readyState === WebSocket.OPEN) {
			currentMatchSocket.onmessage = null;
			currentMatchSocket.close(1000, 'cleanup before new match');
		}
		currentMatchSocket = null;
		// await new Promise(resolve => setTimeout(resolve, 500));


		// Lancement du match
		const pongHandle = startPongInContainer(
			gameContainer, matchTitle, leftAlias, rightAlias,
			async (winnerId, score1, score2) => {
				if (matchFinished) return;
				matchFinished = true;
				const p1 = await UserService.getUserProfileByDisplayName(leftAlias);
				const p2 = await UserService.getUserProfileByDisplayName(rightAlias);
				const winnerAliasId = winnerId === 1 ? p1.id : p2.id;
				playedMatches.push({
					playerOneId: p1.id,
					playerTwoId: p2.id,
					playerOneScore: score1,
					playerTwoScore: score2,
					winnerId: winnerId === 1 ? p1.id : p2.id
				})
				const winnerName = winnerId === 1 ? leftAlias : rightAlias;
				winners.push(winnerName);

				if (i === matchups.length - 1) {
					try {
						console.log('typeof GameService.createTournament:', typeof GameService.createTournament);
						await GameService.createTournament({
							tournamentId: gameId,
							participants: participantsIds,
							winnerId: winnerAliasId,
							matches: playedMatches
						})
					} catch (error) {
						console.error('Error creating tournament: ', error);
					}
				}
				TournamentComponent.showTransitionPanel(gameContainer, i, matchups, winnerName, winners, async () => {
					if (currentMatchSocket && currentMatchSocket.readyState === WebSocket.OPEN) {
						currentMatchSocket.onmessage = null;
						currentMatchSocket.close(1000, 'next match');
					}
					currentMatchSocket = null;
					playMatch(i + 1)
				});
			},
			gameId,
			'duo-local'
		);
		pongHandle.start();
		currentMatchSocket = pongHandle.socket;
		pauseState.value = false;
	}
	await playMatch(0);
}
