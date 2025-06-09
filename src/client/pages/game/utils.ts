import { GameState } from './types';
import { renderGame } from './renderGame';

type FinishCallback = (winnerAlias: string) => void;
/**
 * Fonctionnement :
 * 1. Ouvre websocket
 * 2. Gere reception etat du jeu
 * 3. Declenche rendu
 */
function initWebSocket(
  gameId: string,
  ctx: CanvasRenderingContext2D,
  leftPlayer: string,
  rightPlayer: string,
  onFinish: FinishCallback
) {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socketUrl = `${protocol}://${location.host}/ws/pong/${gameId}`;
  const socket = new WebSocket(socketUrl);

  socket.addEventListener('message', (event) => {
    const state: GameState = JSON.parse(event.data);
    renderGame(ctx, state);

    if (!state.isRunning) {
      const winnerAlias = state.score1 > state.score2 ? leftPlayer : rightPlayer;
      renderWinner(ctx, winnerAlias);
      setTimeout(() => onFinish(winnerAlias), 1000);
    }
  });

  socket.addEventListener('close', () => {
    console.warn('WebSocket fermé pour gameId=', gameId);
  });

  return socket;
}

/**
 * Surveille clavier pour envoyer { playerId, action } au serveur WS
 */
function initKeyboardHandlers(
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

/**
 * Boucle client qui, a chaque frame, envoie au serveur WS les actions si maintien des touches
 */
function startClientLoop(
  socket: WebSocket,
  keysPressed: Record<string, boolean>
) {
  let lastTime = performance.now();

  function frame(time: number) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    // Si la socket est ouverte, on envoie la commande courante
    if (socket.readyState === WebSocket.OPEN) {
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
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/**
 * Affiche "<winnerAlias> a gagné !" au centre du canvas.
 */
export function renderWinner(ctx: CanvasRenderingContext2D, winnerAlias: string) {
  const text = `${winnerAlias} a gagné !`;
  ctx.fillStyle = '#FFD700';
  ctx.font = '50px Arial';
  const wm = ctx.measureText(text).width;
  ctx.fillText(text, (ctx.canvas.width - wm) / 2, ctx.canvas.height / 2);
}

/**
 * Fonction principale : cree le canvas, ouvre la WebSocket, installe clavier et boucle
 */
export function startPongInContainer(
    container: HTMLDivElement,
    matchTitle: string,
    leftPlayer: string,
    rightPlayer: string,
    onFinish: FinishCallback,
    gameId: string
) {
    // 1) Titre du match
    const title = document.createElement('h2');
    title.textContent = matchTitle;
    title.className = 'text-2xl font-semibold text-center mt-8 mb-4';
    container.appendChild(title);

    // 2) Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.className = 'border-4 border-blue-500 rounded-md';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Impossible de récupérer le context 2D');

    // 3) Ouvrir websocket vers server
    const socket = initWebSocket(gameId, ctx, leftPlayer, rightPlayer, onFinish);

    // 4) Installer l’écouteur clavier
    const keysPressed: Record<string, boolean> = {};
    initKeyboardHandlers(socket, keysPressed);

    // 5) Boucle client pour envoyer les déplacements
    startClientLoop(socket, keysPressed);
}
