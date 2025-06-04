import { PongGame } from '../GamePage';
import { renderGame } from './renderGame';

/**
 * throw Container div dans lequel on veut insérer le canvas + titre de match
 * matchTitle : le texte à placer au-dessus du canvas (ex. "Alice vs Bob")
 * leftPlayer et rightPlayer servent uniquement pour l'affichage du message de victoire
 */
export function startPongInContainer(container: HTMLDivElement, matchTitle: string, leftPlayer: string, rightPlayer: string, onFinish: (winnerAlias: string) => void) {
    // 1) Titre du match
    const title = document.createElement('h2');
    title.textContent = matchTitle;
    title.className = 'text-2xl font-semibold text-center mt-8 mb-4';
    container.appendChild(title);

    // 2) Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.className = 'border';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Impossible de récupérer le context 2D');

    // 3) Instancier la logique du jeu
    const game = new PongGame(canvas.width, canvas.height);

    // 4) Gestion du clavier
    const keysPressed: { [key: string]: boolean } = {};
    window.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
    });

    // 5) Boucle client pour maj + rendu
    let lastTime = performance.now();
    function clientLoop(time: number) {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        if (game.getState().isRunning) {
            if (keysPressed['KeyW']) game.movePaddle(1, 'up', dt);
            if (keysPressed['KeyS']) game.movePaddle(1, 'down', dt);
            if (keysPressed['ArrowUp']) game.movePaddle(2, 'up', dt);
            if (keysPressed['ArrowDown']) game.movePaddle(2, 'down', dt);

            game.update(dt);

            // Avant de rendre, on peut intercepter la fin de partie pour afficher l’alias du gagnant
            const state = game.getState();
            if (!state.isRunning) {
                // On supprime la boucle de rendu après avoir dessiné le dernier état
                renderGame(ctx, state);
                // Quel joueur a gagné ?
                let winnerAlias: string;
                let winnerText: string;
                if (state.score1 > state.score2) {
                    winnerText = `${leftPlayer} a gagné !`;
                    winnerAlias = leftPlayer;
                } else {
                    winnerText = `${rightPlayer} a gagné !`;
                    winnerAlias = rightPlayer;
                }
                // Afficher le message de victoire au centre du canvas
                ctx.fillStyle = '#FFD700';
                ctx.font = '50px Arial';
                const wm = ctx.measureText(winnerText).width;
                ctx.fillText(winnerText, (canvas.width - wm) / 2, canvas.height / 2);

                // Après un court délai (p. ex. 1 s) ou immédiatement, on notifie que le match est fini
                setTimeout(() => {
                    onFinish(winnerAlias);
                }, 1000);
                return;
            }
            renderGame(ctx, state);
        }
        requestAnimationFrame(clientLoop);
    }
    requestAnimationFrame(clientLoop);
    // 6) Démarrer la partie immédiatement
    game.start();
}
