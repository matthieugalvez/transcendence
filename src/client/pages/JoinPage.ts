import { startPongInContainer, showGameOverOverlay, getShareableLink } from '../utils/game.utils';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { GameSettingsComponent } from '../components/game.component';
import { UserService } from '../services/user.service';
import { router } from "../configs/simplerouter";
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { hideOverlay } from '../utils/game.utils';
import { resourceLimits } from 'worker_threads';

let pongHandle: { start: () => void; socket: any } | null = null;
let pauseState = { value: false };
let bothPlayersConnected = false;
let isrendered = true;
let hasHadDisconnection = false;
let resumeAlertShown = false;

// Nouvelle fonction utilitaire pour récupérer le username connecté
async function getUsername() {
  try {
    const user = await UserService.getCurrentUser();
    return user?.displayName || "";
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
    SidebarComponent.render({ userName: user?.displayName || '', avatarUrl: user.avatar, showStats: false, showBackHome: true });
    BackgroundComponent.applyNormalGradientLayout();
  } catch(error) {
	  CommonComponent.handleAuthError();
  }

  localStorage.removeItem('playerToken');
  localStorage.removeItem('playerId');

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
  let playerId: number | null = null;
  let hostUsername = 'Player 1';
  let guestUsername = 'Player 2';

  // let playerId: string | null = null;
  if (playerId === 1) hostUsername = user?.displayName;
  if (playerId === 2) guestUsername = user?.displayName;

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
      if (data.type === 'playerToken') {
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

      if (data.type === 'pause' && data.reason === 'disconnect') {
        hasHadDisconnection = true;
      }

      // On regarde si les deux joueurs sont connectés :
      if (typeof data === "object" && "isRunning" in data && "score1" in data && "score2" in data) {
        bothPlayersConnected = !!data.connectedPlayers && data.connectedPlayers.length === 2;

        // SI les deux joueurs sont connectés ET il y a eu une déco
        if (bothPlayersConnected && !gameStarted && hasHadDisconnection) {
          const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement | null;
          if (canvas) canvas.classList.add('blur-xs');
          if (playerId === 1 && !resumeAlertShown) {
            alert("Both players are back. Click Start Game to continue.");
            renderSettingsBar();
            resumeAlertShown = true;
            hideOverlay();
          } else {
            waiting.textContent = "Waiting for the host to restart the game...";
            hideOverlay();
          }
        }
        
        // rendu classique debut de partie
        if (data.connectedPlayers.length === 2 && isrendered == true && !hasHadDisconnection) {
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
            resumeAlertShown = false;
            hideOverlay();
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
        onCopyLink: async (link) => {
          navigator.clipboard.writeText(link)
        },
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
