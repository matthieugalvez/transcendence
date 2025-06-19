import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
//import { CommonComponent } from '../components/common.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';

export async function renderChatPage() {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';
	const	user = await UserService.getCurrentUser();
	const	receiver = await UserService.getCurrentUser();

	BackgroundComponent.applyCenteredGradientLayout();

	const	title_box = document.createElement('nav');
	title_box.className = `
		font-['Orbitron']
		text-white font-semibold
		border-2 border-black
        fixed left-[5%] top-2 h-[5%] w-[90%]
        bg-blue-950/70 backdrop-blur-2xl
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-center justify-center p-6
        space-y-4 z-11
	`.trim();
	title_box.textContent = `Chat room between ${user.displayName} & ${receiver.displayName}`

	ChatService.postMessage(user.id, 'test');
//	ChatService.editMessage(1, 'edit test');
	let		messages = await ChatService.getAllMessages();
	if (messages.length > 6)
	{
		await ChatService.deleteMessage(messages[0].id);
		messages = await ChatService.getAllMessages();
	}
	const	send_box = document.createElement('nav');
	send_box.className = `
        fixed left-10 top-20 h-[75%] w-[45%]
        bg-blue-950/70 backdrop-blur-2xl
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-start p-6
        space-y-4 z-11
    `.trim();

	const	received_box = document.createElement('nav');
	received_box.className = `
        fixed right-10 top-20 h-[75%] w-[45%]
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
		if (message.sender_id == user.id)
			makeMsgBox(send_box, message);
		if (message.receiver_id == user.id)
			makeMsgBox(received_box, message);
	}

	document.body.appendChild(title_box);
	document.body.appendChild(send_box);
	document.body.appendChild(received_box);
}

function makeMsgBox(content_box: Element, message) {
	const	send_box_date = document.createElement('nav');
	send_box_date.className = `
    font-['Orbitron']
    text-white font-semibold
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
    flex flex-col items-center justify-center
  `.replace(/\s+/g, ' ').trim();
//	send_box_date.style.whiteSpace = 'pre-line';
	send_box_date.style.fontSize = '14px';
	send_box_date.style.margin = '2px';
	send_box_date.textContent = `
		at: ${message.created_at}
	`;
	content_box.appendChild(send_box_date);

	const	send_box_content = document.createElement('nav');
	send_box_content.className = `
    font-['Orbitron']
    left-10 w-[100%]
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
