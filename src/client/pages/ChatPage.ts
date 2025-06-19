import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { CommonComponent } from '../components/common.component';
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
        bg-amber-300/50
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-center justify-center p-6
        space-y-4 z-11
	`.trim();
	title_box.textContent = `Chat room between ${user.displayName} & ${receiver.displayName}`

	document.body.appendChild(title_box);

//	ChatService.postMessage(user.id, 'test');
//	ChatService.editMessage(1, 'edit test');
	let		messages = await ChatService.getAllMessages();
	while (messages.length > 9)
	{
		await ChatService.deleteMessage(messages[0].id);
		messages = await ChatService.getAllMessages();
	}
	const	send_box = document.createElement('nav');
	send_box.className = `
        fixed left-[2.5%] top-[7%] h-[65%] w-[46%]
        bg-amber-300/50
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
        fixed right-[2.5%] top-[7%] h-[65%] w-[46%]
        bg-amber-300/50
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

	document.body.appendChild(send_box);
	document.body.appendChild(received_box);

	const	prompt_box = document.createElement('div');
	prompt_box.className = `
        fixed bottom-5 h-[25%] w-[99%]
        bg-amber-300/50
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-start p-6
        space-y-4 z-11
	`.trim()

	const	prompt_title = document.createElement('label');
	prompt_title.className = `
    font-['Orbitron']
    text-white font-semibold
  `.trim();
	prompt_title.textContent = 'New message:';

	const	prompt_area = document.createElement('textarea');
	prompt_area.className = `
    font-['Orbitron']
    bg-purple-900/100 backdrop-blur-2xl
    h-[65%] w-[100%]
    text-white font-semibold p-1
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
	resize-none
	`.replace(/\s+/g, ' ').trim()
	prompt_area.placeholder = 'Type Message here...';

	const	send_button = CommonComponent.createStylizedButton("Send", 'blue');
	send_button.style.position = 'inherit';
	send_button.style.right = '35px';
	send_button.style.bottom = '35px';
//	send_button.onclick();

	prompt_box.appendChild(prompt_title);
	prompt_box.appendChild(prompt_area);
	prompt_box.appendChild(send_button);
	document.body.appendChild(prompt_box);
}

function makeMsgBox(content_box: Element, message) {
	const	send_box_date = document.createElement('nav');
	send_box_date.className = `
    font-['Orbitron']
	relative top-[-70px] left-2
    text-white font-semibold
    bg-purple-900/50 backdrop-blur-2xl
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
    flex flex-col items-center justify-center
  `.replace(/\s+/g, ' ').trim();
	send_box_date.style.fontSize = '14px';
	send_box_date.textContent = `
		${message.created_at}
	`;

	const	send_box_content = document.createElement('nav');
	send_box_content.className = `
    font-['Orbitron']
    bg-purple-900/100 backdrop-blur-2xl
    left-10 w-[100%]
    text-white font-semibold p-1
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
	`.replace(/\s+/g, ' ').trim();
	send_box_content.style.whiteSpace = 'pre-line';
	send_box_date.style.margin = '-20px';
	send_box_content.textContent = `
		${message.content}
	`;

	const	margin = document.createElement('div');
	margin.style.margin = '10px';

	content_box.appendChild(send_box_content);
	content_box.appendChild(send_box_date);
	content_box.appendChild(margin);
}
