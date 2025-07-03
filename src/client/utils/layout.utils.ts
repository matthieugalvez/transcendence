import { SidebarComponent, SidebarOptions } from '../components/sidebar.component';

export class LayoutUtils {
    static async createPageWithSidebar(sidebarOptions: SidebarOptions): Promise<{
        appContainer: HTMLElement,
        sidebar: HTMLElement,
        mainContent: HTMLElement
    }> {
        // Clear body content

        document.body.innerHTML = '';

        // Create the main app container
        const appContainer = document.createElement('div');
        appContainer.className = 'relative min-h-screen';

        // Create and add sidebar
        const sidebar = await SidebarComponent.render(sidebarOptions);
        appContainer.appendChild(sidebar);

        // Create main content area that accounts for sidebar
        const mainContent = document.createElement('div');
        mainContent.className = 'ml-[22rem] min-h-screen'; // 22rem = 352px (80 + 40 margin + padding)

        appContainer.appendChild(mainContent);
        document.body.appendChild(appContainer);
		

        return { appContainer, sidebar, mainContent };
    }
}