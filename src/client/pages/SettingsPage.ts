import '../styles.css';
import { SettingsRender } from '../renders/settings.render';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { SidebarComponent } from '../components/sidebar.component';
import { AuthComponent } from '../components/auth.component';

export async function SettingsPage(): Promise<void> {
	document.title = 'Transcendence - Settings';
	document.body.innerHTML = '';
	BackgroundComponent.applyCenteredGradientLayout();

	try {
		// Fetch user data first - if this fails, we handle it in catch block
		 let user = await UserService.getCurrentUser();

        if(!user.displayName || user.displayName == '') {
            const result = await AuthComponent.checkAndHandleDisplayName();
            if (result.success && result.userData) {
                // Use the updated user data
                user = result.userData;
            } else {
                // If checkAndHandleDisplayName failed, it already handled redirect
                return;
            }
        }

		// Only render sidebar and main content if authentication succeeds
		SidebarComponent.render({
			userName: user.displayName,
			avatarUrl: user.avatar,
			showStats: true,
			showSettings: false, // Don't show settings button on settings page
			showBackHome: true
		});

		// Render the main content with user data
		await SettingsRender.renderMainContent(user.displayName || user.name, user.avatar);

	} catch (error) {
		console.error('Failed to fetch user data:', error);

		// Show error and redirect to auth - consistent with other pages
		CommonComponent.handleAuthError();
	}
}
