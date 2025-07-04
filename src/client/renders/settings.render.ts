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
            await SidebarComponent.render({
                userName: userData.name,
				avatarUrl: userData.avatar,
                showStats: true,
                showSettings: false,
                showBackHome: true
            });

            // Render the main content with user name
            this.renderMainContent((userData.displayName || userData.name), userData.avatar);

        } catch (error) {
            console.error('Failed to fetch user data:', error);

            // Show error and redirect to auth
            CommonComponent.handleAuthError();
        }
    }

    /**
     * Render main content - can be called directly from SettingsPage
     */
static renderMainContent(userName: string, avatarUrl: string): void {
    // Main container with responsive height
    const wrapper = document.createElement('div');
    wrapper.className = 'main-content-centered';

    // Main container with glassmorphism effect and responsive height
    const mainContainer = document.createElement('div');
    mainContainer.className = `
        bg-white/90 backdrop-blur-md
        border-2 border-black
        rounded-xl p-6 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
        max-w-lg w-full mx-4 text-center
        responsive-height
    `.replace(/\s+/g, ' ').trim();

    const msgDisplay = document.createElement('div');
    msgDisplay.id = 'signup-msg-display';
    msgDisplay.className = 'text-center mt-4';

    // Welcome title with user's name
    const pageTitle = document.createElement('h1');
    pageTitle.textContent = `Settings for ${userName}`;
    pageTitle.className = `
        font-['Canada-big'] uppercase font-bold
        text-2xl md:text-3xl lg:text-4xl text-center mb-2
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
        text-sm font-medium mb-6
    `.replace(/\s+/g, ' ').trim();
    subtitle.style.letterSpacing = "0.05em";

    // Button container with responsive spacing
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex flex-col gap-3 justify-center mb-4';

    // 2FA Settings buttons
    const Enable2FAButton = CommonComponent.createStylizedButton('Enable 2FA', 'blue');
    Enable2FAButton.addEventListener('click', async () => {
        await AuthComponent.handle2FASetup();
    });

    const Disable2FA = CommonComponent.createStylizedButton('Disable 2FA', 'red');
    Disable2FA.addEventListener('click', async () => {
        await AuthComponent.disable2FA();
    });

    // Logout button
    const logoutButton = CommonComponent.createStylizedButton('Logout', 'red');
    logoutButton.addEventListener('click', async () => {
        const success = await AuthComponent.logoutUser();
        if (success) {
            setTimeout(() => {
                router.navigate('/auth');
            }, 1000);
        }
    });

    const saveButton = CommonComponent.createStylizedButton('Save', 'purple');
    saveButton.addEventListener('click', async () => {
        await UserComponent.saveSettings();
    });

    // Add emoji decorations
    const gameEmoji = document.createElement('div');
    gameEmoji.textContent = '⚙️';
    gameEmoji.className = 'text-3xl mb-3';

    // User settings container with responsive height
    const userSettingsContainer = document.createElement('div');
    userSettingsContainer.className = `
        bg-gray-50/80 backdrop-blur-sm
        border border-gray-200
        rounded-lg p-4 mb-4
        shadow-sm
    `.replace(/\s+/g, ' ').trim();

    const userNameLabel = CommonComponent.createLabel('Change display name');
    const userNameInput = CommonComponent.createInput('text', 'Enter your display name');
    userNameInput.id = 'username-input';

    const passwordLabel = CommonComponent.createLabel('Change password');
    const passwordInput = CommonComponent.createInput('password', 'Enter new password');
    passwordInput.id = 'password-input';

    buttonContainer.appendChild(Enable2FAButton);
    buttonContainer.appendChild(Disable2FA);
    buttonContainer.appendChild(logoutButton);

    const avatarSection = this.createAvatarSection(avatarUrl);

    userSettingsContainer.appendChild(userNameLabel);
    userSettingsContainer.appendChild(userNameInput);
    userSettingsContainer.appendChild(passwordLabel);
    userSettingsContainer.appendChild(passwordInput);
    userSettingsContainer.appendChild(saveButton);

    mainContainer.appendChild(gameEmoji);
    mainContainer.appendChild(pageTitle);
    mainContainer.appendChild(subtitle);
    mainContainer.appendChild(avatarSection);
    mainContainer.appendChild(userSettingsContainer);
    mainContainer.appendChild(buttonContainer);
    mainContainer.appendChild(msgDisplay);

    wrapper.appendChild(mainContainer);
    document.body.appendChild(wrapper);
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

private static createAvatarSection(currentAvatarUrl: string): HTMLDivElement {
    console.log('🔍 Creating avatar section with URL:', currentAvatarUrl);

    const avatarContainer = document.createElement('div');
    avatarContainer.className = `
        bg-gray-50/80 backdrop-blur-sm
        border border-gray-200
        rounded-lg p-6 mb-6
        shadow-sm text-center
    `.replace(/\s+/g, ' ').trim();

    // Avatar label
    const avatarLabel = CommonComponent.createLabel('Profile Avatar');
    avatarLabel.className = `font-['Orbitron'] mb-4 block text-center`;

    // Current avatar display
    const currentAvatar = document.createElement('img');

    // Set src with better fallback logic
    if (currentAvatarUrl && currentAvatarUrl !== 'null' && currentAvatarUrl !== 'undefined' && currentAvatarUrl.trim() !== '') {
        console.log('✅ Using provided avatar URL:', currentAvatarUrl);
        currentAvatar.src = currentAvatarUrl;
    } else {
        console.log('⚠️ No valid avatar URL, using default');
        currentAvatar.src = '/avatars/default.png';
    }

    currentAvatar.alt = 'Current avatar';
    currentAvatar.className = `
        w-24 h-24 rounded-full
        border-2 border-gray-300
        object-cover mx-auto mb-4
    `.replace(/\s+/g, ' ').trim();

    // Handle avatar load error with better debugging
    currentAvatar.onerror = (e) => {
        console.error('❌ Avatar load failed for:', currentAvatar.src);
        console.error('Error event:', e);

        if (currentAvatar.src.includes('default.png')) {
            console.error('❌ Even default avatar failed to load!');
            // Don't set onerror to null here, let it fail visibly
        } else {
            console.log('🔄 Falling back to default avatar');
            currentAvatar.src = '/avatars/default.png';
        }
    };

    currentAvatar.onload = () => {
        console.log('✅ Avatar loaded successfully:', currentAvatar.src);
    };

    // Rest of your avatar section code...
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.id = 'avatar-input';

    const uploadButton = CommonComponent.createStylizedButton('Change Avatar', 'blue');
    uploadButton.id = 'avatar-upload-btn';
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            await UserService.handleAvatarUpload(file, currentAvatar);
        }
    });

    avatarContainer.appendChild(avatarLabel);
    avatarContainer.appendChild(currentAvatar);
    avatarContainer.appendChild(uploadButton);
    avatarContainer.appendChild(fileInput);

    return avatarContainer;
}
}