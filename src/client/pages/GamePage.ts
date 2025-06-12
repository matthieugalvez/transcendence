import '../styles.css';
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { UserService } from '../services/user.service';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { GameSettingsComponent } from '../components/game.component';
import { getShareableLink } from '../utils/game.utils';

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
export async function renderPongGamePage() {
  // clean page
  document.body.innerHTML = '';
  document.title = 'Pong';

  // get user
  const user = await UserService.getCurrentUser();
  const leftPlayer = user?.name || "Player 1";
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

  const gameId = Date.now().toString();

  pongHandle = startPongInContainer(
    gameContainer,
    matchTitle,
    leftPlayer,
    rightPlayer,
    (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderPongGamePage),
    gameId,
  );
  const { socket } = pongHandle;

  const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement | null;
  if (canvas) canvas.classList.add('blur-xs');

  createGameControls(
    wrapper,
    // --- Callback SOLO ---
    () => {
      GameSettingsComponent.render('solo', {
        onStartGame: () => {
          if (canvas) canvas.classList.remove('blur-xs');
          pongHandle?.start();
          // masquer le bouton "start"
          GameSettingsComponent.render('solo-start', {
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
          if (socket && socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
          }
        }
      });
    },
    // --- Callback DUO ---
    () => {
      GameSettingsComponent.render('duo', {
        onStartGame: () => {
          if (canvas) canvas.classList.remove('blur-xs');
          pongHandle?.start();
          GameSettingsComponent.render('solo-start', {
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
          if (socket && socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ action: 'difficulty', difficulty }));
          }
        },
        // ONLINE
        getOnlineLink: () => getShareableLink(gameId),
        onCopyLink: (link) => {
          navigator.clipboard.writeText(link);
        }
      });
    },
    // --- TOURNOI ---
    () => router.navigate('/tournament')
  );
}
