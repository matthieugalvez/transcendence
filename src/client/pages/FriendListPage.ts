import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from '../components/sidebar.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { FriendsRender } from '../renders/friends.render';

export async function FriendsPage(): Promise<void> {
  document.title = 'Transcendence - Friends';
  document.body.innerHTML = '';
  BackgroundComponent.applyCenteredGradientLayout();

  try {
    let currentUser = await UserService.getCurrentUser();

    if (!currentUser.displayName || currentUser.displayName === '') {
      const result = await AuthComponent.checkAndHandleDisplayName();
      if (result.success && result.userData) {
        currentUser = result.userData;
      } else {
        return;
      }
    }

    SidebarComponent.render({
      userName: currentUser.displayName,
      avatarUrl: currentUser.avatar,
      showStats: true,
      showSettings: true,
      showBackHome: true,
      showUserSearch: true
    });

    const container = document.createElement('div');
    container.className = 'min-h-screen flex items-center justify-center p-8';

    const friendsCard = document.createElement('div');
    friendsCard.className = `
      bg-white/90 backdrop-blur-md border-2 border-black rounded-xl
      p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-4xl w-full mx-4
    `;

    const title = document.createElement('h1');
    title.textContent = 'Friends & Requests';
    title.className = `
      font-['Canada-big'] text-4xl font-bold text-center mb-8
      bg-gradient-to-r from-purple-600 to-orange-400
      bg-clip-text text-transparent
    `;

    friendsCard.appendChild(title);

    // Render the friends list with all pending requests
    await FriendsRender.renderFriendsList(friendsCard);

    container.appendChild(friendsCard);
    document.body.appendChild(container);

  } catch (error) {
    console.error('Failed to load friends page:', error);
    CommonComponent.handleAuthError();
  }
}