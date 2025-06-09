import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { startPongInContainer } from './game/utils';
import { SidebarComponent } from "../components/sidebar.components";
import { UserService } from '../services/user.service';

export async function renderGamePage() {
  document.title = 'Pong';

  // sidebar + bg gradient
  const user = await UserService.getCurrentUser();
  SidebarComponent.render({
        userName: user.name,
        showStats: true,
        showBackHome: true
  });
  BackgroundComponent.applyNormalGradientLayout();

  // 1) Conteneur principal centré
  const container = document.createElement('div');
  container.className = `
    ml-60
    w-[calc(100%-15rem)]
    min-h-screen 
    flex
      flex-col 
      items-center 
      justify-center 
    p-8
  `.replace(/\s+/g,' ').trim()
  container.style.position = 'relative';
  container.style.zIndex = '0';
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
