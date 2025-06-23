import '../styles.css';
import { HomeRender } from '../renders/home.render';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
//import { AuthRender } from '../renders/auth.render';
import { AuthComponent } from '../components/auth.component';
import { UserSearchComponent } from '../components/usersearch.component';


export async function RenderHomePage(): Promise<void> {
	document.title = "Home";
	document.body.innerHTML = "";
	BackgroundComponent.applyAnimatedGradient();





	try {
		// Fetch user data first - if this fails, we handle it in catch block
		let user = await UserService.getCurrentUser();

		if (!user.displayName || user.displayName == '') {
			const result = await AuthComponent.checkAndHandleDisplayName();
			if (result.success && result.userData) {
				// Use the updated user data
				user = result.userData;
			} else {
				// If checkAndHandleDisplayName failed, it already handled redirect
				return;
			}
		}

		// Only render sidebar and main content if authentication succeeds
		SidebarComponent.render({
			userName: user.displayName,
			showStats: true,
			showSettings: true,
			avatarUrl: user.avatar,
			showBackHome: false,
			showUserSearch: true
		});



		const main = document.createElement("div");
		main.className = "min-h-screen min-w-screen flex items-start justify-center";
		document.body.appendChild(main);



		await HomeRender.renderInto(main);


	} catch (error) {
		console.error('Failed to fetch user data:', error);

		// Show error and redirect to auth - same as SettingsRender
		CommonComponent.handleAuthError();
	}
}
