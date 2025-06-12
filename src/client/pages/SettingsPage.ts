import '../styles.css';
import { SettingsRender } from '../renders/settings.render';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { SidebarComponent } from '../components/sidebar.component';
import { AuthComponent } from '../components/auth.component';

export async function SettingsPage(): Promise<void> {
	document.title = 'Transcendence - Settings';
	document.body.innerHTML = '';
	BackgroundComponent.applyCenteredGradientLayout();

	try {
		// Fetch user data first - if this fails, we handle it in catch block
		const userData = await UserService.getCurrentUser();

		if (!userData.displayName || userData.displayName == '') {
			//AuthRender.showDisplayNameModal()
			AuthComponent.checkAndHandleDisplayName();
		}

		// Only render sidebar and main content if authentication succeeds
		SidebarComponent.render({
			userName: userData.name,
			showStats: true,
			showSettings: false, // Don't show settings button on settings page
			showBackHome: true
		});

		// Render the main content with user data
		await SettingsRender.renderMainContent(userData.displayName || userData.name);

	} catch (error) {
		console.error('Failed to fetch user data:', error);

		// Show error and redirect to auth - consistent with other pages
		CommonComponent.handleAuthError();
	}
}
