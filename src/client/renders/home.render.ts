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
		//  BackgroundComponent.applyCenteredGradientLayout();

		try {
			const user = await UserService.getCurrentUser();
			// loader.remove();
			this.renderMainContent(container, user.displayName);
		} catch {
			// loader.remove();
			this.handleAuthError(container);
		}
	}

	private static renderMainContent(container: HTMLDivElement, userName: string): void {
		// sidebar simulée pour flex
		// const sidebarSim = document.createElement('div');
		// sidebarSim.className = "w-[20%] p-6 z-0";
		// container.appendChild(sidebarSim);

		// zone de contenu
		const content = document.createElement('div');
		content.className = `

      flex flex-col items-center
    `;

		// Grid de cartes
		const grid = document.createElement('div')
		grid.className = `
      grid grid-cols-1 gap-20
      relative z-10 mx-auto mt-15
      font-['Orbitron']
      place-items-center
    `.trim();

		const games = [
			{ title: 'Pong', route: '/game', img: pongImg }
		] as const

		games.forEach(({ title, route, img }) => {
			const card = document.createElement('div')
			card.className = `
        flex flex-col items-center p-8 cursor-pointer
        hover:scale-105 transition-transform
      `.trim()
			card.onclick = () => router.navigate(route)

			// Canvas
			const canvas = document.createElement('canvas')
			canvas.width = 400
			canvas.height = 250
			canvas.className = 'border-2 border-gray-300 rounded-lg'
			const ctx = canvas.getContext('2d')!
			const image = new Image()
			image.src = img
			image.onload = () => {
				ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
			}
			card.appendChild(canvas)

			// Titre sous le canvas
			const label = document.createElement('p')
			label.textContent = title
			label.className = 'mt-4 font-bold text-xl text-white'
			card.appendChild(label)

			grid.appendChild(card)
		})

		// Add leaderboard card
		const leaderboardCard = this.createLeaderboardCard();
		grid.appendChild(leaderboardCard);

		content.appendChild(grid);
		container.appendChild(content);
	}


	private static createLeaderboardCard(): HTMLElement {
		const card = document.createElement('div');
		card.className = `
      flex flex-col items-center p-8 cursor-pointer
      hover:scale-105 transition-transform
      bg-white/10 backdrop-blur-md
      border-2 border-white/30 rounded-lg
      min-w-[400px]
    `.trim();

		//card.onclick = () => router.navigate('/leaderboard');

		// Leaderboard container
		const leaderboardContainer = document.createElement('div');
		leaderboardContainer.className = 'w-full h-[200px] overflow-hidden';

		// Title
		const title = document.createElement('h3');
		title.textContent = 'Leaderboard';
		title.className = 'text-white font-bold text-lg mb-3 text-center';
		leaderboardContainer.appendChild(title);

		// Loading placeholder
		const loadingText = document.createElement('p');
		loadingText.textContent = 'Loading...';
		loadingText.className = 'text-white/70 text-center';
		leaderboardContainer.appendChild(loadingText);

		// Load leaderboard data
		this.loadLeaderboardData(leaderboardContainer, loadingText);

		card.appendChild(leaderboardContainer);

		return card;
	}

	private static async loadLeaderboardData(container: HTMLElement, loadingElement: HTMLElement): Promise<void> {
		try {
			const response = await fetch('/api/leaderboard', {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to fetch leaderboard');
			}

			const leaderboard = await response.json();
			loadingElement.remove();

			// Create leaderboard list
			const list = document.createElement('div');
			list.className = 'space-y-2';

			leaderboard.slice(0, 5).forEach((player: any, index: number) => {
				const playerItem = document.createElement('div');
				playerItem.className = 'flex items-center justify-between text-white/90 text-sm px-2';

				const leftSide = document.createElement('div');
				leftSide.className = 'flex items-center space-x-2 flex-1';

				const rank = document.createElement('span');
				rank.textContent = `${index + 1}.`;
				rank.className = `font-bold w-6 text-center ${index < 3 ? 'text-yellow-400' : 'text-white/70'}`;

				const avatar = document.createElement('img');
				avatar.src = player.avatar
				// console.log(`Leaderboard avatar URL debug : ${player.avatar}`);
				avatar.alt = player.displayName;
				avatar.className = 'w-6 h-6 rounded-full flex-shrink-0';


				const name = document.createElement('span');
				name.textContent = player.displayName;
				name.className = 'truncate max-w-[120px] cursor-pointer hover:text-blue-400 transition-colors';
				name.onclick = () => router.navigate(`/profile/${player.displayName}`);

				leftSide.appendChild(rank);
				leftSide.appendChild(avatar);
				leftSide.appendChild(name);

				const wins = document.createElement('span');
				const totalWins = (player.oneVOneWins || 0) + (player.tournamentWins || 0);
				wins.textContent = `${totalWins} Wins`;
				wins.className = 'font-semibold text-green-400 flex-shrink-0';

				playerItem.appendChild(leftSide);
				playerItem.appendChild(wins);
				list.appendChild(playerItem);
			});

			container.appendChild(list);

		} catch (error) {
			console.error('Failed to load leaderboard:', error);
			loadingElement.textContent = 'Failed to load';
			loadingElement.className = 'text-red-400 text-center text-sm';
		}
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
		loginButton.onclick = () => router.navigate('/auth');

		errorContainer.appendChild(errorText);
		errorContainer.appendChild(loginButton);
		container.appendChild(errorContainer);
	}
}