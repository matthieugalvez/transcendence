import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { CommonComponent } from '../components/common.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { renderNotFoundPage } from './NotFoundPage';
let		g_edit_box: boolean = false;
let		g_last_fetch_date: Date;

export async function renderChatPage() {
	document.title = "Transcendence - Chat";
	document.body.innerHTML = '';
	let	user;
	let	user_list;
	try {
		user = await UserService.getCurrentUser();
		user_list = await UserService.getAllUsers();
	} catch (error) {
		console.error('Failed to fetch user data:', error);
		CommonComponent.handleAuthError();
	}
	const	receiver_name = document.URL.substring(document.URL.lastIndexOf('/') + 1);
	let	receiver;
	try {
		receiver = await UserService.getUserProfileByDisplayName(receiver_name);
	} catch {
		renderNotFoundPage();
		return;
	}

	const	getAllMessagescb = async () => {
		try {
			getAllMessages(user.id, receiver.id, messages_box);
		} catch (error) {
			console.error('Failed to fetch messages:', error);
		}
	};

	BackgroundComponent.applyCenteredGradientLayout();

	const	title_box = document.createElement('div');
	title_box.title = 'title_box';
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

	const	messages_box = document.createElement('div');
	messages_box.title = 'messages_box';
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

	await getAllMessages(user.id, receiver.id, messages_box);
	document.body.appendChild(messages_box);
	messages_box.scrollTop = messages_box.scrollHeight;

	const	prompt_box = document.createElement('div');
	prompt_box.title = 'prompt_box';
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
	prompt_title.title = 'prompt_title';
	prompt_title.className = `
    font-['Orbitron']
    text-white font-semibold
  `.trim();
	prompt_title.textContent = 'New message:';

	const	prompt_area = document.createElement('textarea');
	prompt_area.title = 'prompt_area';
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
		if (event.key === "Enter" && prompt_area.value) {
			await ChatService.postMessage(receiver.id, prompt_area.value);
			prompt_area.value = '';
			getAllMessagescb;
		}
	};

	const	send_button = CommonComponent.createStylizedButton("Send", 'blue');
	send_button.title = 'send_button';
	send_button.style.position = 'inherit';
	send_button.style.right = '35px';
	send_button.style.bottom = '35px';
	send_button.onclick = async () => {
		if (prompt_area.value) {
			await ChatService.postMessage(receiver.id, prompt_area.value);
			prompt_area.value = '';
			getAllMessagescb;
		}
	};

	prompt_box.appendChild(prompt_title);
	prompt_box.appendChild(prompt_area);
	prompt_box.appendChild(send_button);
	document.body.appendChild(prompt_box);

	setInterval(getAllMessagescb, 100);
}

async function getAllMessages(user_id: string, receiver_id: string, messages_box) {
	const	previous_fetch = g_last_fetch_date;
	const	messages_list = messages_box.childNodes;
	let		messages = await ChatService.getMessages(receiver_id, g_last_fetch_date);
	g_last_fetch_date = new Date();

	for (const message of messages) {
		if (previous_fetch
			&& message.created_at < previous_fetch.toJSON()
			&& message.updated_at > previous_fetch.toJSON()) {
			for (const message_box of messages_list) {
				if (message.id == message_box.title) {
					message_box.firstElementChild.firstElementChild.textContent = `\n${message.content} `;
				}
			}
		} else {
			let	message_box;

			if (message.sender_id === user_id)
				message_box = makeMsgBox(messages_box, message, false);
			if (message.receiver_id === user_id)
				message_box = makeMsgBox(messages_box, message, true);
			if (previous_fetch && message === messages[0]) {
				message_box.scrollIntoView({behavior: 'smooth', block: 'center'});
			}
		}
	}
}

function makeMsgBox(content_box: Element, message, received: boolean) {
	const	box = document.createElement('div');
	box.title = `${message.id}`;
	box.className = `
	w-full flex flex-col
	`.trim();

	const	box_content = document.createElement('div');
	box_content.title = 'box_content';
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
	box_content.style.minWidth = '150px';
	box_content.style.maxWidth = '40%';

	const	box_text = document.createElement('div');
	box_text.title = 'box_text';
	box_text.className = `
	w-full h-full
	px-2
	`.trim();
	box_text.style.whiteSpace = 'pre-line';
	box_text.style.hyphens = 'auto';
	box_text.textContent = `
		${message.content}
	`;
	box_text.style.paddingBottom = '2px';

	box_content.appendChild(box_text);

	const	box_date = document.createElement('div');
	box_date.title = 'box_date';
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
//	box_date.style.overflow = 'auto';

	const	buttons_box = document.createElement('div');
	buttons_box.title = 'buttons_box';
	buttons_box.className = `
	absolute
	w-full h-full
	`.trim();
	buttons_box.style.display = 'none';

	const	edit_button = document.createElement('div');
	edit_button.title = 'edit_button';
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
		if (!g_edit_box) {
			const prompt_area = makeEditPromptArea(message, box_text);
			box.appendChild(prompt_area);
			prompt_area.scrollIntoView({behavior: 'smooth', block: 'center'});
		}
	}

	const	delete_button = document.createElement('div');
	delete_button.title = 'delete_button';
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
			box.remove();
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
	margin.title = 'margin';
	margin.style.margin = '5px';
	box.appendChild(margin);

	return (box);
}

function	makeEditPromptArea(message, box_text: Element) {
	g_edit_box = true;

	const	prompt_box = document.createElement('div');
	prompt_box.title = 'prompt_box';
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
	prompt_title.title = 'prompt_title';
	prompt_title.className = `
    font-['Orbitron']
    text-white font-semibold
  `.trim();
	prompt_title.textContent = 'Edit message:';

	const	prompt_area = document.createElement('textarea');
	prompt_area.title = 'prompt_area';
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
	if (box_text.textContent) {
		prompt_area.value = box_text.textContent.trim();
	}

	prompt_area.onkeydown = async (event) => {
		console.log(event.key);
		if (event.key === "Enter" && prompt_area.value) {
			await ChatService.editMessage(message.id, prompt_area.value.trim());
			box_text.textContent = `\n${prompt_area.value}`;
			g_edit_box = false;
			prompt_box.remove();
		}
	};

	const	button_area = document.createElement('div');
	button_area.title = 'button_area';
	button_area.className = `
	grid grid-flow-col place-items-center
	w-full
	`;

	const	send_button = CommonComponent.createStylizedButton("Send", 'blue');
	send_button.title = 'send_button';
	send_button.style.width = 'fit-content';
	send_button.style.blockSize = 'fit-content';
	send_button.style.padding = '10px';
	send_button.onclick = async () => {
		if (prompt_area.value) {
			await ChatService.editMessage(message.id, prompt_area.value.trim());
			box_text.textContent = `\n${prompt_area.value}`;
			g_edit_box = false;
			prompt_box.remove();
		}
	};

	const	close_button = CommonComponent.createStylizedButton("Close", 'red');
	close_button.title = 'close_button';
	close_button.style.width = 'fit-content';
	close_button.style.blockSize = 'fit-content';
	close_button.style.padding = '10px';
	close_button.onclick = async () => {
		g_edit_box = false;
		prompt_box.remove();
	};

	prompt_box.appendChild(prompt_title);
	prompt_box.appendChild(prompt_area);
	button_area.appendChild(send_button);
	button_area.appendChild(close_button);
	prompt_box.appendChild(button_area);

	return (prompt_box);
}
