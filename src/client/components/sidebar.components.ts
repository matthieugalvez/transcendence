import { router } from "../configs/simplerouter";
import { CommonComponent } from '../components/common.component';
import { AuthComponent } from '../components/auth.component';
import defaultAvatar from "../assets/profilpic/profilpic1.png";
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();

export interface SidebarOptions {
  userName: string;
  avatarUrl?: string;
  showStats?: boolean;
  showSettings?: boolean;
  showBackHome?: boolean;
}

export class SidebarComponent {
  static render(opts: SidebarOptions): HTMLDivElement {
    const { userName, avatarUrl, showStats = false, showBackHome = false, showSettings = false } = opts;
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
        space-y-4
    `.trim();

    // Profil picture of user (with default one if none)
    const profilPic = document.createElement('img');
    profilPic.src = avatarUrl ?? defaultAvatar;
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
    pageTitle.textContent = `${language_obj['Onboardingpage_welcome']} ${userName}`;
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
        const statButton = CommonComponent.createStylizedButton(`${language_obj['Sidebar_stats']}`, 'blue');
        statButton.classList.add("w-full", "flex", "justify-center", "whitespace-nowrap", "cursor-pointer");
        statButton.addEventListener('click', () => {
            router.navigate('/UserStat');
        });
        sidebar.appendChild(statButton);
    }

    // provisoire
    const subtitle = document.createElement('p');
    subtitle.textContent = 'statistics of user here to logout button';
    subtitle.className = `
      font-['Orbitron'] text-center text-white
      text-sm font-medium mb-8
    `.replace(/\s+/g, ' ').trim();
    subtitle.style.letterSpacing = "0.05em";
    sidebar.appendChild(subtitle);

    // pousse les bouttons suivants tout en bas
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'mt-auto w-full space-y-2';

    // tournament
    // const tournamentButton = CommonComponent.createStylizedButton('Tournament - provisoire', 'gray');
    // tournamentButton.classList.add("w-full", "text-center", "cursor-pointer");
    // tournamentButton.addEventListener('click', () => {
    //     router.navigate('/tournament');
    // });
    // bottomContainer.appendChild(tournamentButton);

    // Back to home button
    if (showBackHome) {
        const backButton = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_backhome_button']}`, 'gray');
        backButton.classList.add("w-full", "text-center", "cursor-pointer");
        backButton.addEventListener('click', () => {
        router.navigate('/home');
        });
        bottomContainer.appendChild(backButton);
    }
	if (showSettings) {
			const settingBtn = CommonComponent.createStylizedButton(`${language_obj['Sidebar_settings']}`, "blue");
			settingBtn.classList.add("w-full", "text-center", "cursor-pointer");
			settingBtn.addEventListener("click", async () => {
			setTimeout(() => router.navigate("/settings"), 300);
			});
    bottomContainer.appendChild(settingBtn);

	}

    // Logout button
    const logoutBtn = CommonComponent.createStylizedButton(`${language_obj['Onboardingpage_logout_button']}`, "red");
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
