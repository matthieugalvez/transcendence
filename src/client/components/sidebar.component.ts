import { router } from "../configs/simplerouter";
import { CommonComponent } from './common.component';
import { AuthComponent } from './auth.component';
import { UserSearchComponent } from "./usersearch.component";

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
	static render(opts: SidebarOptions): HTMLDivElement {
		const { userName, avatarUrl, showStats = false, showBackHome = false, showSettings = false, showUserSearch = true, showFriendsBtn = true} = opts;
		const sidebar = document.createElement("nav");
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

		// Profil picture of user (with default one if none)
		console.log(`Avatar URL: ${avatarUrl}`);
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
			const statButton = CommonComponent.createStylizedButton('👤 My profile', 'blue');
			statButton.classList.add("w-full", "flex", "justify-center", "whitespace-nowrap", "cursor-pointer");
			statButton.addEventListener('click', () => {
				router.navigate('/profile');
			});
			sidebar.appendChild(statButton);
		}


		if (showFriendsBtn) {
			const friendsBtn = CommonComponent.createStylizedButton('👥 Friendlist', 'blue');
			friendsBtn.classList.add("w-full", "flex", "justify-center", "whitespace-nowrap", "cursor-pointer");
			friendsBtn.addEventListener('click', () => {
				router.navigate('/friendlist');
			});
			sidebar.appendChild(friendsBtn);
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


		// provisoire
	// 	const subtitle = document.createElement('p');
	// 	subtitle.textContent = 'statistics of user here to logout button';
	// 	subtitle.className = `
    //   font-['Orbitron'] text-center text-white
    //   text-sm font-medium mb-8
    // `.replace(/\s+/g, ' ').trim();
	// 	subtitle.style.letterSpacing = "0.05em";
	// 	sidebar.appendChild(subtitle);

		// pousse les bouttons suivants tout en bas
		const bottomContainer = document.createElement('div');
		bottomContainer.className = 'mt-auto w-full space-y-2';

		// Back to home button
		if (showBackHome) {
			const backButton = CommonComponent.createStylizedButton('Back to Home', 'orange');
			backButton.classList.add("w-full", "text-center", "whitespace-nowrap", "cursor-pointer");
			backButton.addEventListener('click', () => {
				router.navigate('/home');
			});
			bottomContainer.appendChild(backButton);
		}
		if (showSettings) {
			const settingBtn = CommonComponent.createStylizedButton("Settings", "blue");
			settingBtn.classList.add("w-full", "text-center", "cursor-pointer");
			settingBtn.addEventListener("click", async () => {
				setTimeout(() => router.navigate("/settings"), 300);
			});
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
}
