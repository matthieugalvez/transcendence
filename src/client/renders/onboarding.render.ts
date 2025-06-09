import { router } from '../configs/simplerouter';
import { CommonComponent } from '../components/common.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';


export class OnboardingRender {
	
	static async render(): Promise<void> {
		document.title = 'Transcendence - Home';
		document.body.innerHTML = '';

		// Apply centered gradient layout using BackgroundComponent
		BackgroundComponent.applyCenteredGradientLayout();

		// Create loading container first
		const loadingContainer = this.createLoadingContainer();
		document.body.appendChild(loadingContainer);

		try {
			// Fetch user data using UserService
			const userData = await UserService.getCurrentUser();

			// Remove loading container
			loadingContainer.remove();

			// Render the main content with user name
			this.renderMainContent(userData.name);

		} catch (error) {
			console.error('Failed to fetch user data:', error);

			// Remove loading container
			loadingContainer.remove();

			// Show error or redirect to auth
			this.handleAuthError();
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

	private static renderMainContent(userName: string): void {
		// Main container with glassmorphism effect
		const mainContainer = document.createElement('div');
		mainContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

		const msgDisplay = document.createElement('div');
		msgDisplay.id = 'signup-msg-display';
		msgDisplay.className = 'text-center mt-4';


		// Welcome title with user's name
		const pageTitle = document.createElement('h1');
		pageTitle.textContent = `Welcome ${userName}!`;
		pageTitle.className = `
      font-['Canada-big'] uppercase font-bold
      text-4xl text-center mb-2
      bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
      bg-clip-text text-transparent
      select-none
    `.replace(/\s+/g, ' ').trim();
		pageTitle.style.letterSpacing = "0.1em";

		// Subtitle
		const subtitle = document.createElement('p');
		subtitle.textContent = 'Choose your game mode';
		subtitle.className = `
      font-['Orbitron'] text-center text-gray-600
      text-sm font-medium mb-8
    `.replace(/\s+/g, ' ').trim();
		subtitle.style.letterSpacing = "0.05em";

		// Button container
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex flex-col gap-4 justify-center';

		// Play button
		const playButton = CommonComponent.createStylizedButton('Play', 'blue');
		playButton.addEventListener('click', () => {
			router.navigate('/game');
		});

		// Tournament button
		const tournamentButton = CommonComponent.createStylizedButton('Tournament', 'purple');
		tournamentButton.addEventListener('click', () => {
			router.navigate('/tournament');
		});

		// Back to home button
		const backButton = CommonComponent.createStylizedButton('Back to Home', 'gray');
		backButton.addEventListener('click', () => {
			router.navigate('/');
		});




		// Logout button
		const logoutButton = CommonComponent.createStylizedButton('Logout', 'red');
		logoutButton.addEventListener('click', async () => {
			const success = await AuthComponent.logoutUser();
			if (success) {
				// Redirect to auth page after successful logout
				setTimeout(() => {
					router.navigate('/auth');
				}, 1000);
			}
		});

		const Enable2FAButton = CommonComponent.createStylizedButton('Enable2FA', 'blue');
		Enable2FAButton.addEventListener('click', async () => {
			await AuthComponent.handle2FASetup();
		});

		const Disable2FA = CommonComponent.createStylizedButton('Disable 2FA', 'red');
		Disable2FA.addEventListener('click', async () => {
			await AuthComponent.Disable2FA();
		});




		// Add emoji decorations
		const gameEmoji = document.createElement('div');
		gameEmoji.textContent = '🏓';
		gameEmoji.className = 'text-4xl mb-4';

		// Assemble elements
		buttonContainer.appendChild(playButton);
		buttonContainer.appendChild(tournamentButton);
		buttonContainer.appendChild(backButton);
		buttonContainer.appendChild(Enable2FAButton);
		buttonContainer.appendChild(Disable2FA);
		buttonContainer.appendChild(logoutButton);

		mainContainer.appendChild(gameEmoji);
		mainContainer.appendChild(pageTitle);
		mainContainer.appendChild(subtitle);
		mainContainer.appendChild(buttonContainer);

		mainContainer.appendChild(msgDisplay);
		document.body.appendChild(mainContainer);
	}

	private static handleAuthError(): void {
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
		document.body.appendChild(errorContainer);
	}
}