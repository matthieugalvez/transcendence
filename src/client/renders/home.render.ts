import { router } from '../configs/simplerouter';
import { CommonComponent } from '../components/common.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import pongImg from '../assets/gameimg/screen-pongGame.png';
import spaceImg from '../assets/gameimg/spaceinvaders.jpg';


export class HomeRender {
  static async renderInto(container: HTMLDivElement): Promise<void> {
    // 1) loading dans container
    // const loader = this.createLoadingContainer();
    // container.appendChild(loader);
    BackgroundComponent.applyCenteredGradientLayout();

    try {
      const user = await UserService.getCurrentUser();
      // loader.remove();
      this.renderMainContent(container, user.name);
    } catch {
      // loader.remove();
      this.handleAuthError(container);
    }
  }

  private static createLoadingContainer(): HTMLDivElement {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading...';
    loadingText.className = `
      font-['Orbitron'] text-center text-gray-600
      text-lg font-medium
    `.replace(/\s+/g, ' ').trim();

    loadingContainer.appendChild(loadingText);
    return loadingContainer;
  }

  private static renderMainContent(container: HTMLDivElement, userName: string): void {
    // sidebar simulee pour flex
    const sidebarSim = document.createElement('div');
    sidebarSim.className = "w-[20%] p-6 z-0";
    container.appendChild(sidebarSim);

    // zone de contenu
    const content = document.createElement('div');
    content.className = `
      w-[80%]
      flex flex-col items-center
    `;

    // Grid de cartes
    const grid = document.createElement('div')
    grid.className = `
      flex flex-row gap-40 justify-center
      relative z-10 mx-auto mt-15
      font-['Orbitron']
    `.trim();

    const games = [
      { title: 'Pong',    route: '/game',       img: pongImg },
      { title: 'Space Invaders',   route: '/spaceInvadersGame', img: spaceImg },
    ] as const

    games.forEach(({ title, route, img }) => {
      const card = document.createElement('div')
      card.className = `
        flex flex-col items-center p-5 cursor-pointer
        hover:scale-105 transition-transform
      `.trim()
      card.onclick = () => router.navigate(route)

      // 1) Canvas
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 200
      canvas.className = 'border-2 border-gray-300 rounded-lg'
      const ctx = canvas.getContext('2d')!
      const image = new Image()
      image.src = img
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      }
      card.appendChild(canvas)

      // 2) Titre sous le canvas
      const label = document.createElement('p')
      label.textContent = title
      label.className = 'mt-4 font-bold text-xl text-white'
      card.appendChild(label)

      grid.appendChild(card)
    })
    content.appendChild(grid);
    container.appendChild(content);
  }

  private static handleAuthError(container: HTMLDivElement): void {
    // Show error message and redirect to auth
    const errorContainer = document.createElement('div');
    errorContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-red-500
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    const errorText = document.createElement('p');
    errorText.textContent = 'Authentication required';
    errorText.className = 'text-red-600 font-semibold mb-4';

    const loginButton = CommonComponent.createStylizedButton('Go to Login', 'blue');
    loginButton.addEventListener('click', () => {
      router.navigate('/auth');
    });

    errorContainer.appendChild(errorText);
    errorContainer.appendChild(loginButton);
    container.appendChild(errorContainer);
  }
}