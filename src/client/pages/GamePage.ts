import '../styles.css';
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { UserService } from '../services/user.service';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { GameSettingsComponent } from '../components/game.component';

// memoriser etat de la partie en cours
let pongHandle: { start: () => void; socket: any } | null = null;
// etat de pause
let pauseState = { value: false };

// Sous-fonction pour le wrapper principal
function createMainWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = `
    ml-40 w-[calc(100%-15rem)] min-h-screen flex items-center justify-center p-8 relative
  `.replace(/\s+/g,' ').trim();
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
  `.replace(/\s+/g,' ').trim();

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
  tourBtn.onclick = () => {
    controls.remove();
    onTournament();
  };
  controls.appendChild(tourBtn);

  wrapper.appendChild(controls);
}

// Fonction principale

import { AuthComponent } from '../components/auth.component';

export async function GamePageCheck() {
    document.title = "Home";
    document.body.innerHTML = "";
    BackgroundComponent.applyAnimatedGradient();
  
    try {
      // Fetch user data first - if this fails, we handle it in catch block
      let user = await UserService.getCurrentUser();
  
      if (!user.displayName || user.displayName == '') {
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
      SidebarComponent.render({
        userName: user.displayName,
        showStats: true,
        showSettings: true,
        showBackHome: false
      });
  
      const main = document.createElement("div");
      main.className = "min-h-screen min-w-screen flex items-start justify-center";
      document.body.appendChild(main);
  
    } catch (error) {
      console.error('Failed to fetch user data:', error);
  
      // Show error and redirect to auth - same as SettingsRender
      CommonComponent.handleAuthError();
    }
  }

export async function renderPongGamePage() {
  await GamePageCheck();
  // clean page
  document.body.innerHTML = '';
  document.title = 'Pong';

  // get user
  const user = await UserService.getCurrentUser();
  const leftPlayer = user.displayName || "Player 1";
  const rightPlayer = "Player 2";
  const matchTitle = `${leftPlayer} vs ${rightPlayer}`;

  // layout de base
  SidebarComponent.render({ userName: user.name, showStats:true, showBackHome:true });
  BackgroundComponent.applyNormalGradientLayout();
  GameSettingsComponent.render('initial');

  const wrapper = createMainWrapper();
  const gameContainer = document.createElement('div');
  gameContainer.className = 'relative z-0';
  wrapper.appendChild(gameContainer);

  // screen du jeu avant toute partie
  const previewImg = document.createElement('img');
  previewImg.src = '../assets/gameimg/screen-pongGame.png';
  previewImg.alt = 'Pong preview';
  previewImg.className = 'rounded-md w-[800px] h-[610px] mt-15 opacity-70 blur-xs transition-all';
  gameContainer.appendChild(previewImg);

  createGameControls(
    wrapper,
    // --- Callback SOLO ---
    async () => {
      GameSettingsComponent.render('solo', {
        onStartGame: async () => {
          if (previewImg.parentNode) previewImg.remove();
          const res = await fetch('/api/game/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
          });
          const { gameId } = await res.json();
          pongHandle = startPongInContainer(
            gameContainer,
            matchTitle,
            leftPlayer,
            rightPlayer,
            (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderPongGamePage),
            gameId,
            "solo"
          );
          const { socket } = pongHandle;
          pongHandle?.start();
          GameSettingsComponent.render('solo-start', { // masquer le bouton "start"
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
    },
    // --- Callback DUO ---
    async () => {
      GameSettingsComponent.render('duo', {
        onStartGame: async (mode) => {
          // --- LOCAL ---
          if (mode === 'duo-local') {
            if (previewImg.parentNode) previewImg.remove();
            const res = await fetch('/api/game/start', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
            });
            const { gameId } = await res.json();
            pongHandle = startPongInContainer(
              gameContainer, matchTitle, leftPlayer, rightPlayer,
              (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderPongGamePage),
              gameId, "duo-local"
            );
            pongHandle?.start();
            GameSettingsComponent.render('solo-start', {
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
          }
          // --- ONLINE ---
          else if (mode === 'duo-online') {
            // if (previewImg.parentNode) previewImg.remove();
            const res = await fetch('/api/game/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
            });
            const { gameId } = await res.json();
            router.navigate(`/game/online/${gameId}`);
          }
        }
      });
    },
    // --- TOURNOI ---
    () => router.navigate('/tournament')
  );
}