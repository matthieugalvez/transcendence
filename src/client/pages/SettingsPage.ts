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
        let user = await UserService.getCurrentUser();

        if(!user.displayName || user.displayName == '') {
            const result = await AuthComponent.checkAndHandleDisplayName();
            if (result.success && result.userData) {
                user = result.userData;
            } else {
                return;
            }
        }

        // Content-aware sidebar (hides settings button when on settings page)
        await SidebarComponent.render({
            userName: user.displayName,
            avatarUrl: user.avatar,
            showStats: true,
            showSettings: false, // Hide settings button since we're on settings page
            showBackHome: true,
            showUserSearch: false,
            showFriendsBtn: true
        });

        // Render the main content with user data
        await SettingsRender.renderMainContent(user.displayName || user.displayName, user.avatar);

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        CommonComponent.handleAuthError();
    }
}