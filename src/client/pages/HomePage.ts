import '../styles.css';
import { HomeRender } from '../renders/home.render';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';

export async function RenderHomePage(): Promise<void> {
    document.title = "Home";
    document.body.innerHTML = "";
    BackgroundComponent.applyAnimatedGradient();

    try {
        // Fetch user data first - if this fails, we handle it in catch block
        const user = await UserService.getCurrentUser();

        // Only render sidebar and main content if authentication succeeds
        SidebarComponent.render({
            userName: user.name,
            showStats: true,
            showSettings: true,
            showBackHome: false
        });

        const main = document.createElement("div");
        main.className = "min-h-screen min-w-screen flex items-start justify-center";
        document.body.appendChild(main);
        await HomeRender.renderInto(main);

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
    errorText.textContent = 'You need to be logged in to access the home page.';
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