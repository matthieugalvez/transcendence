import '../styles.css';
import { HomeRender } from '../renders/home.render';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';

export async function RenderHomePage(): Promise<void>{
    document.title = "Home";
    //document.body.innerHTML = "";
	BackgroundComponent.applyAnimatedGradient();
    const user = await UserService.getCurrentUser();
    SidebarComponent.render({
        userName: user.name,
        showStats: true,
		showSettings: true,
        showBackHome: false
    });

    const main = document.createElement("div");
    main.className = "min-h-screen min-w-screen flex items-start justify-center";
    document.body.appendChild(main);
    await HomeRender.renderInto(main);
}