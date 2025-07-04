import '../styles.css';
import { SidebarComponent } from '../components/sidebar.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { AuthComponent } from '../components/auth.component';
import { StatsRender } from '../renders/stats.render';

export async function StatsPage(params?: { userId?: string; displayName?: string }): Promise<void> {
    document.title = 'Transcendence - Statistics';
    document.body.innerHTML = '';
    BackgroundComponent.applyCenteredGradientLayout();

    try {
        // Get current user for authentication and sidebar
        let currentUser = await UserService.getCurrentUser();

        if (!currentUser.displayName || currentUser.displayName === '') {
            const result = await AuthComponent.checkAndHandleDisplayName();
            if (result.success && result.userData) {
                currentUser = result.userData;
            } else {
                return;
            }
        }

        // Determine which user's stats to show
        let statsUser;
        let isOwnStats = false;

        if (params?.displayName) {
            statsUser = await UserService.getUserProfileByDisplayName(params.displayName);
            isOwnStats = statsUser.id === currentUser.id;
        } else if (params?.userId) {
            statsUser = await UserService.getUserProfile(params.userId);
            isOwnStats = statsUser.id === currentUser.id;
        } else {
            statsUser = currentUser;
            isOwnStats = true;
        }

        // Render content-aware sidebar (hides stats button when on stats page)
        await SidebarComponent.render({
            userName: currentUser.displayName,
            avatarUrl: currentUser.avatar,
            showStats: false, // Hide stats button since we're on stats page
            showSettings: true,
            showBackHome: true,
            showUserSearch: false,
            showFriendsBtn: true
        });

        // Render the stats content
        await StatsRender.renderStatsContent(statsUser, isOwnStats);

    } catch (error) {
        console.error('Failed to load statistics:', error);
        CommonComponent.handleAuthError();
    }
}