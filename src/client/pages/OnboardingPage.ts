import '../styles.css';
import { OnboardingRender } from '../renders/onboarding.render';
import { SidebarComponent } from "../components/sidebar.components";
import { UserService } from '../services/user.service';

export async function RenderOnboardingPage(): Promise<void>{
    document.title = "Onboarding";
    document.body.innerHTML = "";
    const user = await UserService.getCurrentUser();
    SidebarComponent.render({
        userName: user.name,
        showStats: true,
        showBackHome: false
    });

    const main = document.createElement("div");
    main.className = "ml-60 min-h-screen flex items-center justify-center p-8";
    document.body.appendChild(main);
    await OnboardingRender.renderInto(main);
}