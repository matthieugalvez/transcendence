import '../styles.css';
import { HomeRender } from '../renders/home.render';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
//import { AuthRender } from '../renders/auth.render';
import { AuthComponent } from '../components/auth.component';
import { UserSearchComponent } from '../components/usersearch.component';
const	language_obj = await UserService.GetLanguageFile();


export async function RenderHomePage(): Promise<void> {
    document.title = "Home";
    document.body.innerHTML = "";
    BackgroundComponent.applyAnimatedGradient();

	const	LanguageMenu = CommonComponent.createLanguageMenu(language_obj['_lang']);
	document.body.appendChild(LanguageMenu);

    const main = document.createElement("div");
    main.className = "min-h-screen min-w-screen flex items-start justify-center";
    document.body.appendChild(main);
    await HomeRender.renderInto(main);
    try {
        let user = await UserService.getCurrentUser();

        if (!user.displayName || user.displayName == '') {
            const result = await AuthComponent.checkAndHandleDisplayName();
            if (result.success && result.userData) {
                user = result.userData;
            } else {
                return;
            }
        }

        // Content-aware sidebar (hides back to home button when on home page)
        await SidebarComponent.render({
            userName: user.displayName,
            showStats: true,
            showSettings: true,
            avatarUrl: user.avatar,
            showBackHome: false, // Hide back to home button since we're on home page
            showUserSearch: false,
            showFriendsBtn: true
        });

        const main = document.createElement("div");
        main.className = "main-content-home flex items-start justify-center responsive-container"; // Add responsive-container
        document.body.appendChild(main);

        await HomeRender.renderInto(main);

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        CommonComponent.handleAuthError();
    }
}
