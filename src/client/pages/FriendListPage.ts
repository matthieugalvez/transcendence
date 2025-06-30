import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from '../components/sidebar.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { FriendsRender } from '../renders/friends.render';

// ...existing imports...

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

		await SidebarComponent.render({
			userName: currentUser.displayName,
			avatarUrl: currentUser.avatar,
			showStats: true,
			showSettings: true,
			showBackHome: true,
			showUserSearch: false
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

		// --- Search Section ---
		const searchSection = document.createElement('div');
		searchSection.className = 'mb-8 pb-8 border-b border-gray-300';

		const searchTitle = document.createElement('h3');
		searchTitle.textContent = 'Find Friends';
		searchTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-gray-800`;

		const searchForm = document.createElement('div');
		searchForm.className = 'flex gap-2';

		const searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.placeholder = 'Search by display name...';
		searchInput.className = 'flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

		const searchButton = CommonComponent.createStylizedButton('Search', 'blue');

		const resultsContainer = document.createElement('div');
		resultsContainer.className = 'mt-4 space-y-3';

		searchButton.onclick = async () => {
			const query = searchInput.value.trim();
			if (!query) return;

			try {
				searchButton.disabled = true;
				searchButton.textContent = 'Searching...';
				resultsContainer.innerHTML = '<p class="text-gray-500">Searching...</p>';

				const results = await UserService.searchUsers(query);

				resultsContainer.innerHTML = '';
				if (results.length === 0) {
					resultsContainer.innerHTML = '<p class="text-gray-500">No users found</p>';
					return;
				}

				for (const user of results) {
					// Don't show current user in results
					if (user.id === currentUser.id) continue;

					const resultCard = document.createElement('div');
					resultCard.className = 'bg-gray-50 p-6 rounded-lg flex items-center justify-between';

					const userInfo = document.createElement('div');
					userInfo.className = 'flex items-center space-x-3';

					// Normalize avatar path
					const avatarUrl = user.avatar && user.avatar.startsWith('/avatars/')
						? user.avatar
						: `/avatars/${user.avatar || 'default.svg'}`;

					const avatar = document.createElement('img');
					avatar.src = avatarUrl;
					avatar.alt = `${user.displayName}'s avatar`;
					avatar.className = 'w-12 h-12 rounded-full object-cover';

					const name = document.createElement('span');
					name.textContent = user.displayName;
					name.className = `font-['Orbitron'] font-medium ml-2 mr-8`;

					userInfo.appendChild(avatar);
					userInfo.appendChild(name);

					const actions = document.createElement('div');

					// Get friendship status to show appropriate button
					let friendBtn;
					try {
						const friendship = await UserService.getFriendshipStatus(user.id);

						if (friendship.status === 'friends') {
							friendBtn = CommonComponent.createStylizedButton('Already Friends', 'gray');
							friendBtn.disabled = true;
						} else if (friendship.status === 'pending') {
							friendBtn = CommonComponent.createStylizedButton('Request Sent', 'gray');
							friendBtn.disabled = true;
						} else if (friendship.status === 'incoming') {
							friendBtn = CommonComponent.createStylizedButton('Accept Request', 'blue');
							friendBtn.onclick = async () => {
								try {
									friendBtn.disabled = true;
									friendBtn.textContent = 'Accepting...';
									await UserService.acceptFriendRequest(friendship.requestId!);
									friendBtn.textContent = 'Friends';
								} catch (error) {
									console.error('Failed to accept request:', error);
									friendBtn.disabled = false;
									friendBtn.textContent = 'Accept Request';
									CommonComponent.showMessage('❌ Failed to accept friend request', 'error');
								}
							};
						} else {
							friendBtn = CommonComponent.createStylizedButton('Add Friend', 'blue');
							friendBtn.onclick = async () => {
								try {
									friendBtn.disabled = true;
									friendBtn.textContent = 'Sending...';
									await UserService.addFriend(user.id);
									friendBtn.textContent = 'Request Sent';
								} catch (error) {
									console.error('Failed to send request:', error);
									friendBtn.disabled = false;
									friendBtn.textContent = 'Add Friend';
									CommonComponent.showMessage('❌ Failed to send friend request', 'error');
								}
							};
						}
					} catch (error) {
						console.error('Failed to get friendship status:', error);
						friendBtn = CommonComponent.createStylizedButton('Add Friend', 'blue');
					}

					const profileBtn = CommonComponent.createStylizedButton('Profile', 'purple');
					profileBtn.onclick = () => {
						window.location.href = `/profile/${encodeURIComponent(user.displayName)}`;
					};

					actions.className = 'flex space-x-2';
					actions.appendChild(friendBtn);
					actions.appendChild(profileBtn);

					resultCard.appendChild(userInfo);
					resultCard.appendChild(actions);
					resultsContainer.appendChild(resultCard);
				}
			} catch (error) {
				console.error('Search error:', error);
				resultsContainer.innerHTML = '<p class="text-red-500">An error occurred during search</p>';
			} finally {
				searchButton.disabled = false;
				searchButton.textContent = 'Search';
			}
		};

		const invitesSection = document.createElement('div');
		invitesSection.className = 'mb-8 pb-8 border-b border-gray-300';

		const invitesTitle = document.createElement('h3');
		invitesTitle.textContent = 'Game Invites';
		invitesTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-gray-800`;

		const invitesContainer = document.createElement('div');
		invitesContainer.className = 'mt-4 space-y-3';

		// Fetch and render invites
		try {
			const res = await fetch('/api/invites');
			const { invites } = await res.json();

			if (!invites || invites.length === 0) {
				invitesContainer.innerHTML = '<p class="text-gray-500">No game invites</p>';
			} else {
				for (const invite of invites) {
					const inviteCard = document.createElement('div');
					inviteCard.className = 'bg-yellow-50 p-6 rounded-lg flex items-center justify-between';

					const info = document.createElement('span');
					info.textContent = `Game invite from ${invite.invitee.displayName} for game ${invite.gameId}`;

					const actions = document.createElement('div');
					actions.className = 'flex space-x-2';

					const acceptBtn = CommonComponent.createStylizedButton('Accept', 'green');
					acceptBtn.onclick = async () => {
						await fetch(`/api/invite/${invite.id}/accept`, { method: 'POST' });
						window.location.href = `/join/${invite.gameId}`;
					};

					const declineBtn = CommonComponent.createStylizedButton('Decline', 'red');
					declineBtn.onclick = async () => {
						await fetch(`/api/invite/${invite.id}/decline`, { method: 'POST' });
						inviteCard.remove();
					};

					actions.appendChild(acceptBtn);
					actions.appendChild(declineBtn);

					inviteCard.appendChild(info);
					inviteCard.appendChild(actions);
					invitesContainer.appendChild(inviteCard);
				}
			}
		} catch (error) {
			invitesContainer.innerHTML = '<p class="text-red-500">Failed to load invites</p>';
		}



		searchForm.appendChild(searchInput);
		searchForm.appendChild(searchButton);

		searchSection.appendChild(searchTitle);
		searchSection.appendChild(searchForm);
		searchSection.appendChild(resultsContainer);

		invitesSection.appendChild(invitesTitle);
		invitesSection.appendChild(invitesContainer);

		friendsCard.appendChild(searchSection);

		friendsCard.appendChild(invitesSection);

		// Now render the friends list
		await FriendsRender.renderFriendsList(friendsCard);

		container.appendChild(friendsCard);
		document.body.appendChild(container);

	} catch (error) {
		console.error('Failed to load friends page:', error);
		CommonComponent.handleAuthError();
	}
}