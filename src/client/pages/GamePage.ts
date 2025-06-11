import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { startPongInContainer } from './game/utils';
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();

export function renderGamePage() {
  document.title = 'Transcendence - Pong';
  BackgroundComponent.applyNormalGradientLayout();

  // 1) Conteneur principal centré
  const container = document.createElement('div');
  container.className = 'min-h-screen flex flex-col items-center justify-center p-8';
  container.style.position = 'relative';
  container.style.zIndex = '0';
  document.body.appendChild(container);

  // 2) Générer un gameId unique (par exemple à partir de la date courante)
  const gameId = Date.now().toString();

  // 3) Appeler l’utilitaire pour ouvrir la WebSocket et démarrer le rendu
  startPongInContainer(
    container,
    `${language_obj['Gamepage_player']} 1`,
    `${language_obj['Gamepage_player']} 2`,
    (winnerAlias: string) => {
      // Ici on efface et on affiche le message final
      container.innerHTML = '';
      const msg = document.createElement('h2');
      msg.textContent = `${language_obj['Gamepage_winner']} ${winnerAlias} !`;
      msg.className = 'text-3xl font-bold text-center mt-8';
      container.appendChild(msg);
    },
    gameId
  );
}
