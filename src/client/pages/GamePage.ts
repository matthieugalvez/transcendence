import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { startPongInContainer, showGameOverOverlay } from './game/utils';
import { SidebarComponent } from "../components/sidebar.component";
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';

export async function renderGamePage() {
  // clean
  document.body.innerHTML = '';

  // creation page
  document.title = 'Pong';

  try {
    // get user name
    const user = await UserService.getCurrentUser();
    const leftPlayer = user?.name || "Player 1";
    const rightPlayer = "Player 2";
    const matchTitle = `${leftPlayer} vs ${rightPlayer}`;

    // sidebar + gradiant bg
    SidebarComponent.render({ userName: user.name, showStats:true, showBackHome:true, showSettings:true });
    BackgroundComponent.applyNormalGradientLayout();

    const wrapper = document.createElement('div');
    wrapper.className = `
      ml-60 w-[calc(100%-15rem)] min-h-screen flex items-center justify-center p-8 relative
    `.replace(/\s+/g,' ').trim();
    document.body.appendChild(wrapper);

    const gameContainer = document.createElement('div');
    gameContainer.className = 'relative z-0';
    wrapper.appendChild(gameContainer);

    // initialise sans lancer
    const gameId = Date.now().toString();
    const { start } = startPongInContainer(
      gameContainer,
      matchTitle,
      leftPlayer,
      rightPlayer,
      (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderGamePage),
      gameId
    );

    // overlay de contrôles
    const controls = document.createElement('div');
    controls.className = `
      absolute flex flex-col items-center justify-center
      space-y-4 z-10
    `.replace(/\s+/g,' ').trim();
    wrapper.appendChild(controls);

    const canvas = gameContainer.querySelector('canvas');
    if (canvas) canvas.classList.add('blur-xs');

    const startBtn = CommonComponent.createStylizedButton('Start','blue');
    startBtn.onclick = () => {
      if (canvas) canvas.classList.remove('blur-xs'); // remove blur
      controls.remove(); // cache les boutons
      start();
    };
    controls.appendChild(startBtn);

    const tourBtn = CommonComponent.createStylizedButton('Tournament','purple');
    tourBtn.onclick = () => router.navigate('/tournament');
    controls.appendChild(tourBtn);

  } catch (error) {
    console.error('Failed to fetch user data:', error);
    CommonComponent.handleAuthError();
  }
}