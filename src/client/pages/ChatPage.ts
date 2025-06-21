import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { CommonComponent } from '../components/common.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';

export async function renderChatPage() {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';
	const	user = await UserService.getCurrentUser();
	const	user_list = await UserService.getAllUsers();
	let		receiver;
	if (user.id === 1) {
		receiver = user_list[1];
	}
	else {
		receiver = user_list[0];
	}

	BackgroundComponent.applyCenteredGradientLayout();

	const	title_box = document.createElement('div');
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

	let		messages = await ChatService.getMessages(receiver.id);
	console.log(messages);
	const	messages_box = document.createElement('div');
	messages_box.className = `
        fixed top-[7%] h-[65%] w-[95%]
        bg-amber-300/50
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col p-6
        space-y-4 z-11
    `.trim();
	messages_box.style.overflow = 'auto';

	for (const message of messages) {
		if (message.sender_id === user.id)
			makeMsgBox(messages_box, message, false);
		if (message.receiver_id === user.id)
			makeMsgBox(messages_box, message, true);
	}

	document.body.appendChild(messages_box);

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

	prompt_area.onkeydown = async (event) => {
		console.log(event.key);
		if (event.key === "Enter" && prompt_area.value.trim()) {
			await ChatService.postMessage(receiver.id, prompt_area.value.trim());
			location.reload();
		}
	};

	const	send_button = CommonComponent.createStylizedButton("Send", 'blue');
	send_button.style.position = 'inherit';
	send_button.style.right = '35px';
	send_button.style.bottom = '35px';
	send_button.onclick = async () => {
		if (prompt_area.value.trim()) {
			await ChatService.postMessage(receiver.id, prompt_area.value.trim());
			location.reload();
		}
	};

	prompt_box.appendChild(prompt_title);
	prompt_box.appendChild(prompt_area);
	prompt_box.appendChild(send_button);
	document.body.appendChild(prompt_box);
}

function makeMsgBox(content_box: Element, message, received: boolean) {
	const	box = document.createElement('div');
	box.className = `
	w-full flex flex-col
	`.trim();

	const	box_content = document.createElement('div');
	box_content.className = `
    font-['Orbitron']
    backdrop-blur-2xl
    text-white font-semibold
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
	flex
	`.replace(/\s+/g, ' ').trim();
	box_content.style.whiteSpace = 'pre-line';
	box_content.style.minWidth = '150px';
	box_content.style.maxWidth = '40%';
	box_content.style.hyphens = 'auto';
	box_content.textContent = `
		${message.content}
	`;

	const	box_date = document.createElement('div');
	box_date.className = `
    font-['Orbitron']
	absolute top-[-10px] left-[-10px]
    text-white font-semibold p-0.5
    bg-purple-900/100 backdrop-blur-2xl
    border-2 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `.replace(/\s+/g, ' ').trim();
	box_date.style.fontSize = '12px';
	box_date.textContent = `
		${new Date(message.created_at).toLocaleTimeString("fr-FR")}
	`;
	box_date.style.width = 'fit-content';
	box_date.style.blockSize = 'fit-content';
	box_date.style.whiteSpace = 'wrap';
	box_date.style.maxHeight = '25px';
	box_date.style.maxWidth = '50%';
	box_date.style.overflow = 'auto';

	const	buttons_box = document.createElement('div');
	buttons_box.className = `
	absolute
	w-full h-full
	`.trim();
	buttons_box.style.display = 'none';

	const	edit_button = document.createElement('div');
	edit_button.className = `
    font-['Orbitron']
	h-[50%]
    text-white font-semibold
    bg-blue-700/100 backdrop-blur-2xl
    border-1 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
	flex
  `.replace(/\s+/g, ' ').trim();
	edit_button.style.fontSize = '12px';
	edit_button.style.userSelect = 'none';
	edit_button.textContent = 'edit';
	edit_button.style.justifyContent = 'center';

	edit_button.onclick = async () => {
		const prompt_area = makeEditPromptArea(message);
		box.appendChild(prompt_area);
		}

	const	delete_button = document.createElement('div');
	delete_button.className = `
    font-['Orbitron']
	h-[50%]
    text-white font-semibold
    bg-red-700/100 backdrop-blur-2xl
    border-1 border-black
    rounded-lg text-lg transition-colors
    focus:outline-none focus:ring-2
	flex
  `.replace(/\s+/g, ' ').trim();
	delete_button.style.fontSize = '12px';
	delete_button.style.userSelect = 'none';
	delete_button.textContent = 'delete';
	delete_button.style.justifyContent = 'center';

	delete_button.onclick = async () => {
		await ChatService.deleteMessage(message.id);
		location.reload();
		}

	box_content.onmouseenter = () => {
		buttons_box.style.display = 'block';
	}

	box_content.onmouseleave = () => {
		buttons_box.style.display = 'none';
	}

	buttons_box.appendChild(edit_button);
	buttons_box.appendChild(delete_button);

	if (!received) {
		box.style.alignItems = 'flex-start';
		box_content.style.backgroundColor = 'MediumSeaGreen';
		box_content.appendChild(buttons_box);
	}
	else {
		box.style.alignItems = 'flex-end';
		box_content.style.backgroundColor = 'MediumSlateBlue';
	}

	box_content.appendChild(box_date);
	box.appendChild(box_content);
	content_box.appendChild(box);

	const	margin = document.createElement('div');
	margin.style.margin = '5px';
	content_box.appendChild(margin);
}

function	makeEditPromptArea(message) {
	const	prompt_box = document.createElement('div');
	prompt_box.className = `
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
	prompt_title.textContent = 'Edit message:';

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
	prompt_area.value = message.content;

	prompt_area.onkeydown = async (event) => {
		console.log(event.key);
		if (event.key === "Enter" && prompt_area.value.trim()) {
			await ChatService.editMessage(message.id, prompt_area.value.trim());
			location.reload();
		}
	};

	const	button_area = document.createElement('div');
	button_area.className = `
	grid grid-flow-col place-items-center
	w-full
	`;

	const	send_button = CommonComponent.createStylizedButton("Send", 'blue');
	send_button.style.width = 'fit-content';
	send_button.style.blockSize = 'fit-content';
	send_button.style.padding = '10px';
	send_button.onclick = async () => {
		if (prompt_area.value.trim()) {
			await ChatService.editMessage(message.id, prompt_area.value.trim());
			location.reload();
		}
	};

	const	close_button = CommonComponent.createStylizedButton("Close", 'red');
	close_button.style.width = 'fit-content';
	close_button.style.blockSize = 'fit-content';
	close_button.style.padding = '10px';
	close_button.onclick = async () => {
		if (prompt_area.value.trim()) {
			prompt_box.remove();
		}
	};

	prompt_box.appendChild(prompt_title);
	prompt_box.appendChild(prompt_area);
	button_area.appendChild(send_button);
	button_area.appendChild(close_button);
	prompt_box.appendChild(button_area);

	return (prompt_box);
}
