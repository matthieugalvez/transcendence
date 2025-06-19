import '../styles.css';
import { ProfileRender } from '../renders/profile.render';
import { SidebarComponent } from '../components/sidebar.component';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { AuthComponent } from '../components/auth.component';
import { router } from '../configs/simplerouter';

export async function ProfilePage(params?: { userId?: string; displayName?: string }): Promise<void> {
    document.title = 'Transcendence - Profile';
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

        // Determine which profile to show
        let profileUser;
        let isOwnProfile = false;

        if (params?.displayName) {
            // Show specific user's profile by displayName
            profileUser = await UserService.getUserProfileByDisplayName(params.displayName);
            isOwnProfile = profileUser.id === currentUser.id;
        } else if (params?.userId) {
            // Fallback: show specific user's profile by userId
            profileUser = await UserService.getUserProfile(params.userId);
            isOwnProfile = profileUser.id === currentUser.id;
        } else {
            // Show current user's profile
            profileUser = currentUser;
            isOwnProfile = true;
        }

        // Render sidebar
        SidebarComponent.render({
            userName: currentUser.displayName,
            avatarUrl: currentUser.avatar,
            showStats: true,
            showSettings: !isOwnProfile,
            showBackHome: true,
            showUserSearch: true
        });

        // Render the profile content
        await ProfileRender.renderProfileContent(profileUser, isOwnProfile);

    } catch (error) {
        console.error('Failed to load profile:', error);
        CommonComponent.handleAuthError();
    }
}