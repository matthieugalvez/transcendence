import { router } from "../configs/simplerouter";
import { CommonComponent } from './common.component';
import { AuthComponent } from './auth.component';
import { UserSearchComponent } from "./usersearch.component";
import { UserService } from "../services/user.service";

export interface SidebarOptions {
	userName: string;
	avatarUrl: string;
	showStats?: boolean;
	showSettings?: boolean;
	showBackHome?: boolean;
	showUserSearch?: boolean;
	showFriendsBtn?: boolean;
}

export class SidebarComponent {
	static async render(opts: SidebarOptions) {
		const { userName, avatarUrl, showStats = false, showBackHome = false, showSettings = false, showUserSearch = true, showFriendsBtn = true } = opts;
		const sidebar = document.createElement("div");
		sidebar.className = `
			fixed left-10 top-10 h-[90%] w-80
			bg-blue-950/70 backdrop-blur-2xl
			rounded-lg text-lg transition-colors
			focus:outline-none focus:ring-2
			shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
			disabled:opacity-50 disabled:cursor-not-allowed
			border-2 border-black
			flex flex-col items-start p-6
			space-y-4 z-11
    	`.trim();

		console.log('🔍 Sidebar Avatar URL Debug:', {
    avatarUrl,
    type: typeof avatarUrl,
    isNull: avatarUrl === null,
    isUndefined: avatarUrl === undefined,
    isEmpty: avatarUrl === '',
    isNullString: avatarUrl === 'null'
});


		// Profil picture of user (with default one if none)
		// console.log(`Avatar URL: ${avatarUrl}`);
		const profilPic = document.createElement('img');
		profilPic.src = avatarUrl;
		profilPic.alt = `${userName}'s profile`;
		profilPic.className = `
			w-30 h-30
			rounded-full
			border-2 border-white
			object-cover
			mb-2
			mx-auto
    	`.replace(/\s+/g, " ").trim();
		sidebar.appendChild(profilPic);

		// Add emoji decorations
		const gameEmoji = document.createElement('div');
		gameEmoji.textContent = '🏓';
		gameEmoji.className = 'text-4xl mb-4 -mt-8 z-10';
		gameEmoji.classList.add("w-full", "text-center");
		sidebar.appendChild(gameEmoji);

		// Welcome title with user's name
		const pageTitle = document.createElement('h1');
		pageTitle.textContent = `Welcome ${userName}`;
		pageTitle.className = `
			font-['Canada-big'] uppercase font-bold
			text-4xl text-center mb-2
			bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
			bg-clip-text text-transparent
			select-none
    	`.replace(/\s+/g, ' ').trim();
		pageTitle.style.letterSpacing = "0.1em";
		pageTitle.classList.add("w-full", "text-center");
		sidebar.appendChild(pageTitle);

		// Stat button
		if (showStats) {
			const profileBtn = CommonComponent.createStylizedButton('👤 My profile', 'blue');
			profileBtn.classList.add("w-full", "flex", "justify-center", "whitespace-nowrap", "cursor-pointer");
			profileBtn.onclick = () => router.navigate('/profile');
			sidebar.appendChild(profileBtn);
		}


		if (showFriendsBtn) {
			// Create a container for the button with notification
			const friendsBtnContainer = document.createElement('div');
			friendsBtnContainer.className = 'relative w-full';

			const friendsBtn = CommonComponent.createStylizedButton('👥 Friendlist', 'blue');
			friendsBtn.classList.add("w-full", "flex", "justify-center", "whitespace-nowrap", "cursor-pointer");
			friendsBtn.onclick = () => router.navigate('/friendlist');

			// Create notification bell (always create it, just hide/show as needed)
			const notificationBell = document.createElement('div');
			notificationBell.className = 'absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white';
			notificationBell.style.fontSize = '12px';
			notificationBell.style.display = 'none'; // Start hidden
			friendsBtnContainer.appendChild(notificationBell);

			// Function to update notification
			const updateNotification = async () => {
				try {
					const hasPendingRequests = await this.checkForPendingRequests();
					notificationBell.style.display = hasPendingRequests ? 'flex' : 'none';
				} catch (error) {
					console.error('Failed to update notification:', error);
				}
			};

			// Initial check
			updateNotification();

			// Set up periodic refresh every 10 seconds
			const notificationInterval = setInterval(updateNotification, 50000);

			// Store interval ID for cleanup (optional)
			friendsBtnContainer.setAttribute('data-interval-id', notificationInterval.toString());

			friendsBtnContainer.appendChild(friendsBtn);
			sidebar.appendChild(friendsBtnContainer);
		}

		if (showUserSearch) {
			const searchContainer = document.createElement('div');
			searchContainer.className = 'w-full mb-4';

			// 	const searchTitle = document.createElement('h3');
			// 	searchTitle.textContent = 'Find Users';
			// 	searchTitle.className = `
			//     font-['Orbitron'] text-white text-sm font-medium mb-2
			//     text-center
			// `;
			// 	searchContainer.appendChild(searchTitle);

			// Render the user search component
			UserSearchComponent.render(searchContainer);
			sidebar.appendChild(searchContainer);
		}

		// Pousse les bouttons suivants tout en bas
		const bottomContainer = document.createElement('div');
		bottomContainer.className = 'mt-auto w-full space-y-2';
		// Back to home button
		if (showBackHome) {
			const backButton = CommonComponent.createStylizedButton('Back to Home', 'orange');
			backButton.classList.add("w-full", "text-center", "whitespace-nowrap", "cursor-pointer");
			backButton.onclick = () => {
  				window.dispatchEvent(new Event('app:close-sockets')); // exec event des sockets dans app:close
   				router.navigate('/home');
			}
			bottomContainer.appendChild(backButton);
		}
		// Settings button
		if (showSettings) {
			const settingBtn = CommonComponent.createStylizedButton("Settings", "blue");
			settingBtn.classList.add("w-full", "text-center", "cursor-pointer");
			settingBtn.onclick = () => router.navigate("/settings");
			bottomContainer.appendChild(settingBtn);

		}
		// Logout button
		const logoutBtn = CommonComponent.createStylizedButton("Logout", "red");
		logoutBtn.classList.add("w-full", "text-center", "cursor-pointer");
		logoutBtn.addEventListener("click", async () => {
			const success = await AuthComponent.logoutUser();
			if (success) {
				document.body.innerHTML = "";
				setTimeout(() => router.navigate("/auth"), 300);
			}
		});
		bottomContainer.appendChild(logoutBtn);

		sidebar.appendChild(bottomContainer);
		document.body.appendChild(sidebar);
		return sidebar;
	}

	private static async checkForPendingRequests(): Promise<boolean> {
		try {
			const currentUser = await UserService.getCurrentUser();

			// Check for incoming friend requests
			const friendsResponse = await UserService.getFriends();
			const friendsList = friendsResponse?.data || friendsResponse || [];
			const pendingFriendRequests = friendsList.filter(f =>
				f.status === 'PENDING' && f.receiverId === currentUser.id
			);

			// Check for pending game invites
			const invitesResponse = await fetch('/api/invites');
			const invitesData = await invitesResponse.json();
			const pendingGameInvites = invitesData.invites || [];

			// Return true if there are any pending friend requests OR game invites
			return pendingFriendRequests.length > 0 || pendingGameInvites.length > 0;
		} catch (error) {
			console.error('Failed to check pending requests:', error);
			return false;
		}
	}
}
