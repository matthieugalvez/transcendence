import '../styles.css';
import { router } from '../configs/simplerouter';
import { BackgroundComponent } from '../components/background.component';

export function renderChatPage(): void {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';

	BackgroundComponent.applyNormalGradientLayout();
}
