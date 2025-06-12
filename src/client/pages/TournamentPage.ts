import '../styles.css';
import { startPongInContainer } from '../utils/game.utils';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { TournamentComponent } from '../components/tournament.component';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';

export async function renderTournamentPage() {
  document.title = 'Tournoi';
  document.body.innerHTML = '';

  // Sidebar et BG
  const user = await UserService.getCurrentUser();
  SidebarComponent.render({
    userName: user.name,
    showStats: true,
    showBackHome: true
  });
  BackgroundComponent.applyNormalGradientLayout();

  // Main layout
  const wrapper = document.createElement('div');
  wrapper.className = `
    ml-40 w-[calc(100%-15rem)] min-h-screen
    flex items-center justify-center
    p-8 relative
  `.replace(/\s+/g,' ').trim();
  document.body.appendChild(wrapper);

  // Canvas de fond inactif (juste le visuel)
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'relative flex flex-col items-center justify-center';
  wrapper.appendChild(canvasContainer);
  startPongInContainer(
    canvasContainer,
    '', 'Player 1', 'Player 2', () => {}, Date.now().toString()
  );
  const canvas = canvasContainer.querySelector('canvas') as HTMLCanvasElement | null;

  // Overlay de saisie d’alias
  TournamentComponent.showAliasOverlay(canvas, wrapper, (aliases) => launchTournament(aliases, wrapper));
}


async function launchTournament(aliases: string[], wrapper: HTMLElement) {
  // Prépare la structure des matchs (demi-finales + finale)
  const matchups: [string, string][] = [
    [aliases[0], aliases[1]],
    [aliases[2], aliases[3]],
    ['', ''], // Finale, remplie après les demi-finales
  ];
  const winners: string[] = [];
  wrapper.innerHTML = '';

  // Fonction récursive pour enchaîner les matchs
  async function playMatch(i: number) {
    if (i === 2) {
      matchups[2][0] = winners[0];
      matchups[2][1] = winners[1];
    }

    const [leftAlias, rightAlias] = matchups[i];
    const matchTitle = `Match ${i + 1} : ${leftAlias} vs ${rightAlias}`;
    wrapper.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.className = 'flex flex-col items-center justify-center p-4';
    wrapper.appendChild(gameContainer);

    let gameId: string;
    try {
      gameId = await GameService.requestNewGameId();
    } catch (err) {
      const errMsg = document.createElement('p');
      errMsg.textContent = 'Erreur serveur, réessayez plus tard';
      errMsg.className = 'text-red-600';
      wrapper.appendChild(errMsg);
      return;
    }

    // Lancement du match
    const pongHandle = startPongInContainer(
      gameContainer, matchTitle, leftAlias, rightAlias,
      (winnerAlias: string) => {
        winners.push(winnerAlias);
        // Transition entre les matchs
        TournamentComponent.showTransitionPanel(gameContainer, i, matchups, winnerAlias, winners, () => playMatch(i + 1));
      },
      gameId
    );
    pongHandle.start();
  }
  await playMatch(0);
}
