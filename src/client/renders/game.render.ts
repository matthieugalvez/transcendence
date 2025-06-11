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
    // get user name - if this fails, we handle it in catch block
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
    const pongHandle = startPongInContainer(
      gameContainer,
      matchTitle,
      leftPlayer,
      rightPlayer,
      (winner) => {
        showGameOverOverlay(gameContainer, winner, () => {
          // Restart game logic
          pongHandle.restart();
        });
      },
      gameId
    );

    // Controls sous le jeu
    const controls = document.createElement('div');
    controls.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10';

    const startBtn = CommonComponent.createStylizedButton('Start Game', 'green');
    startBtn.onclick = () => pongHandle.start();
    controls.appendChild(startBtn);

    const pauseBtn = CommonComponent.createStylizedButton('Pause', 'yellow');
    pauseBtn.onclick = () => pongHandle.pause();
    controls.appendChild(pauseBtn);

    const resetBtn = CommonComponent.createStylizedButton('Reset', 'red');
    resetBtn.onclick = () => pongHandle.restart();
    controls.appendChild(resetBtn);

    const tourBtn = CommonComponent.createStylizedButton('Tournament', 'purple');
    tourBtn.onclick = () => router.navigate('/tournament');
    controls.appendChild(tourBtn);

    wrapper.appendChild(controls);

  } catch (error) {
    console.error('Failed to fetch user data:', error);

    // Show error and redirect to auth - same as SettingsRender
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