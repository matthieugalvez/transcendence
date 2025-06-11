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
    handleAuthError();
  }
}

/**
 * Handle authentication error - same as SettingsRender.handleAuthError
 */
function handleAuthError(): void {
    // Clear any existing content first
    document.body.innerHTML = '';

    // Apply background
    BackgroundComponent.applyCenteredGradientLayout();

    // Show error message and redirect to auth
    const errorContainer = document.createElement('div');
    errorContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-red-500
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    const errorIcon = document.createElement('div');
    errorIcon.textContent = '🔒';
    errorIcon.className = 'text-4xl mb-4';

    const errorTitle = document.createElement('h2');
    errorTitle.textContent = 'Authentication Required';
    errorTitle.className = `
        font-['Canada-big'] uppercase font-bold
        text-2xl text-center mb-2
        text-red-600
        select-none
    `.replace(/\s+/g, ' ').trim();

    const errorText = document.createElement('p');
    errorText.textContent = 'You need to be logged in to play games.';
    errorText.className = 'text-red-600 font-semibold mb-6';

    const loginButton = CommonComponent.createStylizedButton('Go to Login', 'blue');
    loginButton.addEventListener('click', () => {
        router.navigate('/auth');
    });

    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorText);
    errorContainer.appendChild(loginButton);
    document.body.appendChild(errorContainer);

    // Auto-redirect after 3 seconds
    setTimeout(() => {
        router.navigate('/auth');
    }, 3000);
}