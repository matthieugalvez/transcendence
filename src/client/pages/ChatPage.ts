import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { CommonComponent } from '../components/common.component';
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
	const	send_box = document.createElement('nav');
	send_box.className = `
        fixed left-10 top-10 h-[90%] w-110
        bg-blue-950/70 backdrop-blur-2xl
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-start p-6
        space-y-4 z-11
    `.trim();

	for (const message of messages) {
		makeMsgBox(send_box, message);
	}

	document.body.appendChild(send_box);
}

function makeMsgBox(content_box: Element, message) {
	const	send_box_text = document.createElement('nav');
	send_box_text.className = `
    font-['Orbitron']
    text-white font-semibold
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `.replace(/\s+/g, ' ').trim();
	send_box_text.style.whiteSpace = 'pre-line';
	send_box_text.style.fontSize = '14px';
	send_box_text.style.margin = '2px';
	send_box_text.textContent = `
		send by: ${message.sender_id} \r\n
		at: ${message.created_at}
	`;
	content_box.appendChild(send_box_text);

	const	send_box_content = document.createElement('nav');
	send_box_content.className = `
    font-['Orbitron']
    left-10 w-100
    text-white font-semibold
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
	`.replace(/\s+/g, ' ').trim();
	send_box_content.style.whiteSpace = 'pre';
	send_box_content.textContent = `
		${message.content}
	`;
	content_box.appendChild(send_box_content);
}
