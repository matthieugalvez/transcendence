import { GameState } from '../types/game.types';
import { renderGame } from '../renders/game.render';
import { CommonComponent } from '../components/common.component';

// type pour le callback de fin de match
type FinishCallback = (winnerAlias: string) => void;

export interface PongHandle {
  start: () => void;
}

// --- WebSocket handler ---
function createGameWebSocket(
  gameId: string,
  ctx: CanvasRenderingContext2D,
  leftPlayer: string,
  rightPlayer: string,
  onFinish: FinishCallback,
  mode: 'duo-local' | 'duo-online' | 'solo'
) {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const port = 3000;
  // recuperer token du localstorage s'il existe
  const playerToken = localStorage.getItem('playerToken');
  // On ne passe un token QUE si on tente une reconnexion
  const shouldSendToken = (mode === 'duo-online') && !!playerToken;
  const queryPart = shouldSendToken ? `?playerToken=${playerToken}` : '';
  // const queryPart = (mode === 'duo-online' && playerToken) ? `?playerToken=${playerToken}` : '';
  const socketUrl = `${protocol}://${location.hostname}:${port}/ws/pong/${gameId}${queryPart}`;
  // const socketUrl = `${protocol}://${location.hostname}:${port}/ws/pong/${gameId}${playerToken ? `?playerToken=${playerToken}` : ''}`;
  const socket = new WebSocket(socketUrl);

  let playerId = null;
  let wasRunning = false;
  let wasPaused = false;

  socket.addEventListener('message', (event) => {
    try {
      if (typeof event.data !== 'string') {
        console.warn('WS non-string message ignored:', event.data);
        return;
      }
      console.log('WS raw message:', event.data);
      const data = JSON.parse(event.data);

      if (data.type === 'playerToken') {
        playerId = data.playerId;
        localStorage.setItem('playerToken', data.playerToken);
        localStorage.setItem('playerId', String(data.playerId));
        return;
      }
      // si deconnexion
      if (data.type === 'pause') {
        showOverlay(data.message);
        return;
      }
      // si reconnexion
      if (data.type === 'resume') {
        hideOverlay();
        return;
      }
      // si deconnexion sans reconnexion
      if (data.type === 'end') {
        alert(data.message);
        localStorage.removeItem('playerToken');
        localStorage.removeItem('playerId');
        window.location.href = '/home';
        return;
      }

      if (data.type === 'error') {
        console.error('Server error:', data.error);
        alert(`Error: ${data.error}`);
        window.location.href = '/home';
        return;
      }

      const state = data;
      renderGame(ctx, state);

      if (wasRunning && !state.isRunning && !state.isPaused) {
        const winnerAlias = state.score1 > state.score2 ? leftPlayer : rightPlayer;
        setTimeout(() => onFinish(winnerAlias), 150);
      }
      wasRunning = state.isRunning;
      wasPaused = state.isPaused;
    } catch (err) {
      console.error('WS message parse error:', err);
    }
  });

  socket.addEventListener('close', () => {
    alert("The game has ended or is no longer accessible.");
    window.location.reload();
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

// --- Boucle de polling des touches ---
function startClientInputLoop(
  socket: WebSocket,
  keysPressed: Record<string, boolean>,
  getPlayerId,
  mode: 'duo-local' | 'duo-online' | 'solo'
) {
  function frame() {
    // On check à chaque frame si on n’est PAS spectateur (et playerId est bien set)
    const pId = getPlayerId();
    if (socket.readyState === WebSocket.OPEN && pId !== 'spectator' && pId !== null) {
      if (mode === 'duo-online') {
        if (pId === 1) {
          if (keysPressed['KeyW']) {
            socket.send(JSON.stringify({ playerId: 1, action: 'up' }));
          } else if (keysPressed['KeyS']) {
            socket.send(JSON.stringify({ playerId: 1, action: 'down' }));
          }
        }
        else if (pId === 2) {
          if (keysPressed['ArrowUp']) {
            socket.send(JSON.stringify({ playerId: 2, action: 'up' }));
          } else if (keysPressed['ArrowDown']) {
            socket.send(JSON.stringify({ playerId: 2, action: 'down' }));
          }
        }
      } else {
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
      }
      
    }
    requestAnimationFrame(frame); // Toujours continuer la boucle, même en spectateur
  }
  requestAnimationFrame(frame);
}

// --- Création du jeu et intégration au DOM ---
export function startPongInContainer(
  container: HTMLDivElement,
  matchTitle: string,
  leftPlayer: string,
  rightPlayer: string,
  onFinish: FinishCallback,
  gameId: string,
  mode: 'duo-local' | 'duo-online' | 'solo' = 'solo',
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

  // Gestion clavier différée (pas avant .start())
  let keyboardHandlerStarted = false;
  const keysPressed: Record<string, boolean> = {};

  function start() {
    if (!keyboardHandlerStarted) {
      title.textContent = matchTitle;
      setupKeyboardHandlers(socket, keysPressed);
      startClientInputLoop(socket, keysPressed, getPlayerId, mode);
      keyboardHandlerStarted = true;
    }
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
  onReplay: () => void
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

  const replay = CommonComponent.createStylizedButton('Play Again', 'blue');
  replay.onclick = () => {
    if (canvas) canvas.classList.remove('blur-xs');
    ov.remove();
    onReplay();
  };
  panel.appendChild(replay);
}

export function getShareableLink(gameId: string) {
  const playerToken = localStorage.getItem('playerToken');
  if (playerToken) {
    return `${window.location.origin}/game/online/${gameId}?playerToken=${playerToken}`;
  }
  return `${window.location.origin}/game/online/${gameId}`;
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
