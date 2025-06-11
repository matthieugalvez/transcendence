import { GameState } from './types';

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

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
    // 1) Effacer tout le canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 2) Dessiner le fond (optionnel)
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    gradient.addColorStop(0, "#8136c2");   // violet
    gradient.addColorStop(0.5, "#b946ef"); // magenta
    gradient.addColorStop(1, "#ffb36c");   // orange
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 3) Dessiner la ligne pointillée au milieu
    ctx.strokeStyle = '#FFA940';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 18]); // 8px blanc, 18px vide
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width / 2, 0);
    ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Remettre en mode plein

    // 4) Dessiner les paddles
    ctx.save();
    ctx.shadowColor = "#FFA940";
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FFA940';
    const rad = 5;
    const { x: x1, y: y1, width: w1, height: h1 } = state.paddle1;
    drawRoundedRect(ctx, x1, y1, w1, h1, rad, "#ffc56e", 1.5); // gauche

    ctx.shadowColor = "#B946EF";
    ctx.fillStyle = '#B946EF';
    const { x: x2, y: y2, width: w2, height: h2 } = state.paddle2;
    drawRoundedRect(ctx, x2, y2, w2, h2, rad, "#d579fc", 1.5); // droite
    ctx.restore();

    // 5) Dessiner la balle
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6) Afficher les scores (en haut, centré)
    ctx.save();
    ctx.font = '80px Canada-big';

    // Score gauche (Player 1)
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#8024ab';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 3;

    const score1 = state.score1.toString();
    const score2 = state.score2.toString();
    // Calcule la position du centre
    // const totalWidth = ctx.measureText(score1 + '   ' + score2).width;
    const xCenter = ctx.canvas.width / 2;

    // Mesure le score1 et score2
    const score1Width = ctx.measureText(score1).width;
    // const score2Width = ctx.measureText(score2).width;

    // Place score1 à gauche du centre
    const gap = 60; // espace entre les deux scores
    const y = 90;
    ctx.strokeText(score1, xCenter - gap - score1Width, y);
    ctx.fillText(score1, xCenter - gap - score1Width, y);

    // Score droit (Player 2)
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#FFA940';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#db8e30';
    ctx.lineWidth = 2;
    ctx.strokeText(score2, xCenter + gap, y);
    ctx.fillText(score2, xCenter + gap, y);

    ctx.restore();
}
