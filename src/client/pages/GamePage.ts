import '../styles.css';
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { UserService } from '../services/user.service';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { GameSettingsComponent } from '../components/game.component';
import { deleteCookie } from '../utils/cookies.utils';
import previewImg from '../assets/gameimg/screen-pongGame.png'

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
  tourBtn.classList.add("cursor-pointer");
  tourBtn.onclick = () => {
    controls.remove();
    onTournament();
  };
  controls.appendChild(tourBtn);'../assets/gameimg/screen-pongGame.png';

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
    await SidebarComponent.render({
      userName: user.displayName,
      avatarUrl: user.avatar,
      showStats: true,
      showSettings: true,
      showBackHome: false,
      showUserSearch: false
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

// Fonction principale
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
  SidebarComponent.render({ userName: user.displayName, avatarUrl: user.avatar, showStats:true, showBackHome:true });
  BackgroundComponent.applyNormalGradientLayout();
  GameSettingsComponent.render('initial');

  const wrapper = createMainWrapper();

  // Game container
  const gameContainer = document.createElement('div');
  gameContainer.className = 'relative z-0';
  wrapper.appendChild(gameContainer);

  // Titre initial avant le canvas / preview
  const initialTitle = document.createElement('h2');
  initialTitle.textContent = 'Ready to pong?';
  initialTitle.className = 'text-2xl font-["Orbitron"] text-white text-center mb-4';
  gameContainer.appendChild(initialTitle);

  // screen du jeu avant toute partie
  const previewImgElement = document.createElement('img');
  previewImgElement.src = previewImg;
  previewImgElement.alt = 'Pong preview';
  previewImgElement.className = 'w-[800px] h-[610px] opacity-70 border-2 border-black rounded-md shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)] transition-all';
  gameContainer.appendChild(previewImgElement);

  createGameControls(
    wrapper,
    // --- Callback SOLO ---
    async () => {
      GameSettingsComponent.render('solo', {
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
              showGameOverOverlay(wrapper, `${winnerName}`, "local")
            },
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
            gameContainer.removeChild(initialTitle);
            if (previewImgElement.parentNode) previewImgElement.remove();
			// A CHANGER: APICLIENT.AUTHENTICATEDFETCH !!!!!!! PAS SAFE
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
                showGameOverOverlay(wrapper, `${winnerName}`, "local")
              },
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
            const res = await fetch('/api/game/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
            });
            const { gameId } = await res.json();
            deleteCookie(`pongPlayerToken-${gameId}`);
            deleteCookie(`pongPlayerId-${gameId}`);
            router.navigate(`/game/online/duo/${gameId}`);
          }
        }
      });
    },
    // --- TOURNOI ---
    () => {
      GameSettingsComponent.render('tournament', {
        onStartGame: async (mode) => {
          // --- LOCAL ---
          if (mode === 'tournament-local') {
            router.navigate('/tournament');
          }
          // --- ONLINE ---
          else if (mode === 'tournament-online') {
            const res = await fetch('/api/game/tournament/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ difficulty: GameSettingsComponent.currentDifficulty })
            });
            const { gameId } = await res.json();
            deleteCookie(`pongPlayerToken-${gameId}`);
            deleteCookie(`pongPlayerId-${gameId}`);
            router.navigate(`/game/online/tournament/${gameId}`);
          }
        }
      });
    }
  );
  window.addEventListener('beforeunload', () => {
    pongHandle?.socket.close();
  });
  window.addEventListener('popstate', () => {
    pongHandle?.socket.close();
  });
}
