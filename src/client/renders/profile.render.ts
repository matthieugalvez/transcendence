import { CommonComponent } from '../components/common.component';
import { UserComponent } from '../components/user.component';
import { router } from '../configs/simplerouter';
import { UserService } from '../services/user.service';
import { WebSocketService } from '../services/websocket.service'

export class ProfileRender {
	static async renderProfileContent(user: any, isOwnProfile: boolean): Promise<void> {
		const container = document.createElement('div');
		container.className = `
            min-h-screen flex items-center justify-center p-8
        `;

		const profileCard = document.createElement('div');
		profileCard.className = `
            bg-white/90 backdrop-blur-md
            border-2 border-black
            rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
            max-w-2xl w-full mx-4
        `;

		// Profile Header
		const header = this.createProfileHeader(user, isOwnProfile);
		profileCard.appendChild(header);

		// Profile Stats/Info Section
		const infoSection = await this.createInfoSection(user, isOwnProfile);
		profileCard.appendChild(infoSection);

		// Action Buttons (if not own profile)
		if (!isOwnProfile) {
			const actionsSection = await this.createActionsSection(user);
			profileCard.appendChild(actionsSection);
		}

		// Edit Profile Section (if own profile)
		if (isOwnProfile) {
			const editSection = this.createEditSection();
			profileCard.appendChild(editSection);
		}

		container.appendChild(profileCard);
		document.body.appendChild(container);
	}

	private static createProfileHeader(user: any, isOwnProfile: boolean): HTMLElement {
		const header = document.createElement('div');
		header.className = 'flex items-center space-x-6 mb-8';

		// Avatar
		const avatar = document.createElement('img');
		avatar.src = user.avatar || '/assets/default-avatar.png';
		avatar.alt = `${user.displayName}'s avatar`;
		avatar.className = `
            w-32 h-32 rounded-full border-4 border-purple-500
            object-cover shadow-lg
        `;

		// User Info
		const userInfo = document.createElement('div');
		userInfo.className = 'flex-1';

		const displayName = document.createElement('h1');
		displayName.textContent = user.displayName || user.name;
		displayName.className = `
            font-['Canada-big'] text-4xl font-bold
            bg-gradient-to-r from-purple-600 to-orange-400
            bg-clip-text text-transparent mb-2
        `;

  const statusDot = document.createElement('span');
  statusDot.setAttribute('data-user-status', user.id);
  statusDot.style.display = 'inline-block';
  statusDot.style.width = '12px';
  statusDot.style.height = '12px';
  statusDot.style.borderRadius = '50%';
  statusDot.style.background = 'gray'; // Start with gray
  statusDot.title = 'Checking status...';

  const wsService = WebSocketService.getInstance();

  // Set up status change listener
  const cleanup = wsService.onStatusChange((userId, isOnline) => {
    if (userId === user.id) {
      statusDot.style.background = isOnline ? 'green' : 'red';
      statusDot.title = isOnline ? 'Online' : 'Offline';
      console.log(`Status updated for ${user.id}: ${isOnline ? 'online' : 'offline'}`);
    }
  });

  // Try to get initial status and wait for WebSocket connection
  (async () => {
    try {
      // Wait for WebSocket to connect
      const connected = await wsService.waitForConnection(3000);
      if (connected) {
        // Give it a moment for initial status messages to arrive
        setTimeout(() => {
          const isOnline = wsService.isUserOnline(user.id);
          statusDot.style.background = isOnline ? 'green' : 'red';
          statusDot.title = isOnline ? 'Online' : 'Offline';
          console.log(`Initial status for ${user.id}: ${isOnline ? 'online' : 'offline'}`);
        }, 500);
      } else {
        // Connection failed, show offline
        statusDot.style.background = 'red';
        statusDot.title = 'Offline';
      }
    } catch (error) {
      console.error('Error getting initial status:', error);
      statusDot.style.background = 'red';
      statusDot.title = 'Offline';
    }
  })();

  userInfo.appendChild(statusDot);


		// const username = document.createElement('p');
		// username.textContent = `@${user.displayName}`;
		// username.className = 'text-gray-600 text-lg mb-2';

		const joinDate = document.createElement('p');
		const date = new Date(user.created_at).toLocaleDateString();
		joinDate.textContent = `Member since ${date}`;
		joinDate.className = 'text-gray-500 text-sm';

		userInfo.appendChild(displayName);
		// userInfo.appendChild(username);
		userInfo.appendChild(joinDate);

		header.appendChild(avatar);
		header.appendChild(userInfo);

		return header;
	}

	private static async createInfoSection(user: any, isOwnProfile: boolean): Promise<HTMLElement> {
		const section = document.createElement('div');
		section.className = 'mb-6';

		const title = document.createElement('h2');
		title.textContent = 'Profile Information';
		title.className = ` font-['Orbitron'] text-2xl font-bold mb-4 text-gray-800`;

		const infoGrid = document.createElement('div');
		infoGrid.className = 'grid grid-cols-2 gap-4';

		// Add profile stats here - you can expand this based on your game data
		const stats = [
			// { label: 'User ID', value: user.id },
			{ label: 'Match played', value: 'Placeholder' },
			{ label: 'Match won', value: 'Placeholder' }
			// { label: 'Display Name', value: user.displayName || 'Not set' },
			// { label: 'Email', value: user.email || 'Private' },
			// { label: 'Last Online', value: new Date(user.updated_at).toLocaleDateString() }
		];

		stats.forEach(stat => {
			const statItem = document.createElement('div');
			statItem.className = 'bg-gray-50 p-3 rounded-lg';

			const label = document.createElement('p');
			label.textContent = stat.label;
			label.className = 'text-sm text-gray-600 font-medium';

			const value = document.createElement('p');
			value.textContent = stat.value;
			value.className = 'text-lg font-semibold text-gray-800';

			statItem.appendChild(label);
			statItem.appendChild(value);
			infoGrid.appendChild(statItem);
		});

		section.appendChild(title);
		section.appendChild(infoGrid);

		return section;
	}

	private static async createActionsSection(user: any): Promise<HTMLElement> {
		const section = document.createElement('div');
		section.className = 'border-t pt-6';

		const title = document.createElement('h3');
		title.textContent = 'Actions';
		title.className = 'text-xl font-bold mb-4 text-gray-800';

		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex space-x-4';

		let status: string = 'none';
		let requestId: string | undefined = undefined;
		try {
			const friendship = await UserService.getFriendshipStatus(user.id);
			status = friendship.status;
			requestId = friendship.requestId;
		} catch (e) { }

		if (status === 'friends') {
			const removeBtn = CommonComponent.createStylizedButton('Remove Friend', 'red');
			removeBtn.onclick = async () => {
				removeBtn.disabled = true;
				removeBtn.textContent = 'Removing...';
				try {
					await UserService.removeFriend(user.id);
					removeBtn.textContent = 'Removed';
				} catch {
					removeBtn.textContent = 'Remove Friend';
					CommonComponent.showMessage('❌ Failed to remove friend', 'error');
				} finally {
					removeBtn.disabled = false;
				}
			};
			buttonContainer.appendChild(removeBtn);
		} else if (status === 'pending') {
			const pendingBtn = CommonComponent.createStylizedButton('Request Pending', 'gray');
			pendingBtn.disabled = true;
			buttonContainer.appendChild(pendingBtn);
		} else if (status === 'incoming' && requestId) {
			const acceptBtn = CommonComponent.createStylizedButton('Accept Friend Request', 'blue');
			acceptBtn.onclick = async () => {
				acceptBtn.disabled = true;
				acceptBtn.textContent = 'Accepting...';
				try {
					await UserService.acceptFriendRequest(requestId);
					acceptBtn.textContent = 'Accepted!';
				} catch {
					acceptBtn.textContent = 'Accept Friend Request';
					CommonComponent.showMessage('❌ Failed to accept friend request', 'error');
				} finally {
					acceptBtn.disabled = false;
				}
			};
			buttonContainer.appendChild(acceptBtn);
		} else {
			const addFriendBtn = CommonComponent.createStylizedButton('Add Friend', 'blue');
			addFriendBtn.onclick = async () => {
				addFriendBtn.disabled = true;
				addFriendBtn.textContent = 'Sending...';
				try {
					await UserService.addFriend(user.id);
					addFriendBtn.textContent = 'Request Sent!';
				} catch {
					addFriendBtn.textContent = 'Add Friend';
					CommonComponent.showMessage('❌ Failed to send friend request', 'error');
				} finally {
					addFriendBtn.disabled = false;
				}
			};
			buttonContainer.appendChild(addFriendBtn);
		}

		section.appendChild(title);
		section.appendChild(buttonContainer);

		return section;
	}

	private static createEditSection(): HTMLElement {
		const section = document.createElement('div');
		section.className = 'border-t pt-2';

		const title = document.createElement('h3');
		// title.textContent = 'Quick Edit';
		title.className = 'text-xl font-bold mb-4 text-gray-800';

		const editButton = CommonComponent.createStylizedButton('Edit profile', 'blue')
		// editButton.textContent = 'Edit Profile';
		// editButton.className = `
        //     px-6 py-2 bg-blue-600 text-white rounded-lg
        //     hover:bg-blue-700 transition-colors
        //     font-medium
        // `;
		editButton.onclick = () => {
			router.navigate('/settings');
		};

		section.appendChild(title);
		section.appendChild(editButton);

		return section;
	}
}