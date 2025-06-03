import { PongGame } from '../game/game';
import { renderGame } from '../game/renderGame';

// 1) Récupération du canvas et contexte
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d')!;
if (!ctx) throw new Error('Impossible de récupérer le context 2D');

// 2) Instanciation de la logique
const game = new PongGame(canvas.width, canvas.height);

// 3) Gestion du clavier
const keysPressed: { [key: string]: boolean } = {};
window.addEventListener('keydown', (e) => {
  keysPressed[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keysPressed[e.code] = false;
});

// 4) Démarrer le jeu au clic ou directement
document.addEventListener('DOMContentLoaded', () => {
  game.start();
});

// 5) Boucle de mise à jour client (pour envoyer les commandes au jeu)
let lastTime = performance.now();
function clientLoop(time: number) {
  const dt = (time - lastTime) / 1000; // (en secondes) dt = delta time = délai entre 2 frames
  lastTime = time;

  // Selon les touches enfoncées, on appelle movePaddle
  // Exemple : "KeyW" et "KeyS" contrôlent le joueur 1, "ArrowUp"/"ArrowDown" pour le joueur 2
  if (keysPressed['KeyW']) {
    game.movePaddle(1, 'up', dt);
  }
  if (keysPressed['KeyS']) {
    game.movePaddle(1, 'down', dt);
  }
  if (keysPressed['ArrowUp']) {
    game.movePaddle(2, 'up', dt);
  }
  if (keysPressed['ArrowDown']) {
    game.movePaddle(2, 'down', dt);
  }

  // 6) On met à jour la logique du jeu
  game.update(dt);

  // 7) On fait le rendu
  renderGame(ctx, game.getState());

  requestAnimationFrame(clientLoop);
}

// Lancer la boucle
requestAnimationFrame(clientLoop);
