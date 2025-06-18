import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';

export async function renderChatPage() {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';

	BackgroundComponent.applyCenteredGradientLayout();

//	let		user = await UserService.getCurrentUser();
//	ChatService.postMessage(user.id, 'test');
//	ChatService.editMessage(1, 'edit test');
	const	messages = await ChatService.getAllMessages();
	console.log(messages);
	const	send_box = document.createElement('div');
	send_box.className = 'backdrop-blur-md flex flex-col items-end text-right';

	for (const message of messages) {
		makeMsgBox(send_box, message.content);
	}

	document.body.appendChild(send_box);
}

function makeMsgBox(content_box: Element, content: string) {
	const	send_box_text = document.createElement('p');
	send_box_text.className = 'text-sm font-medium ml-3';
	send_box_text.textContent = content;
	content_box.appendChild(send_box_text);
}
