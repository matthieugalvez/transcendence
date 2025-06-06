// import { Paddle } from './game/paddle';
// import { Ball } from './game/ball';
// import { GameState, PlayerId } from './game/types';
import '../styles.css';
import { startPongInContainer } from './game/utils';
// import { renderGame } from './game/renderGame';

// export class PongGame {
//   private canvasWidth: number;
//   private canvasHeight: number;

//   private paddle1: Paddle;
//   private paddle2: Paddle;
//   private ball: Ball;

//   private score1: number = 0;
//   private score2: number = 0;
//   private readonly paddleWidth = 10;
//   private readonly paddleHeight = 100;
//   private readonly paddleOffset = 20; // distance depuis le bord
//   private readonly ballRadius = 8;
  
//   private readonly maxScore: number = 5;

//   private lastTimestamp: number = 0;
//   private isRunningFlag: boolean = false;

//   constructor(canvasWidth: number, canvasHeight: number) {
//     this.canvasWidth = canvasWidth;
//     this.canvasHeight = canvasHeight;

//     // Initialisation des deux paddles, centrés verticalement
//     this.paddle1 = new Paddle(
//       this.paddleOffset,
//       (canvasHeight - this.paddleHeight) / 2,
//       this.paddleWidth,
//       this.paddleHeight
//     );
//     this.paddle2 = new Paddle(
//       canvasWidth - this.paddleOffset - this.paddleWidth,
//       (canvasHeight - this.paddleHeight) / 2,
//       this.paddleWidth,
//       this.paddleHeight
//     );

//     // Initialisation de la balle au centre
//     this.ball = new Ball(canvasWidth / 2, canvasHeight / 2, this.ballRadius);
//   }

//   /** Démarre la boucle du jeu (appelée depuis le code client) */
//   public start(): void {
//     this.isRunningFlag = true;
//     this.lastTimestamp = performance.now();
//     requestAnimationFrame(this.loop.bind(this));
//   }

//   /** Met le jeu en pause */
//   public pause(): void {
//     this.isRunningFlag = false;
//   }

//   /** Boucle principale : met à jour et stoppe si nécessaire */
//   private loop(timestamp: number): void {
//     if (!this.isRunningFlag) return;
//     const dt = (timestamp - this.lastTimestamp) / 1000; // dt en secondes
//     this.lastTimestamp = timestamp;

//     this.update(dt);
//     requestAnimationFrame(this.loop.bind(this));
//   }

//   /**
//    * Update de la logique du jeu (position ball, collision avec paddles, scores)
//    * dt est donné en secondes, ex. 1/60
//    */
//   public update(dt: number): void {
//     if (!this.isRunningFlag) return; // safety si score max atteint
//     // 1) On met à jour la position de la balle
//     this.ball.update(dt, this.canvasHeight);
//     // 2) On vérifie collision avec paddle1
//     this.checkPaddleCollision(this.paddle1);
//     // 3) Idem pour paddle2
//     this.checkPaddleCollision(this.paddle2);
//     // 4) On vérifie si la balle sort à gauche ou à droite → point marqué
//     if (this.ball.x - this.ball.radius <= 0) {
//         // point pour Player 2
//         if (this.score2 < this.maxScore) {
//             this.score2++;
//         }
//         // Si Player 2 vient d'atteindre maxScore, on arrête la partie
//         if (this.score2 >= this.maxScore) {
//             this.isRunningFlag = false;
//             return;
//         }
//         this.ball.reset(this.canvasWidth / 2, this.canvasHeight / 2);
//     }
//     if (this.ball.x + this.ball.radius >= this.canvasWidth) {
//         // point pour Player 1
//         if (this.score1 < this.maxScore) {
//             this.score1++;
//         }
//         // Si Player 1 vient d'atteindre maxScore, on arrête la partie
//         if (this.score1 >= this.maxScore) {
//             this.isRunningFlag = false;
//             return;
//         }
//         this.ball.reset(this.canvasWidth / 2, this.canvasHeight / 2);
//     }
//   }

//   /** Collision balle/paddle et rebond si besoin */
//   private checkPaddleCollision(paddle: Paddle): void {
//     const { x: px, y: py, width: pw, height: ph } = paddle.rect;
//     const bx = this.ball.x;
//     const by = this.ball.y;
//     const br = this.ball.radius;

//     if (
//       bx + br >= px &&
//       bx - br <= px + pw &&
//       by + br >= py &&
//       by - br <= py + ph
//     ) {
//       // Simple inversion horizontale
//       this.ball.bounceHorizontally();
//       // On repousse la balle juste à l’extérieur du paddle pour éviter qu’elle reste collée
//       if (paddle === this.paddle1) {
//         this.ball[' _x'] = px + pw + br; // hack : réassigner x pour sortir du paddle
//       } else {
//         this.ball[' _x'] = px - br;
//       }
//     }
//   }

//   /** Action demandée par un joueur : déplacer sa raquette */
//   public movePaddle(player: PlayerId, direction: 'up' | 'down', dt: number): void {
//     const bottomLimit = this.canvasHeight;
//     if (player === 1) {
//       direction === 'up'
//         ? this.paddle1.moveUp(dt, 0)
//         : this.paddle1.moveDown(dt, bottomLimit);
//     } else {
//       direction === 'up'
//         ? this.paddle2.moveUp(dt, 0)
//         : this.paddle2.moveDown(dt, bottomLimit);
//     }
//   }

//   /** Retourne un objet GameState pour le rendu (client) */
//   public getState(): GameState {
//     return {
//       paddle1: this.paddle1.rect,
//       paddle2: this.paddle2.rect,
//       ball: {
//         x: this.ball.x,
//         y: this.ball.y,
//         radius: this.ball.radius,
//       },
//       score1: this.score1,
//       score2: this.score2,
//       ballVelocity: { ...this.ball.velocity },
//       isRunning: this.isRunningFlag,
//     };
//   }
// }

// export function renderGamePage() {
//   document.title = 'Transcendance - Pong';
//   // 1) Container global centré
//   const container = document.createElement('div');
//   container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
//   document.body.appendChild(container);

//   // On confie tout à notre utilitaire en lui passant deux alias par défaut
//   // startPongInContainer(container, 'Player 1 vs Player 2', 'Player 1', 'Player 2');
//   startPongInContainer(
//                 container,
//                 'Player 1 vs Player 2',
//                 'Player 1',
//                 'Player 2',
//                 (winnerAlias:string) => void {}
//   );
// }

export function renderGamePage() {
  document.title = 'Transcendance - Pong';

  // 1) Conteneur principal centré
  const container = document.createElement('div');
  container.className =
    'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
  document.body.appendChild(container);

  // 2) Générer un gameId unique (par exemple à partir de la date courante)
  const gameId = Date.now().toString();

  // 3) Appeler l’utilitaire pour ouvrir la WebSocket et démarrer le rendu
  startPongInContainer(
    container,
    'Player 1 vs Player 2', // texte du match
    'Player 1',              // alias joueur gauche
    'Player 2',              // alias joueur droite
    (winnerAlias: string) => {
      // Ici on efface et on affiche le message final
      container.innerHTML = '';
      const msg = document.createElement('h2');
      msg.textContent = `Le gagnant est : ${winnerAlias} !`;
      msg.className = 'text-3xl font-bold text-center mt-8';
      container.appendChild(msg);
    },
    gameId
  );
}
