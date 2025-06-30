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
		avatar.src = friend.avatar || '/avatars/default.svg';
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
				inviteBtn.disabled = true;
				inviteBtn.textContent = 'Inviting...';
				try {
					// Create a new game and send invite
					const res = await fetch('/api/game/start', { method: 'POST' });
					const { gameId } = await res.json();
					const inviteRes = await fetch('/api/invite', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ gameId, inviteeId: friend.id })
					});
					if (!inviteRes.ok) throw new Error('Failed to send invite');
					CommonComponent.showMessage('✅ Game invite sent!', 'success');

					// Replace button with "Requested..." label
					const requestedLabel = document.createElement('span');
					requestedLabel.textContent = 'Requested...';
					requestedLabel.className = 'text-gray-400 ml-2';
					inviteBtn.replaceWith(requestedLabel);
					window.location.href = `/game/online/duo/${gameId}`;
				} catch (error) {
					console.error('Failed to invite:', error);
					CommonComponent.showMessage('❌ Failed to send game invite', 'error');
					inviteBtn.disabled = false;
					inviteBtn.textContent = 'Invite to Game';
				}
			};
			actions.appendChild(inviteBtn);
		}

		card.appendChild(userInfo);
		card.appendChild(actions);

		return card;
	}
}