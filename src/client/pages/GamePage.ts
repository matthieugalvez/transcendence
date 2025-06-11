import '../styles.css';
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { UserService } from '../services/user.service';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';

// Sous-fonction pour le wrapper principal
function createMainWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = `
    ml-60 w-[calc(100%-15rem)] min-h-screen flex items-center justify-center p-8 relative
  `.replace(/\s+/g,' ').trim();
  document.body.appendChild(wrapper);
  return wrapper;
}

// Sous-fonction pour la barre de contrôles
function createGameControls(
  wrapper: HTMLElement,
  onStart: () => void,
  onTournament: () => void,
  canvas?: HTMLCanvasElement | null
) {
  const controls = document.createElement('div');
  controls.className = `
    absolute flex flex-col items-center justify-center
    space-y-4 z-10
  `.replace(/\s+/g,' ').trim();

  const startBtn = CommonComponent.createStylizedButton('Start','blue');
  startBtn.onclick = () => {
    if (canvas) canvas.classList.remove('blur-xs');
    controls.remove();
    onStart();
  };
  controls.appendChild(startBtn);

  const tourBtn = CommonComponent.createStylizedButton('Tournament','purple');
  tourBtn.onclick = onTournament;
  controls.appendChild(tourBtn);

  wrapper.appendChild(controls);
}

export async function renderPongGamePage() {
  // clean page
  document.body.innerHTML = '';
  document.title = 'Pong';

  // get user
  const user = await UserService.getCurrentUser();
  const leftPlayer = user?.name || "Player 1";
  const rightPlayer = "Player 2";
  const matchTitle = `${leftPlayer} vs ${rightPlayer}`;

  // layout de base
  SidebarComponent.render({ userName: user.name, showStats:true, showBackHome:true });
  BackgroundComponent.applyNormalGradientLayout();

  const wrapper = createMainWrapper();
  const gameContainer = document.createElement('div');
  gameContainer.className = 'relative z-0';
  wrapper.appendChild(gameContainer);

  const gameId = Date.now().toString();
  const { start } = startPongInContainer(
    gameContainer,
    matchTitle,
    leftPlayer,
    rightPlayer,
    (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderPongGamePage),
    gameId
  );

  const canvas = gameContainer.querySelector('canvas') as HTMLCanvasElement | null;
  if (canvas) canvas.classList.add('blur-xs');

  createGameControls(
    wrapper,
    start,
    () => router.navigate('/tournament'),
    canvas
  );
}
