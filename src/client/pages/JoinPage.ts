import { startPongInContainer, showGameOverOverlay, getShareableLink } from '../utils/game.utils';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { GameSettingsComponent } from '../components/game.component';
import { UserService } from '../services/user.service';
import { router } from "../configs/simplerouter";
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';

let pongHandle: { start: () => void; socket: any } | null = null;
let pauseState = { value: false };
let bothPlayersConnected = false;
let isrendered = true;

// Nouvelle fonction utilitaire pour récupérer le username connecté
async function getUsername() {
  try {
    const user = await UserService.getCurrentUser();
    return user?.name || "";
  } catch {
    return "";
  }
}

export async function renderJoinPage(params: { gameId: string }) {
  const { gameId } = params;

  document.body.innerHTML = '';
  document.title = 'Pong - Online';

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

  // Only render UI if user is authenticated
  try {
  AuthComponent.checkAndHandleDisplayName();
  SidebarComponent.render({ userName: user?.displayName || '', showStats: false, showBackHome: true });
  BackgroundComponent.applyNormalGradientLayout();
  } catch(error) {
	CommonComponent.handleAuthError();
  }

  // Wrapper principal
  const wrapper = document.createElement('div');
  wrapper.className = 'flex min-h-screen w-full items-center justify-center relative';
  document.body.appendChild(wrapper);

  const gameContainer = document.createElement('div');
  gameContainer.className = 'relative z-0';
  wrapper.appendChild(gameContainer);

  // --- Récupère le username du joueur connecté (GUEST ou HOST) ---
  const myUsername = await getUsername();

  // --- Etats de la partie ---
  // let playerId: number | 'spectator' | null = null;
  let hostUsername = '';
  let guestUsername = '';

  let playerId: string | 'spectator' | null = null;
  if (playerId === 1) hostUsername = user?.name;
  if (playerId === 2) guestUsername = user?.name;

  // --- Attente de la websocket ---
  const matchTitle = `${hostUsername} vs ${guestUsername}`;
  const wsHandler = startPongInContainer(
    gameContainer,
    matchTitle,
    hostUsername,
    guestUsername,
    (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, () => renderJoinPage(params)),
    gameId,
    "duo-online"
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
      if (data.type === 'playerId') {
        playerId = data.playerId;
        // On assigne le username côté front localement
        if (playerId === 1) {
          hostUsername = myUsername;
        } else if (playerId === 2) {
          guestUsername = myUsername;
        }
        // Render de la settings bar (host = player 1)
        renderSettingsBar();
      }

      // GameState envoyé par le serveur à chaque frame
      // On regarde si les deux joueurs sont connectés :
      if (typeof data === "object" && "isRunning" in data && "score1" in data && "score2" in data) {
        // Quand 2 joueurs sont connectés, le serveur commence à broadcast
        bothPlayersConnected = !!data.connectedPlayers && data.connectedPlayers.length === 2;
        if (data.connectedPlayers.length === 2 && isrendered == true) {
          renderSettingsBar();
          isrendered = false;
        }
        // On met à jour le message d’attente
        if (playerId === 1 || playerId === 2) {
          waiting.textContent = data.isRunning
            ? ''
            : (playerId === 1
                ? "Click 'Start Game' to begin"
                : "Waiting for the host to start the game...");
          if (data.isRunning && !gameStarted) {
            pongHandle?.start();
            if (canvas) canvas.classList.remove('blur-xs');
            waiting.remove();
            gameStarted = true;
          }
        }
      }
    } catch {}
  });

  function renderSettingsBar() {
    // Host : copy link, start game
    if (playerId === 1) {
      GameSettingsComponent.render('duo-online', {
        getOnlineLink: () => getShareableLink(gameId),
        onCopyLink: (link) => navigator.clipboard.writeText(link),
        canStart: () => bothPlayersConnected,
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
    // Spectateur : rien
    else {
      GameSettingsComponent.render('initial', {
      });
    }
  }
}
