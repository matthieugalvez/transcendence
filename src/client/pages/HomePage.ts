import '../styles.css';
import { HomeRender } from '../renders/home.render';
import { SidebarComponent } from "../components/sidebar.components";
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();

export async function RenderHomePage(): Promise<void>{
	document.title = `${language_obj['Homepage_title']}`;
    document.body.innerHTML = "";
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
