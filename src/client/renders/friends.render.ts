import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { ChatService } from '../services/chat.service';
import { language_obj } from '..';

export class FriendsRender {
	static async renderFriendsList(container: HTMLElement): Promise<void> {
		try {
			const currentUser = await UserService.getCurrentUser();
			const friendsResponse = await UserService.getFriends();

			// Extract the actual friendships array from the response
			const friendsList = friendsResponse?.data || friendsResponse || [];
			// ////console.log('🔍 Friends list:', friendsList); // Debug log

			const friendsSection = document.createElement('div');
			friendsSection.className = 'space-y-8';

			// Incoming friend requests (highest priority)
			const pendingIncoming = friendsList.filter(f =>
				f.status === 'PENDING' && f.receiverId === currentUser.id
			);

			if (pendingIncoming.length > 0) {
				const incomingSection = document.createElement('div');

				const incomingTitle = document.createElement('h3');
				incomingTitle.textContent = `${language_obj['Friend_requests']} (${pendingIncoming.length})`;
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
				acceptedTitle.textContent = `${language_obj['Friends']} (${acceptedFriends.length})`;
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
				outgoingTitle.textContent = `${language_obj['Pending_requests']} (${pendingOutgoing.length})`;
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
                <p class="text-gray-500 text-lg mb-4">${language_obj['No_friends_or_requests']}</p>
                <p class="text-gray-400">${language_obj['Use_user_search']}</p>
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
		userInfo.className = 'flex items-center space-x-4 mb-3'; // Added min-w-0 for proper text truncation

		const avatar = document.createElement('img');
		if (friend.avatar && friend.avatar !== 'null' && friend.avatar !== 'undefined') {
			// If avatar starts with /avatars/, use as-is, otherwise prepend /avatars/
			avatar.src = friend.avatar.startsWith('/avatars/') ? friend.avatar : `/avatars/${friend.avatar}`;
		} else {
			avatar.src = '/avatars/default.svg';
		}

		avatar.alt = `${friend.displayName}'s avatar`;
		avatar.className = 'w-12 h-12 rounded-full object-cover flex-shrink-0'; // Added flex-shrink-0

		const details = document.createElement('div');
		details.className = 'flex-grow'; // Added min-w-0 and flex-grow for proper text handling

		const name = document.createElement('div');
		name.textContent = friend.displayName;
		name.className = `font-['Orbitron'] font-medium text-lg `; // Added truncate class

		const status = document.createElement('div');
		status.className = 'text-sm font-medium truncate'; // Added truncate class

		switch (type) {
			case 'accepted':
				status.textContent = `${language_obj['Friends']}`;
				status.className += ' text-green-600';
				break;
			case 'pending-sent':
				status.textContent = `${language_obj['Request_sent']}`;
				status.className += ' text-orange-600';
				break;
			case 'pending-received':
				status.textContent = `${language_obj['Wants_to_be_friends']}`;
				status.className += ' text-blue-600';
				break;
		}

		details.appendChild(name);
		details.appendChild(status);

		userInfo.appendChild(avatar);
		userInfo.appendChild(details);

		const actions = document.createElement('div');
		actions.className = 'flex flex-wrap gap-2 justify-end'; // flex-wrap and gap instead of space-x

		// Profile button
		const profileBtn = CommonComponent.createStylizedButton(`${language_obj['Profile']}`, 'purple');
		profileBtn.className = profileBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
		profileBtn.onclick = () => {
			window.location.href = `/profile/${friend.displayName}`;
		};
		actions.appendChild(profileBtn);

		// Action buttons based on type
		if (type === 'pending-received') {
			const acceptBtn = CommonComponent.createStylizedButton(`${language_obj['Accept']}`, 'blue');
			acceptBtn.className = acceptBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
			acceptBtn.onclick = async () => {
				try {
					acceptBtn.disabled = true;
					acceptBtn.textContent = `${language_obj['Accepting']}`;
					await UserService.acceptFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to accept request:', error);
					CommonComponent.showMessage(`❌ ${language_obj['Failed_to_accept_friend_request']}`, 'error');
					acceptBtn.disabled = false;
					acceptBtn.textContent = `${language_obj['Accept']}`;
				}
			};

			const rejectBtn = CommonComponent.createStylizedButton(`${language_obj['Reject']}`, 'red');
			rejectBtn.className = rejectBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
			rejectBtn.onclick = async () => {
				try {
					rejectBtn.disabled = true;
					rejectBtn.textContent = `${language_obj['Rejecting']}`;
					await UserService.rejectFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to reject request:', error);
					CommonComponent.showMessage(`❌ ${language_obj['Failed_to_reject_friend_request']}`, 'error');
					rejectBtn.disabled = false;
					rejectBtn.textContent = `${language_obj['Reject']}`;
				}
			};

			actions.appendChild(acceptBtn);
			actions.appendChild(rejectBtn);
		} else if (type === 'pending-sent') {
			const cancelBtn = CommonComponent.createStylizedButton(`${language_obj['Cancel']}`, 'red');
			cancelBtn.className = cancelBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
			cancelBtn.onclick = async () => {
				try {
					cancelBtn.disabled = true;
					cancelBtn.textContent = `${language_obj['Canceling']}`;
					await UserService.rejectFriendRequest(friendship.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to cancel request:', error);
					CommonComponent.showMessage(`❌ ${language_obj['Failed_to_cancel_friend_request']}`, 'error');
					cancelBtn.disabled = false;
					cancelBtn.textContent = `${language_obj['Cancel']}`;
				}
			};
			actions.appendChild(cancelBtn);
		} else if (type === 'accepted') {
			const removeBtn = CommonComponent.createStylizedButton(`${language_obj['Remove']}`, 'red');
			removeBtn.className = removeBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
			removeBtn.onclick = async () => {
				try {
					removeBtn.disabled = true;
					removeBtn.textContent = `${language_obj['Removing']}`;
					await UserService.removeFriend(friend.id);
					window.location.reload();
				} catch (error) {
					console.error('Failed to remove friend:', error);
					CommonComponent.showMessage(`❌ ${language_obj['Failed_to_remove_friend_request']}`);
					removeBtn.disabled = false;
					removeBtn.textContent = `${language_obj['Remove']}`;
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
				const inviteBtn = CommonComponent.createStylizedButton(`${language_obj['Invite_to_game']}`, 'blue');
				inviteBtn.className = inviteBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
				inviteBtn.onclick = async () => {
					this.showGameTypeModal(friend);
				};
				actions.appendChild(inviteBtn);
			} else {
				const pendingInviteBtn = CommonComponent.createStylizedButton(`${language_obj['Invite_pending']}`, 'gray');
				pendingInviteBtn.className = pendingInviteBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Smaller button
				pendingInviteBtn.disabled = true;
				actions.appendChild(pendingInviteBtn);
			}
		}

		card.appendChild(userInfo);
		card.appendChild(actions);

		return card;
	}

	static showGameTypeModal(friend: any): void {
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
		title.textContent = `${language_obj['Invite']} ${friend.displayName} ${language_obj['To']}:`;
		title.className = `font-['Orbitron'] text-xl font-bold mb-6 text-center`;
		modal.appendChild(title);

		// Game type buttons
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex flex-col space-y-4';

		// Duo game button
		const duoBtn = CommonComponent.createStylizedButton(`${language_obj['Duo_game']}`, 'purple');
		duoBtn.className += ' w-full';
		duoBtn.onclick = async () => {
			modalOverlay.remove();
			await FriendsRender.sendGameInvite(friend, 'duo'); // Use class name explicitly
		};
		buttonContainer.appendChild(duoBtn);

		// Tournament button - fix the context issue
		const tournamentBtn = CommonComponent.createStylizedButton(`${language_obj['Tournament_4p']}`, 'red');
		tournamentBtn.className += ' w-full';
		tournamentBtn.onclick = async () => {
			// ////console.log('Tournament button clicked!');
			modalOverlay.remove();
			try {
				////console.log('Calling showTournamentPlayerSelection with friend:', friend);
				await FriendsRender.showTournamentPlayerSelection(friend);
			} catch (error) {
				console.error('Error in showTournamentPlayerSelection:', error);
				CommonComponent.showMessage('❌ Failed to load tournament selection', 'error');
			}
		};
		buttonContainer.appendChild(tournamentBtn);

		// Cancel button
		const cancelBtn = CommonComponent.createStylizedButton(`${language_obj['Cancel']}`, 'gray');
		cancelBtn.className += ' w-full';
		cancelBtn.onclick = () => modalOverlay.remove();
		buttonContainer.appendChild(cancelBtn);

		modal.appendChild(buttonContainer);
		modalOverlay.appendChild(modal);
		document.body.appendChild(modalOverlay);
	}

	// New method for tournament player selection
	private static async showTournamentPlayerSelection(initialFriend: any): Promise<void> {
		////console.log('showTournamentPlayerSelection called with:', initialFriend);
		try {
			// Get current user's friends list
			////console.log('Fetching friends list...');
			const friendsResponse = await UserService.getFriends();
			////console.log('Friends response:', friendsResponse);

			const friendsList = friendsResponse?.data || friendsResponse || [];
			////console.log('Processed friends list:', friendsList);

			const currentUser = await UserService.getCurrentUser();
			////console.log('Current user:', currentUser);

			// Filter to accepted friends only, excluding the initial friend
			const availableFriends = friendsList
				.filter(f => f.status === 'ACCEPTED')
				.map(f => f.senderId === currentUser.id ? f.receiver : f.sender)
				.filter(friend => friend.id !== initialFriend.id);

			////console.log('Available friends for tournament:', availableFriends);

			if (availableFriends.length < 2) {
				////console.log('Not enough friends for tournament');
				CommonComponent.showMessage(`❌ ${language_obj['You_need_3_friends']}`, 'error');
				return;
			}

			////console.log('Creating tournament modal...');
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
			title.textContent = `${language_obj['Select_2more']}`;
			title.className = `font-['Orbitron'] text-xl font-bold mb-4 text-center`;
			modal.appendChild(title);

			// Selected players display
			const selectedSection = document.createElement('div');
			selectedSection.className = 'mb-6';

			const selectedTitle = document.createElement('h4');
			selectedTitle.textContent = `${language_obj['Selected_players']}`;
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
			friendsTitle.textContent = `${language_obj['Select_2more_friends']}`;
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
							CommonComponent.showMessage(`❌ ${language_obj['You_can_only_select_2more']}`, 'error');
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

			const startBtn = CommonComponent.createStylizedButton(`${language_obj['Tournamentpage_start']}`, 'purple');
			startBtn.disabled = true;
			startBtn.onclick = async () => {
				modalOverlay.remove();
				const allPlayers = [initialFriend, ...selectedFriends];
				await FriendsRender.sendTournamentInvites(allPlayers);
			};

			const cancelBtn = CommonComponent.createStylizedButton(`${language_obj['Cancel']}`, 'gray');
			cancelBtn.onclick = () => modalOverlay.remove();

			function updateStartButton() {
				startBtn.disabled = selectedFriends.length !== 2;
			}

			buttonContainer.appendChild(startBtn);
			buttonContainer.appendChild(cancelBtn);
			modal.appendChild(buttonContainer);

			modalOverlay.appendChild(modal);
			////console.log('Appending modal to document body...');
			document.body.appendChild(modalOverlay);
			////console.log('Tournament modal should now be visible');

		} catch (error) {
			console.error('Failed to load friends for tournament:', error);
			CommonComponent.showMessage(`❌ ${language_obj['Failed_to_load_friends_list']}`, 'error');
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

			// Get current user for the tournament message
			const currentUser = await UserService.getCurrentUser();

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
				CommonComponent.showMessage(`⚠️ ${language_obj['Some_invites_failed']}`, 'warning');
			} else {
				CommonComponent.showMessage(`✅ ${language_obj['Tournament_invites_sent']}`, 'success');

				// Create simple tournament notification message
				const allPlayerNames = [currentUser.displayName, ...players.map(p => p.displayName)];
				const tournamentLink = `${window.location.origin}/game/online/tournament/${gameId}`;

				const tournamentMessage = `🏆 ${currentUser.displayName} ${language_obj['Started_a_tournament_with']} ${allPlayerNames.join(', ')}! ${language_obj['Join_now']} ${tournamentLink}`;

				// Send tournament notification message to each invited player using ChatService
				const chatPromises = players.map(async (player) => {
					try {
						const result = await ChatService.postMessage(player.id, tournamentMessage);
						if (result.success) {
							//console.log(`✅ Tournament message sent successfully to ${player.displayName}`);
						} else {
							console.error(`❌ Failed to send tournament message to ${player.displayName}:`, result.error);
						}
						return result;
					} catch (error) {
						console.error(`❌ Failed to send tournament message to ${player.displayName}:`, error);
						return { success: false, error: error.message };
					}
				});

				// try {
				// 	const results = await Promise.all(chatPromises);
				// 	const successfulMessages = results.filter(r => r.success).length;
				// 	const failedMessages = results.filter(r => !r.success).length;

				// 	if (failedMessages === 0) {
				// 		//console.log('✅ All tournament notification messages sent successfully');
				// 	} else {
				// 		//console.log(`⚠️ ${successfulMessages} messages sent successfully, ${failedMessages} failed`);
				// 	}
				// } catch (error) {
				// 	console.error('❌ Some tournament messages failed to send:', error);
				// }
			}

			window.location.href = `/game/online/tournament/${gameId}`;

		} catch (error) {
			console.error('Failed to create tournament:', error);
			CommonComponent.showMessage(`❌ ${language_obj['Failed_to_create_tournament']}`, 'error');
		}
	}

	private static async sendGameInvite(friend: any, gameType: 'duo' | 'tournament'): Promise<void> {
		try {
			// Check if friend is currently the logged-in user
			const currentUser = await UserService.getCurrentUser();
			if (friend.id === currentUser?.id) {
				CommonComponent.showMessage(`❌ ${language_obj['Cannot_invite_self']}`, 'error');
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

			CommonComponent.showMessage(`✅ ${gameType === 'duo' ? 'Duo' : `${language_obj['Tournament']}`} ${language_obj['Invite_sent_to']} ${friend.displayName}!`, 'success');

			// Navigate to the appropriate game page
			const route = gameType === 'duo'
				? `/game/online/duo/${gameId}`
				: `/game/online/tournament/${gameId}`;
			if (window.top) {
				window.top.location.href = route;
			} else {
				window.location.href = route;
			}

		} catch (error) {
			console.error('Failed to invite:', error);
			CommonComponent.showMessage(`❌ ${error.message || `${language_obj['Failed_to_send']} ${gameType} ${language_obj['Invite']}`}`, 'error');
		}
	}
}
