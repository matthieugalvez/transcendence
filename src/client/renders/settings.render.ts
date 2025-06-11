import { router } from '../configs/simplerouter';
import { CommonComponent } from '../components/common.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';
import { SidebarComponent } from "../components/sidebar.component";
import { UserComponent } from '../components/user.component';

export class SettingsRender {

    static async render(): Promise<void> {
        document.title = 'Transcendence - Settings';
        BackgroundComponent.applyCenteredGradientLayout();

        try {
            // Fetch user data first - if this fails, we handle it in catch block
            const userData = await UserService.getCurrentUser();

            // Only render sidebar and main content if authentication succeeds
            SidebarComponent.render({
                userName: userData.name,
                showStats: true,
                showSettings: false,
                showBackHome: true
            });

            // Render the main content with user name
            this.renderMainContent(userData.displayName || userData.name);

        } catch (error) {
            console.error('Failed to fetch user data:', error);

            // Show error and redirect to auth
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
        pageTitle.textContent = `Settings for ${userName}`;
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
        subtitle.textContent = 'Manage your account settings';
        subtitle.className = `
      font-['Orbitron'] text-center text-gray-600
      text-sm font-medium mb-8
    `.replace(/\s+/g, ' ').trim();
        subtitle.style.letterSpacing = "0.05em";

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex flex-col gap-4 justify-center';

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

        const userSettingsContainer = document.createElement('div');
        userSettingsContainer.className = `
        bg-gray-50/80 backdrop-blur-sm
        border border-gray-200
        rounded-lg p-6 mb-6
        shadow-sm
        `.replace(/\s+/g, ' ').trim();

        // 2FA Settings buttons.
        const Enable2FAButton = CommonComponent.createStylizedButton('Enable 2FA', 'blue');
        Enable2FAButton.addEventListener('click', async () => {
            await AuthComponent.handle2FASetup();
        });

        const Disable2FA = CommonComponent.createStylizedButton('Disable 2FA', 'red');
        Disable2FA.addEventListener('click', async () => {
            await AuthComponent.disable2FA();
        });

        const saveButton = CommonComponent.createStylizedButton('Save', 'purple');
        saveButton.addEventListener('click', async () => {
            await UserComponent.saveSettings();
        });

        // Add emoji decorations
        const gameEmoji = document.createElement('div');
        gameEmoji.textContent = '⚙️';
        gameEmoji.className = 'text-4xl mb-4';

        const userNameLabel = CommonComponent.createLabel('Change display name');
        const userNameInput = CommonComponent.createInput('text', 'Enter your display name');
        userNameInput.id = 'username-input';

        const passwordLabel = CommonComponent.createLabel('Change password');
        const passwordInput = CommonComponent.createInput('password', 'Enter new password');
        passwordInput.id = 'password-input';

        buttonContainer.appendChild(Enable2FAButton);
        buttonContainer.appendChild(Disable2FA);
        buttonContainer.appendChild(logoutButton);

        mainContainer.appendChild(gameEmoji);
        mainContainer.appendChild(pageTitle);
        mainContainer.appendChild(subtitle);
        userSettingsContainer.appendChild(userNameLabel);
        userSettingsContainer.appendChild(userNameInput);
        userSettingsContainer.appendChild(passwordLabel);
        userSettingsContainer.appendChild(passwordInput);
        userSettingsContainer.appendChild(saveButton);

        mainContainer.appendChild(userSettingsContainer);
        mainContainer.appendChild(buttonContainer);
        mainContainer.appendChild(msgDisplay);
        document.body.appendChild(mainContainer);
    }

    private static handleAuthError(): void {
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
        errorText.textContent = 'You need to be logged in to access settings.';
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
}