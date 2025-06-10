import { router } from '../configs/simplerouter';
import { CommonComponent } from '../components/common.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';


export class OnboardingRender {
  static async render(language_obj: object): Promise<void> {
	document.title = `${language_obj['Onboardingpage_title']}`
	document.body.innerHTML = '';

    // Apply centered gradient layout using BackgroundComponent
    BackgroundComponent.applyCenteredGradientLayout();

    // Create loading container first
    const loadingContainer = this.createLoadingContainer(language_obj);
    document.body.appendChild(loadingContainer);

    try {
      // Fetch user data using UserService
      const userData = await UserService.getCurrentUser();

      // Remove loading container
      loadingContainer.remove();

      // Render the main content with user name
      this.renderMainContent(userData.name, language_obj);

    } catch (error) {
      console.error(`${language_obj['Onboardingpage_error_fetch_data']}`, error);

      // Remove loading container
      loadingContainer.remove();

      // Show error or redirect to auth
      this.handleAuthError(language_obj);
    }
  }

  private static createLoadingContainer(language_obj: object): HTMLDivElement {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    const loadingText = document.createElement('p');
    loadingText.textContent = `${language_obj['Onboardingpage_loading']}`;
    loadingText.className = `
      font-['Orbitron'] text-center text-gray-600
      text-lg font-medium
    `.replace(/\s+/g, ' ').trim();

    loadingContainer.appendChild(loadingText);
    return loadingContainer;
  }

  private static renderMainContent(userName: string, language_obj: object): void {
    // Main container with glassmorphism effect
    const mainContainer = document.createElement('div');
    mainContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    // Welcome title with user's name
    const pageTitle = document.createElement('h1');
    pageTitle.textContent = `${language_obj['Onboardingpage_welcome']} ${userName}!`;
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
    subtitle.textContent = `${language_obj['Onboardingpage_box_subtitle']}`;
    subtitle.className = `
      font-['Orbitron'] text-center text-gray-600
      text-sm font-medium mb-8
    `.replace(/\s+/g, ' ').trim();
    subtitle.style.letterSpacing = "0.05em";

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex flex-col gap-4 justify-center';

    // Play button
    const playButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_play_button']}`, 'blue');
    playButton.addEventListener('click', () => {
      router.navigate('/game');
    });

    // Tournament button
    const tournamentButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_tournament_button']}`, 'purple');
    tournamentButton.addEventListener('click', () => {
      router.navigate('/tournament');
    });

    // Back to home button
    const backButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_backhome_button']}`, 'gray');
    backButton.addEventListener('click', () => {
      router.navigate('/');
    });

	    // Logout button
    const logoutButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_logout_button']}`, 'red');
    logoutButton.addEventListener('click', async () => {
      const success = await AuthComponent.logoutUser();
      if (success) {
        // Redirect to auth page after successful logout
        setTimeout(() => {
          router.navigate('/auth');
        }, 1000);
      }
    });

    const EnglishLanguageButton = CommonComponent.createStylizedButton('set language to english', 'red');
    EnglishLanguageButton.addEventListener('click', async () => {
		const language = 'eng';
		const success = await AuthComponent.SetLanguageUser(language);
		if (success.error) {
				CommonComponent.showMessage('Failed to change language', 'error');
			}
		location.reload();
    });

    const FrenchLanguageButton = CommonComponent.createStylizedButton('set language to french', 'blue');
    FrenchLanguageButton.addEventListener('click', async () => {
		const language = 'fr';
		const success = await AuthComponent.SetLanguageUser(language);
		if (success.error) {
				CommonComponent.showMessage('Failed to change language', 'error');
			}
		location.reload();
    });

    // Add emoji decorations
    const gameEmoji = document.createElement('div');
    gameEmoji.textContent = '🏓';
    gameEmoji.className = 'text-4xl mb-4';

    // Assemble elements
    buttonContainer.appendChild(playButton);
    buttonContainer.appendChild(tournamentButton);
    buttonContainer.appendChild(backButton);
	buttonContainer.appendChild(logoutButton);
	buttonContainer.appendChild(EnglishLanguageButton);
	buttonContainer.appendChild(FrenchLanguageButton);

    mainContainer.appendChild(gameEmoji);
    mainContainer.appendChild(pageTitle);
    mainContainer.appendChild(subtitle);
    mainContainer.appendChild(buttonContainer);

    document.body.appendChild(mainContainer);
  }

  private static handleAuthError(language_obj: object): void {
    // Show error message and redirect to auth
    const errorContainer = document.createElement('div');
    errorContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-red-500
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-lg w-full mx-4 text-center
    `.replace(/\s+/g, ' ').trim();

    const errorText = document.createElement('p');
    errorText.textContent = `${language_obj['Onboardingpage_error_authrequired']}`;
    errorText.className = 'text-red-600 font-semibold mb-4';

    const loginButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_login_button']}`, 'blue');
    loginButton.addEventListener('click', () => {
      router.navigate('/auth');
    });


    errorContainer.appendChild(errorText);
    errorContainer.appendChild(loginButton);
    document.body.appendChild(errorContainer);
  }
}
