import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';

export class FriendsRender {
	static async renderFriendsList(container: HTMLElement): Promise<void> {
		try {
			const currentUser = await UserService.getCurrentUser();
			const friendsResponse = await UserService.getFriends();

			// Extract the actual friendships array from the response
			const friendsList = friendsResponse?.data || friendsResponse || [];
			// //console.log('🔍 Friends list:', friendsList); // Debug log

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

				for (const friendship of pendingIncoming) {
					const friend = friendship.sender;
					const friendCard = await this.createFriendCard(friend, friendship, 'pending-received');
					incomingList.appendChild(friendCard);
				}

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

				for (const friendship of acceptedFriends) {
					// Determine which user is the friend (not current user)
					const friend = friendship.senderId === currentUser.id ? friendship.receiver : friendship.sender;
					const friendCard = await this.createFriendCard(friend, friendship, 'accepted');
					acceptedList.appendChild(friendCard);
				}

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

				for (const friendship of pendingOutgoing) {
					const friend = friendship.receiver;
					const friendCard = await this.createFriendCard(friend, friendship, 'pending-sent');
					outgoingList.appendChild(friendCard);
				}

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

	private static async createFriendCard(friend: any, friendship: any, type: 'accepted' | 'pending-sent' | 'pending-received'): HTMLElement {
		const card = document.createElement('div');
		card.className = 'bg-gray-50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors';

		const userInfo = document.createElement('div');
		userInfo.className = 'flex items-center space-x-4 flex-grow';

		const avatar = document.createElement('img');
		if (friend.avatar && friend.avatar !== 'null' && friend.avatar !== 'undefined') {
			// If avatar starts with /avatars/, use as-is, otherwise prepend /avatars/
			avatar.src = friend.avatar.startsWith('/avatars/') ? friend.avatar : `/avatars/${friend.avatar}`;
		} else {
			avatar.src = '/avatars/default';
		}

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

			let hasPendingGameInvite = false;
			try {
				const invitesResponse = await fetch('/api/invites/sent');
				if (invitesResponse.ok) {
					const invitesData = await invitesResponse.json();
					if (invitesData.success) {
						hasPendingGameInvite = invitesData.invites.some((invite: any) =>
							invite.inviteeId === friend.id && invite.status === 'pending'
						);
					}
				}
			} catch (error) {
				console.error('Error checking pending invites:', error);
			}

			if (!hasPendingGameInvite) {
				const inviteBtn = CommonComponent.createStylizedButton('Invite to Game', 'blue');
				inviteBtn.onclick = async () => {
					this.showGameTypeModal(friend);
				};
				actions.appendChild(inviteBtn);
			} else {
				const pendingInviteBtn = CommonComponent.createStylizedButton('Invite Pending', 'gray');
				pendingInviteBtn.disabled = true;
				actions.appendChild(pendingInviteBtn);
			}
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
			await FriendsRender.sendGameInvite(friend, 'duo'); // Use class name explicitly
		};
		buttonContainer.appendChild(duoBtn);

		// Tournament button - fix the context issue
const tournamentBtn = CommonComponent.createStylizedButton('Tournament (4 players)', 'red');
tournamentBtn.className += ' w-full';
tournamentBtn.onclick = async () => {
    // //console.log('Tournament button clicked!');
    modalOverlay.remove();
    try {
        //console.log('Calling showTournamentPlayerSelection with friend:', friend);
        await FriendsRender.showTournamentPlayerSelection(friend);
    } catch (error) {
        console.error('Error in showTournamentPlayerSelection:', error);
        CommonComponent.showMessage('❌ Failed to load tournament selection', 'error');
    }
};
buttonContainer.appendChild(tournamentBtn);

		// Cancel button
		const cancelBtn = CommonComponent.createStylizedButton('Cancel', 'gray');
		cancelBtn.className += ' w-full';
		cancelBtn.onclick = () => modalOverlay.remove();
		buttonContainer.appendChild(cancelBtn);

		modal.appendChild(buttonContainer);
		modalOverlay.appendChild(modal);
		document.body.appendChild(modalOverlay);
	}

	// New method for tournament player selection
	private static async showTournamentPlayerSelection(initialFriend: any): Promise<void> {
    //console.log('showTournamentPlayerSelection called with:', initialFriend);
    try {
        // Get current user's friends list
        //console.log('Fetching friends list...');
        const friendsResponse = await UserService.getFriends();
        //console.log('Friends response:', friendsResponse);

        const friendsList = friendsResponse?.data || friendsResponse || [];
        //console.log('Processed friends list:', friendsList);

        const currentUser = await UserService.getCurrentUser();
        //console.log('Current user:', currentUser);

        // Filter to accepted friends only, excluding the initial friend
        const availableFriends = friendsList
            .filter(f => f.status === 'ACCEPTED')
            .map(f => f.senderId === currentUser.id ? f.receiver : f.sender)
            .filter(friend => friend.id !== initialFriend.id);

        //console.log('Available friends for tournament:', availableFriends);

        if (availableFriends.length < 2) {
            //console.log('Not enough friends for tournament');
            CommonComponent.showMessage('❌ You need at least 3 friends to create a tournament', 'error');
            return;
        }

        //console.log('Creating tournament modal...');
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = `
            fixed inset-0 bg-black/50 flex items-center justify-center z-50
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = `
            bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto
            border-2 border-black shadow-[8.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        `;

        // Modal title
        const title = document.createElement('h3');
        title.textContent = 'Select 2 more players for tournament';
        title.className = `font-['Orbitron'] text-xl font-bold mb-4 text-center`;
        modal.appendChild(title);

        // Selected players display
        const selectedSection = document.createElement('div');
        selectedSection.className = 'mb-6';

        const selectedTitle = document.createElement('h4');
        selectedTitle.textContent = 'Selected Players:';
        selectedTitle.className = 'font-semibold mb-2';
        selectedSection.appendChild(selectedTitle);

        const selectedList = document.createElement('div');
        selectedList.className = 'flex flex-wrap gap-2 mb-4';

        // Add current user and initial friend
        const currentUserPill = FriendsRender.createPlayerPill(currentUser.displayName, false);
        const initialFriendPill = FriendsRender.createPlayerPill(initialFriend.displayName, false);
        selectedList.appendChild(currentUserPill);
        selectedList.appendChild(initialFriendPill);

        selectedSection.appendChild(selectedList);
        modal.appendChild(selectedSection);

        // Available friends list
        const friendsSection = document.createElement('div');
        friendsSection.className = 'mb-6';

        const friendsTitle = document.createElement('h4');
        friendsTitle.textContent = 'Select 2 more friends:';
        friendsTitle.className = 'font-semibold mb-2';
        friendsSection.appendChild(friendsTitle);

        const friendsContainer = document.createElement('div');
        friendsContainer.className = 'space-y-2 max-h-60 overflow-y-auto';

        let selectedFriends: any[] = [];

        availableFriends.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = `
                flex items-center justify-between p-3 border rounded-lg cursor-pointer
                hover:bg-gray-50 transition-colors
            `;

            const friendInfo = document.createElement('div');
            friendInfo.className = 'flex items-center space-x-3';

            const avatar = document.createElement('img');
            avatar.src = friend.avatar || '/default-avatar.png';
            avatar.className = 'w-8 h-8 rounded-full';

            const name = document.createElement('span');
            name.textContent = friend.displayName;
            name.className = 'font-medium';

            friendInfo.appendChild(avatar);
            friendInfo.appendChild(name);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'w-4 h-4';

            checkbox.onchange = () => {
                if (checkbox.checked) {
                    if (selectedFriends.length >= 2) {
                        checkbox.checked = false;
                        CommonComponent.showMessage('❌ You can only select 2 more players', 'error');
                        return;
                    }
                    selectedFriends.push(friend);
                    const pill = FriendsRender.createPlayerPill(friend.displayName, true, () => {
                        selectedFriends = selectedFriends.filter(f => f.id !== friend.id);
                        checkbox.checked = false;
                        pill.remove();
                        updateStartButton();
                    }, friend.id); // Pass the friend.id as playerId parameter
                    selectedList.appendChild(pill);
                } else {
                    selectedFriends = selectedFriends.filter(f => f.id !== friend.id);
                    const pill = selectedList.querySelector(`[data-player-id="${friend.id}"]`);
                    if (pill) pill.remove();
                }
                updateStartButton();
            };

            friendCard.appendChild(friendInfo);
            friendCard.appendChild(checkbox);
            friendsContainer.appendChild(friendCard);
        });

        friendsSection.appendChild(friendsContainer);
        modal.appendChild(friendsSection);

        // Action buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex space-x-4';

        const startBtn = CommonComponent.createStylizedButton('Start Tournament', 'purple');
        startBtn.disabled = true;
        startBtn.onclick = async () => {
            modalOverlay.remove();
            const allPlayers = [initialFriend, ...selectedFriends];
            await FriendsRender.sendTournamentInvites(allPlayers);
        };

        const cancelBtn = CommonComponent.createStylizedButton('Cancel', 'gray');
        cancelBtn.onclick = () => modalOverlay.remove();

        function updateStartButton() {
            startBtn.disabled = selectedFriends.length !== 2;
        }

        buttonContainer.appendChild(startBtn);
        buttonContainer.appendChild(cancelBtn);
        modal.appendChild(buttonContainer);

        modalOverlay.appendChild(modal);
        //console.log('Appending modal to document body...');
        document.body.appendChild(modalOverlay);
        //console.log('Tournament modal should now be visible');

    } catch (error) {
        console.error('Failed to load friends for tournament:', error);
        CommonComponent.showMessage('❌ Failed to load friends list', 'error');
    }
}

	// Helper method to create player pills
	private static createPlayerPill(displayName: string, removable: boolean, onRemove?: () => void, playerId?: string): HTMLElement {
		const pill = document.createElement('div');
		pill.className = `
        inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800
        rounded-full text-sm font-medium
    `;
		// Use playerId if provided, otherwise use displayName as fallback
		pill.setAttribute('data-player-id', playerId || displayName);

		const nameSpan = document.createElement('span');
		nameSpan.textContent = displayName;
		pill.appendChild(nameSpan);

		if (removable && onRemove) {
			const removeBtn = document.createElement('button');
			removeBtn.textContent = '×';
			removeBtn.className = 'ml-2 text-purple-600 hover:text-purple-800 font-bold';
			removeBtn.onclick = onRemove;
			pill.appendChild(removeBtn);
		}

		return pill;
	}

	// New method to send tournament invites to multiple players
	private static async sendTournamentInvites(players: any[]): Promise<void> {
		try {
			// Create tournament game
			const res = await fetch('/api/game/tournament/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ difficulty: 'MEDIUM' })
			});

			if (!res.ok) throw new Error('Failed to create tournament game');

			const { gameId } = await res.json();

			// Send invites to all selected players
			const invitePromises = players.map(player =>
				fetch('/api/invite', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						gameId,
						inviteeId: player.id,
						gameType: 'tournament'
					})
				})
			);

			const results = await Promise.all(invitePromises);
			const failedInvites = results.filter(r => !r.ok);

			if (failedInvites.length > 0) {
				CommonComponent.showMessage('⚠️ Some invites failed to send', 'warning');
			} else {
				CommonComponent.showMessage('✅ Tournament invites sent to all players!', 'success');
			}

			// Navigate to tournament page
			window.location.href = `/game/online/tournament/${gameId}`;

		} catch (error) {
			console.error('Failed to create tournament:', error);
			CommonComponent.showMessage('❌ Failed to create tournament', 'error');
		}
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