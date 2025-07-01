import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';

export class FriendsRender {
	static async renderFriendsList(container: HTMLElement): Promise<void> {
		try {
			const currentUser = await UserService.getCurrentUser();
			const friendsResponse = await UserService.getFriends();

			// Extract the actual friendships array from the response
			const friendsList = friendsResponse?.data || friendsResponse || [];
			console.log('🔍 Friends list:', friendsList); // Debug log

			const friendsSection = document.createElement('div');
			friendsSection.className = 'space-y-8';

			// Incoming friend requests (highest priority)
			const pendingIncoming = friendsList.filter(f =>
				f.status === 'PENDING' && f.receiverId === currentUser.id
			);

			if (pendingIncoming.length > 0) {
				const incomingSection = document.createElement('div');

				const incomingTitle = document.createElement('h3');
				incomingTitle.textContent = `Friend Requests (${pendingIncoming.length})`;
				incomingTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-blue-600`;

				const incomingList = document.createElement('div');
				incomingList.className = 'space-y-3';

				pendingIncoming.forEach(friendship => {
					const friend = friendship.sender;
					const friendCard = this.createFriendCard(friend, friendship, 'pending-received');
					incomingList.appendChild(friendCard);
				});

				incomingSection.appendChild(incomingTitle);
				incomingSection.appendChild(incomingList);
				friendsSection.appendChild(incomingSection);
			}

			// Accepted friends
			const acceptedFriends = friendsList.filter(f => f.status === 'ACCEPTED');
			if (acceptedFriends.length > 0) {
				const acceptedSection = document.createElement('div');

				const acceptedTitle = document.createElement('h3');
				acceptedTitle.textContent = `Friends (${acceptedFriends.length})`;
				acceptedTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-green-600`;

				const acceptedList = document.createElement('div');
				acceptedList.className = 'space-y-3';

				acceptedFriends.forEach(friendship => {
					// Determine which user is the friend (not current user)
					const friend = friendship.senderId === currentUser.id ? friendship.receiver : friendship.sender;
					const friendCard = this.createFriendCard(friend, friendship, 'accepted');
					acceptedList.appendChild(friendCard);
				});

				acceptedSection.appendChild(acceptedTitle);
				acceptedSection.appendChild(acceptedList);
				friendsSection.appendChild(acceptedSection);
			}

			// Outgoing pending requests
			const pendingOutgoing = friendsList.filter(f =>
				f.status === 'PENDING' && f.senderId === currentUser.id
			);

			if (pendingOutgoing.length > 0) {
				const outgoingSection = document.createElement('div');

				const outgoingTitle = document.createElement('h3');
				outgoingTitle.textContent = `Pending Requests (${pendingOutgoing.length})`;
				outgoingTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-orange-600`;

				const outgoingList = document.createElement('div');
				outgoingList.className = 'space-y-3';

				pendingOutgoing.forEach(friendship => {
					const friend = friendship.receiver;
					const friendCard = this.createFriendCard(friend, friendship, 'pending-sent');
					outgoingList.appendChild(friendCard);
				});

				outgoingSection.appendChild(outgoingTitle);
				outgoingSection.appendChild(outgoingList);
				friendsSection.appendChild(outgoingSection);
			}

			// Show message if no friends/requests at all
			if (friendsList.length === 0) {
				const noFriendsMsg = document.createElement('div');
				noFriendsMsg.className = 'text-center py-12';
				noFriendsMsg.innerHTML = `
                <p class="text-gray-500 text-lg mb-4">No friends or requests yet</p>
                <p class="text-gray-400">Use the user search in the sidebar to find and add friends!</p>
            `;
				friendsSection.appendChild(noFriendsMsg);
			}

			container.appendChild(friendsSection);

		} catch (error) {
			console.error('Failed to load friends:', error);
			const errorMsg = document.createElement('div');
			errorMsg.className = 'text-center py-12';
			errorMsg.innerHTML = `
            <p class="text-red-500 text-lg">Failed to load friends list</p>
            <p class="text-gray-400 mt-2">Please try refreshing the page</p>
        `;
			container.appendChild(errorMsg);
		}
	}

	private static createFriendCard(friend: any, friendship: any, type: 'accepted' | 'pending-sent' | 'pending-received'): HTMLElement {
		const card = document.createElement('div');
		card.className = 'bg-gray-50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors';

		const userInfo = document.createElement('div');
		userInfo.className = 'flex items-center space-x-4 flex-grow';

		const avatar = document.createElement('img');
		avatar.src = `/avatars/${friend.avatar}` || '/avatars/default.svg';
		avatar.alt = `${friend.displayName}'s avatar`;
		avatar.className = 'w-12 h-12 rounded-full object-cover';

		const details = document.createElement('div');

		const name = document.createElement('div');
		name.textContent = friend.displayName;
		name.className = `font-['Orbitron'] font-medium text-lg`;

		const status = document.createElement('div');
		status.className = 'text-sm font-medium';

		switch (type) {
			case 'accepted':
				status.textContent = 'Friends';
				status.className += ' text-green-600';
				break;
			case 'pending-sent':
				status.textContent = 'Request sent';
				status.className += ' text-orange-600';
				break;
			case 'pending-received':
				status.textContent = 'Wants to be friends';
				status.className += ' text-blue-600';
				break;
		}

		details.appendChild(name);
		details.appendChild(status);

		userInfo.appendChild(avatar);
		userInfo.appendChild(details);

		const actions = document.createElement('div');
		actions.className = 'flex space-x-2 ml-8';

		// Profile button
		const profileBtn = CommonComponent.createStylizedButton('Profile', 'purple');
		profileBtn.onclick = () => {
			window.location.href = `/profile/${friend.displayName}`;
		};
		actions.appendChild(profileBtn);

		// Action buttons based on type
		if (type === 'pending-received') {
			const acceptBtn = CommonComponent.createStylizedButton('Accept', 'blue');
			acceptBtn.onclick = async () => {
				try {
					acceptBtn.disabled = true;
					acceptBtn.textContent = 'Accepting...';
					await UserService.acceptFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to accept request:', error);
					CommonComponent.showMessage('❌ Failed to accept friend request', 'error');
					acceptBtn.disabled = false;
					acceptBtn.textContent = 'Accept';
				}
			};

			const rejectBtn = CommonComponent.createStylizedButton('Reject', 'red');
			rejectBtn.onclick = async () => {
				try {
					rejectBtn.disabled = true;
					rejectBtn.textContent = 'Rejecting...';
					await UserService.rejectFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to reject request:', error);
					CommonComponent.showMessage('❌ Failed to reject friend request', 'error');
					rejectBtn.disabled = false;
					rejectBtn.textContent = 'Reject';
				}
			};

			actions.appendChild(acceptBtn);
			actions.appendChild(rejectBtn);
		} else if (type === 'pending-sent') {
			const cancelBtn = CommonComponent.createStylizedButton('Cancel', 'red');
			cancelBtn.onclick = async () => {
				try {
					cancelBtn.disabled = true;
					cancelBtn.textContent = 'Canceling...';
					await UserService.rejectFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to cancel request:', error);
					CommonComponent.showMessage('❌ Failed to cancel friend request', 'error');
					cancelBtn.disabled = false;
					cancelBtn.textContent = 'Cancel';
				}
			};
			actions.appendChild(cancelBtn);
		} else if (type === 'accepted') {
			const removeBtn = CommonComponent.createStylizedButton('Remove', 'red');
			removeBtn.onclick = async () => {
				try {
					removeBtn.disabled = true;
					removeBtn.textContent = 'Removing...';
					await UserService.removeFriend(friend.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to remove friend:', error);
					CommonComponent.showMessage('❌ Failed to remove friend', 'error');
					removeBtn.disabled = false;
					removeBtn.textContent = 'Remove';
				}
			};
			actions.appendChild(removeBtn);

			const inviteBtn = CommonComponent.createStylizedButton('Invite to Game', 'blue');
			inviteBtn.onclick = async () => {
				// Show game type selection modal
				this.showGameTypeModal(friend);
			};
			actions.appendChild(inviteBtn);
		}

		card.appendChild(userInfo);
		card.appendChild(actions);

		return card;
	}

	private static showGameTypeModal(friend: any): void {
		// Create modal overlay
		const modalOverlay = document.createElement('div');
		modalOverlay.className = `
        fixed inset-0 bg-black/50 flex items-center justify-center z-50
    `;

		// Create modal content
		const modal = document.createElement('div');
		modal.className = `
        bg-white rounded-lg p-6 max-w-md w-full mx-4
        border-2 border-black shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    `;

		// Modal title
		const title = document.createElement('h3');
		title.textContent = `Invite ${friend.displayName} to:`;
		title.className = `font-['Orbitron'] text-xl font-bold mb-6 text-center`;
		modal.appendChild(title);

		// Game type buttons
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex flex-col space-y-4';

		// Duo game button
		const duoBtn = CommonComponent.createStylizedButton('Duo Game (1v1)', 'purple');
		duoBtn.className += ' w-full';
		duoBtn.onclick = async () => {
			modalOverlay.remove();
			await this.sendGameInvite(friend, 'duo');
		};
		buttonContainer.appendChild(duoBtn);

		// Tournament button
		const tournamentBtn = CommonComponent.createStylizedButton('Tournament (4 players)', 'red');
		tournamentBtn.className += ' w-full';
		tournamentBtn.onclick = async () => {
			modalOverlay.remove();
			await this.sendGameInvite(friend, 'tournament');
		};
		buttonContainer.appendChild(tournamentBtn);

		// Cancel button
		const cancelBtn = CommonComponent.createStylizedButton('Cancel', 'gray');
		cancelBtn.className += ' w-full';
		cancelBtn.onclick = () => modalOverlay.remove();
		buttonContainer.appendChild(cancelBtn);

		modal.appendChild(buttonContainer);
		modalOverlay.appendChild(modal);

		// Close modal when clicking outside
		modalOverlay.onclick = (e) => {
			if (e.target === modalOverlay) {
				modalOverlay.remove();
			}
		};

		document.body.appendChild(modalOverlay);
	}

	private static async sendGameInvite(friend: any, gameType: 'duo' | 'tournament'): Promise<void> {
		try {
			// Check if friend is currently the logged-in user
			const currentUser = await UserService.getCurrentUser();
			if (friend.id === currentUser?.id) {
				CommonComponent.showMessage('❌ Cannot invite yourself!', 'error');
				return;
			}

			// Create appropriate game based on type
			const endpoint = gameType === 'duo' ? '/api/game/start' : '/api/game/tournament/start';
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ difficulty: 'MEDIUM' })
			});

			if (!res.ok) throw new Error(`Failed to create ${gameType} game`);

			const { gameId } = await res.json();

			// Send invite with gameType
			const inviteRes = await fetch('/api/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					gameId,
					inviteeId: friend.id,
					gameType
				})
			});

			if (!inviteRes.ok) {
				const errorData = await inviteRes.json();
				throw new Error(errorData.error || 'Failed to send invite');
			}

			CommonComponent.showMessage(`✅ ${gameType === 'duo' ? 'Duo' : 'Tournament'} invite sent to ${friend.displayName}!`, 'success');

			// Navigate to the appropriate game page
			const route = gameType === 'duo'
				? `/game/online/duo/${gameId}`
				: `/game/online/tournament/${gameId}`;
			window.location.href = route;

		} catch (error) {
			console.error('Failed to invite:', error);
			CommonComponent.showMessage(`❌ ${error.message || `Failed to send ${gameType} invite`}`, 'error');
		}
	}


}