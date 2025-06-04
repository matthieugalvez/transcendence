import { GameState } from './types';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
    // 1) Effacer tout le canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 2) Dessiner le fond (optionnel)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 3) Dessiner la ligne pointillée au milieu
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]); // 10px blanc, 10px vide
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width / 2, 0);
    ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Remettre en mode plein

    // 4) Dessiner les paddles
    ctx.fillStyle = '#fff';
    const { x: x1, y: y1, width: w1, height: h1 } = state.paddle1;
    ctx.fillRect(x1, y1, w1, h1);

    const { x: x2, y: y2, width: w2, height: h2 } = state.paddle2;
    ctx.fillRect(x2, y2, w2, h2);

    // 5) Dessiner la balle
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 6) Afficher les scores (en haut, centré)
    ctx.fillStyle = '#fff';
    ctx.font = '60px Arial';
    const scoreText = `${state.score1}     ${state.score2}`;
    const textWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, (ctx.canvas.width - textWidth) / 2, 80);

    if (!state.isRunning) {
        ctx.fillStyle = '#FFD700'; // jaune-or ou blanc, selon préférence
        ctx.font = '50px Arial'; // taille du texte plus grand
        const winnerText =
        state.score1 > state.score2
            ? 'Player 1 won!'
            : 'Player 2 won!';
        const wm = ctx.measureText(winnerText).width;
        // On centre horizontalement et verticalement la phrase
        ctx.fillText(
        winnerText,
        (ctx.canvas.width - wm) / 2,
        ctx.canvas.height / 2
        );
    }
}
