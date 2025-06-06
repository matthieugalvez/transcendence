// import { PongGame } from '../GamePage';
import { GameState } from './types';
import { renderGame } from './renderGame';

/**
 * startPongInContainer(container, matchTitle, leftPlayer, rightPlayer, onFinish, gameId)
 *
 * - container    : HTMLDivElement dans lequel on injecte le <canvas> + titre
 * - matchTitle   : chaîne, p. ex. "Alice vs Bob"
 * - leftPlayer   : alias du joueur gauche (string)
 * - rightPlayer  : alias du joueur droit (string)
 * - onFinish     : callback(winnerAlias) appelé une fois la partie terminée
 * - gameId       : identifiant unique (string) de la partie, utilisé dans l’URL WS
 *
 * Fonctionnement :
 * 1. Crée un <canvas> et un titre.
 * 2. Ouvre une connexion WebSocket à ws://…/ws/pong/<gameId>.
 * 3. Envoie { playerId: 1|2, action: 'up'|'down' } quand le joueur appuie sur W,S ou ↑,↓.
 * 4. Reçoit à chaque tick (60 FPS) un JSON { paddle1, paddle2, ball, score1, score2, isRunning }.
 * 5. Appelle renderGame(ctx, state) à chaque message.
 * 6. Quand state.isRunning passe à false, affiche “<winner> a gagné !” puis onFinish(winnerAlias).
 */
export function startPongInContainer(
    container: HTMLDivElement,
    matchTitle: string,
    leftPlayer: string,
    rightPlayer: string,
    onFinish: (winnerAlias: string) => void,
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
    canvas.className = 'border';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Impossible de récupérer le context 2D');

    // 3) Ouvrir websocket vers server
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${location.host}/ws/pong/${gameId}`;
    const socket = new WebSocket(socketUrl);

    let isSocketOpen = false;
    socket.addEventListener('open', () => {
        isSocketOpen = true;
    });

    // 4) Reception etat du jeu envoye par serveur
    socket.addEventListener('message', (event) => {
        const state: GameState = JSON.parse(event.data);
        // Afficher l’état sur le canvas
        renderGame(ctx, state);
        if (!state.isRunning) {
            // départager le gagnant
            const winnerAlias = state.score1 > state.score2 ? leftPlayer : rightPlayer;
            const winnerText = `${winnerAlias} a gagné !`;
            // Afficher ce texte au centre du canvas
            ctx.fillStyle = '#FFD700';
            ctx.font = '50px Arial';
            const wm = ctx.measureText(winnerText).width;
            ctx.fillText(winnerText, (canvas.width - wm) / 2, canvas.height / 2);
            // Après 1s, appeler onFinish(winnerAlias)
            setTimeout(() => {
                onFinish(winnerAlias);
            }, 1000);
        }
    });
 
    // 5) Gestion du clavier
    const keysPressed: { [key: string]: boolean } = {};
    window.addEventListener('keydown', (e) => {
        keysPressed[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.code] = false;
    });

    let lastTime = performance.now();
    function clientLoop(time: number) {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        // Si la socket est ouverte et que la partie n’est pas finie (isRunning = true)
        if (isSocketOpen) {
            // On envoie « up » / « down » pour Player 1 si W/S maintenues
            if (keysPressed['KeyW']) {
                socket.send(JSON.stringify({ playerId: 1, action: 'up' }))
            } else if (keysPressed['KeyS']) {
                socket.send(JSON.stringify({ playerId: 1, action: 'down' }))
            }
            // On envoie « up » / « down » pour Player 2 si ArrowUp / ArrowDown maintenues
            if (keysPressed['ArrowUp']) {
                socket.send(JSON.stringify({ playerId: 2, action: 'up' }))
            } else if (keysPressed['ArrowDown']) {
                socket.send(JSON.stringify({ playerId: 2, action: 'down' }))
            }
        }
        requestAnimationFrame(clientLoop)
    }

    // 6) Démarrer la boucle immédiatement
    requestAnimationFrame(clientLoop)

    socket.addEventListener('close', () => {
        console.warn('WebSocket fermé pour gameId=', gameId);
    });
}


// export function startPongInContainer(
//     container: HTMLDivElement,
//     matchTitle: string,
//     leftPlayer: string,
//     rightPlayer: string,
//     onFinish: (winnerAlias: string) => void,
//     gameId: string
// ) {
//     // 1) Titre du match
//     const title = document.createElement('h2');
//     title.textContent = matchTitle;
//     title.className = 'text-2xl font-semibold text-center mt-8 mb-4';
//     container.appendChild(title);

//     // 2) Canvas
//     const canvas = document.createElement('canvas');
//     canvas.width = 800;
//     canvas.height = 600;
//     canvas.className = 'border';
//     container.appendChild(canvas);

//     const ctx = canvas.getContext('2d')!;
//     if (!ctx) throw new Error('Impossible de récupérer le context 2D');

//     // 3) Instancier la logique du jeu
//     // const game = new PongGame(canvas.width, canvas.height);
//     // 3) Ouvrir websocket vers server
//     const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
//     const socketUrl = `${protocol}://${location.host}/ws/pong/${gameId}`;
//     const socket = new WebSocket(socketUrl);

//     let isSocketOpen = false;
//     socket.addEventListener('open', () => {
//         isSocketOpen = true;
//         // Si vous voulez envoyer un message « join » initial, vous pouvez le faire ici.
//         // ex. socket.send(JSON.stringify({ type: 'join', playerId: 1 }));
//     });

//     // 4) Gestion du clavier
//     const keysPressed: { [key: string]: boolean } = {};
//     window.addEventListener('keydown', (e) => {
//         keysPressed[e.code] = true;
//     });
//     window.addEventListener('keyup', (e) => {
//         keysPressed[e.code] = false;
//     });

//     // 5) Boucle client pour maj + rendu
//     let lastTime = performance.now();
//     function clientLoop(time: number) {
//         const dt = (time - lastTime) / 1000;
//         lastTime = time;

//         if (game.getState().isRunning) {
//             if (keysPressed['KeyW']) game.movePaddle(1, 'up', dt);
//             if (keysPressed['KeyS']) game.movePaddle(1, 'down', dt);
//             if (keysPressed['ArrowUp']) game.movePaddle(2, 'up', dt);
//             if (keysPressed['ArrowDown']) game.movePaddle(2, 'down', dt);

//             game.update(dt);

//             // Avant de rendre, on peut intercepter la fin de partie pour afficher l’alias du gagnant
//             const state = game.getState();
//             if (!state.isRunning) {
//                 // On supprime la boucle de rendu après avoir dessiné le dernier état
//                 renderGame(ctx, state);
//                 // Quel joueur a gagné ?
//                 let winnerAlias: string;
//                 let winnerText: string;
//                 if (state.score1 > state.score2) {
//                     winnerText = `${leftPlayer} a gagné !`;
//                     winnerAlias = leftPlayer;
//                 } else {
//                     winnerText = `${rightPlayer} a gagné !`;
//                     winnerAlias = rightPlayer;
//                 }
//                 // Afficher le message de victoire au centre du canvas
//                 ctx.fillStyle = '#FFD700';
//                 ctx.font = '50px Arial';
//                 const wm = ctx.measureText(winnerText).width;
//                 ctx.fillText(winnerText, (canvas.width - wm) / 2, canvas.height / 2);

//                 // Après un court délai (p. ex. 1 s) ou immédiatement, on notifie que le match est fini
//                 setTimeout(() => {
//                     onFinish(winnerAlias);
//                 }, 1000);
//                 return;
//             }
//             renderGame(ctx, state);
//         }
//         requestAnimationFrame(clientLoop);
//     }
//     requestAnimationFrame(clientLoop);
//     // 6) Démarrer la partie immédiatement
//     game.start();
// }
