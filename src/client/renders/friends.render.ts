import { WebSocketService } from '../services/websocket.service';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';

export class FriendsRender {
  static async renderFriendsList(container: HTMLElement): Promise<void> {
    const wsService = WebSocketService.getInstance();

    const friendsSection = document.createElement('div');
    friendsSection.className = 'py-4';

    const title = document.createElement('h2');
    title.textContent = 'Friends';
    title.className = 'text-2xl font-bold mb-4 text-gray-800';

    const friendsContainer = document.createElement('div');
    friendsContainer.className = 'space-y-3 max-h-96 overflow-y-auto';

    // Loading state
    const loadingEl = document.createElement('p');
    loadingEl.textContent = 'Loading friends...';
    loadingEl.className = 'text-gray-500 italic';
    friendsContainer.appendChild(loadingEl);

    friendsSection.appendChild(title);
    friendsSection.appendChild(friendsContainer);
    container.appendChild(friendsSection);

    try {
      const friends = await UserService.getFriends();

      // Clear loading state
      friendsContainer.innerHTML = '';

      if (friends.length === 0) {
        const noFriends = document.createElement('p');
        noFriends.textContent = 'No friends yet. Search for users to add friends!';
        noFriends.className = 'text-gray-500 text-center py-4';
        friendsContainer.appendChild(noFriends);
        return;
      }

      friends.forEach(friend => {
        const friendCard = document.createElement('div');
        friendCard.className = 'bg-white p-3 rounded-lg shadow flex items-center justify-between';

        // Left side: avatar and name
        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center space-x-3';

        const avatar = document.createElement('img');
        avatar.src = friend.avatar || '/avatars/default.svg';
        avatar.alt = `${friend.displayName}'s avatar`;
        avatar.className = `font-['Orbitron'] w-10 h-10 rounded-full object-cover`;

        const nameContainer = document.createElement('div');

        const name = document.createElement('p');
        name.textContent = friend.displayName || 'Unknown User';
        name.className = `font-['Orbitron'] font-medium`;

        // Status indicator
        const statusDot = document.createElement('span');
        statusDot.className = 'inline-block w-2.5 h-2.5 rounded-full ml-4 mr-4';
        statusDot.setAttribute('data-user-status', friend.id);

        // Initial status
        const isOnline = wsService.isUserOnline(friend.id);
        statusDot.style.backgroundColor = isOnline ? 'green' : 'red';
        statusDot.title = isOnline ? 'Online' : 'Offline';

        nameContainer.appendChild(name);
        name.appendChild(statusDot);

        userInfo.appendChild(avatar);
        userInfo.appendChild(nameContainer);

        // Right side: action buttons
        const actions = document.createElement('div');
        actions.className = 'flex space-x-2';

        const profileBtn = CommonComponent.createStylizedButton('Profile', 'blue');
        profileBtn.className += ' text-sm py-1 px-3';
        profileBtn.onclick = () => {
          window.location.href = `/profile/${encodeURIComponent(friend.displayName)}`;
        };

        const removeBtn = CommonComponent.createStylizedButton('Remove', 'red');
        removeBtn.className += ' text-sm py-1 px-3';
        removeBtn.onclick = async () => {
          if (confirm(`Are you sure you want to remove ${friend.displayName} from your friends?`)) {
            try {
              removeBtn.disabled = true;
              removeBtn.textContent = 'Removing...';
              await UserService.removeFriend(friend.id);

              // Remove the card with animation
              friendCard.style.transition = 'all 0.3s';
              friendCard.style.opacity = '0';
              friendCard.style.height = '0';

              setTimeout(() => {
                friendCard.remove();

                // Check if there are no more friends
                if (friendsContainer.children.length === 0) {
                  const noFriends = document.createElement('p');
                  noFriends.textContent = 'No friends yet. Search for users to add friends!';
                  noFriends.className = 'text-gray-500 text-center py-4';
                  friendsContainer.appendChild(noFriends);
                }
              }, 300);

            } catch (error) {
              console.error('Failed to remove friend:', error);
              CommonComponent.showMessage('❌ Failed to remove friend', 'error');
              removeBtn.disabled = false;
              removeBtn.textContent = 'Remove';
            }
          }
        };

        actions.appendChild(profileBtn);
        actions.appendChild(removeBtn);

        friendCard.appendChild(userInfo);
        friendCard.appendChild(actions);
        friendsContainer.appendChild(friendCard);
      });

    } catch (error) {
      console.error('Error rendering friends list:', error);
      friendsContainer.innerHTML = '';

      const errorMsg = document.createElement('p');
      errorMsg.textContent = 'Failed to load friends. Please try again.';
      errorMsg.className = 'text-red-500 text-center py-4';
      friendsContainer.appendChild(errorMsg);
    }
  }
}