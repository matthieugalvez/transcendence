import { GameState } from '../types/game.types';

// --- Fonctions utilitaires de dessin ---
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  borderColor?: string,
  borderWidth: number = 4
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  if (borderColor) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
  gradient.addColorStop(0, "#8136c2");   // violet
  gradient.addColorStop(0.5, "#b946ef"); // magenta
  gradient.addColorStop(1, "#ffb36c");   // orange
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawCenterLine(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#FFA940';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 18]);
  ctx.beginPath();
  ctx.moveTo(ctx.canvas.width / 2, 0);
  ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(ctx: CanvasRenderingContext2D, rect, color, borderColor) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 5, borderColor, 1.5);
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScores(ctx: CanvasRenderingContext2D, score1: number, score2: number) {
  ctx.save();
  ctx.font = '80px Canada-big';

  const xCenter = ctx.canvas.width / 2;
  const score1Text = score1.toString();
  const score2Text = score2.toString();
  const score1Width = ctx.measureText(score1Text).width;
  const gap = 60;
  const y = 90;

  // Score gauche
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#8024ab';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'purple';
  ctx.lineWidth = 3;
  ctx.strokeText(score1Text, xCenter - gap - score1Width, y);
  ctx.fillText(score1Text, xCenter - gap - score1Width, y);

  // Score droit
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#FFA940';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#db8e30';
  ctx.lineWidth = 2;
  ctx.strokeText(score2Text, xCenter + gap, y);
  ctx.fillText(score2Text, xCenter + gap, y);

  ctx.restore();
}

// --- Fonction principale de rendu ---
export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  // if (!state.paddle1 || !state.paddle2 || !state.ball) {
  //   // console.warn('GameState incomplet, render ignoré:', state);
  //   return;
  // }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawBackground(ctx);
  drawCenterLine(ctx);
  drawPaddle(ctx, state.paddle1, "#FFA940", "#ffc56e");
  drawPaddle(ctx, state.paddle2, "#B946EF", "#d579fc");
  drawBall(ctx, state.ball.x, state.ball.y, state.ball.radius);
  drawScores(ctx, state.score1, state.score2);

  // Affichage de "Paused" si jeu en pause
  if (state.isPaused) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, ctx.canvas.height / 2 - 60, ctx.canvas.width, 120);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFF";
    ctx.font = "70px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
    ctx.restore();
  }
}
