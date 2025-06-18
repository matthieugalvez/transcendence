import '../styles.css';
import { router } from '../configs/simplerouter';
import { BackgroundComponent } from '../components/background.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';

export async function renderChatPage() {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';

	BackgroundComponent.applyNormalGradientLayout();

	let		user = await UserService.getCurrentUser();
	ChatService.postMessage(user.id, 'test');
	const	messages = ChatService.getAllMessages();
//	const	send_box = document.createElement('div');
//	send_box.className = 'container';
}
