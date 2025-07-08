import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from '../components/sidebar.component';
import { UserService } from '../services/user.service';
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';
import { FriendsRender } from '../renders/friends.render';
import { UserSearchComponent } from '../components/usersearch.component';
import { language_obj } from '../index.ts';

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

		// Content-aware sidebar (hides friends button when on friends page)
		await SidebarComponent.render({
			userName: currentUser.displayName,
			avatarUrl: currentUser.avatar,
			showStats: true,
			showSettings: true,
			showBackHome: true,
			showUserSearch: false,
			showFriendsBtn: false // Hide friends button since we're on friends page
		});

		const container = document.createElement('div');
		container.className = 'main-content flex items-center justify-center p-8'; // Add main-content class

		const friendsCard = document.createElement('div');
		friendsCard.className = `
            bg-white/90 backdrop-blur-md border-2 border-black rounded-xl
            p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
            max-w-4xl w-full mx-4
        `;

		const title = document.createElement('h1');
		title.textContent = `${language_obj['Friends_and_request']}`;
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
		searchTitle.textContent = `${language_obj['Find_friends']}`;
		searchTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-gray-800`;

		const searchContainer = document.createElement('div');
		searchContainer.className = 'mt-4';

		UserSearchComponent.render(searchContainer);

		searchSection.appendChild(searchTitle);
		searchSection.appendChild(searchContainer);

		// --- Game Invites Section ---
		const invitesSection = document.createElement('div');
		invitesSection.className = 'mb-8 pb-8 border-b border-gray-300';

		const invitesTitle = document.createElement('h3');
		invitesTitle.textContent = `${language_obj['Game_invites']}`;
		invitesTitle.className = `font-['Orbitron'] text-xl font-bold mb-4 text-gray-800`;

		const invitesContainer = document.createElement('div');
		invitesContainer.className = 'mt-4 space-y-3';

		// Fetch and render invites
		try {
			const res = await fetch('/api/invites');
			const { invites } = await res.json();

			if (!invites || invites.length === 0) {
				invitesContainer.innerHTML = `<p class="text-gray-500">${language_obj['No_game_invites']}</p>`;
			} else {
				for (const invite of invites) {
					const inviteCard = document.createElement('div');
					inviteCard.className = 'bg-yellow-50 p-4 rounded-lg flex items-center justify-between';

					const info = document.createElement('span');
					info.textContent = `${language_obj['Game_invite_for']} ${invite.inviter.displayName} ${language_obj['For_a_game_of']} ${invite.gameType}`;

					const actions = document.createElement('div');
					actions.className = 'flex space-x-2';

					const acceptBtn = CommonComponent.createStylizedButton(`${language_obj['Accept']}`, 'blue');
					acceptBtn.className = acceptBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Make buttons smaller
					acceptBtn.onclick = async () => {
						await fetch(`/api/invite/${invite.id}/accept`, { method: 'POST' });
						window.location.href = `/game/online/duo/${invite.gameId}`;
					};

					const declineBtn = CommonComponent.createStylizedButton(`${language_obj['Decline']}`, 'red');
					declineBtn.className = declineBtn.className.replace('py-2 px-4', 'py-1 px-3 text-sm'); // Make buttons smaller
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
			invitesContainer.innerHTML = `<p class="text-red-500">${language_obj['Failed_to_load_invites']}</p>`;
		}

		invitesSection.appendChild(invitesTitle);
		invitesSection.appendChild(invitesContainer);

		friendsCard.appendChild(searchSection);
		friendsCard.appendChild(invitesSection);

		// Now render the friends list
		await FriendsRender.renderFriendsList(friendsCard);

		container.appendChild(friendsCard);
		document.body.appendChild(container);

		const	LanguageMenu = CommonComponent.createLanguageMenu(language_obj['_lang']);
		document.body.appendChild(LanguageMenu);

	} catch (error) {
		console.error('Failed to load friends page:', error);
		CommonComponent.handleAuthError();
	}
}
