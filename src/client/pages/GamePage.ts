import '../styles.css';
import { startPongInContainer } from './game/utils';

export function renderGamePage() {
  document.title = 'Transcendance - Pong';

  // 1) Conteneur principal centré
  const container = document.createElement('div');
  container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
  document.body.appendChild(container);

  // 2) Générer un gameId unique (par exemple à partir de la date courante)
  const gameId = Date.now().toString();

  // 3) Appeler l’utilitaire pour ouvrir la WebSocket et démarrer le rendu
  startPongInContainer(
    container,
    'Player 1 vs Player 2',
    'Player 1',
    'Player 2',
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
