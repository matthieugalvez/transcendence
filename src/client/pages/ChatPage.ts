import '../styles.css';
import { CommonComponent } from '../components/common.component';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { renderNotFoundPage } from './NotFoundPage';
import { FriendService } from '../services/friend.service';
import { FriendsRender } from '../renders/friends.render';
import { language_obj } from '../index.ts';
let		g_edit_box: boolean = false;
let		g_last_fetch_date: Date;

async function	delay(ms: number, state = null) {
	return new Promise((resolve, reject) => {
		window.setTimeout( () => resolve(state), ms);
	});
}

export async function renderChatPage() {
	CommonComponent.guardEmbedding();

    document.title = "Transcendence - Chat";
    document.body.innerHTML = '';
	let	user: any;
	try {
		user = await UserService.getCurrentUser();
	} catch (error) {
		console.error('Failed to fetch user data:', error);
		CommonComponent.handleAuthError();
	}
	const	receiver_name = document.URL.substring(document.URL.lastIndexOf('/') + 1);
	let	receiver: any;
	try {
		receiver = await UserService.getUserProfileByDisplayName(receiver_name);
	} catch {
		renderNotFoundPage();
		return;
	}

	const	mainContainer = document.createElement('div');
	mainContainer.className = `
        flex flex-col items-center justify-center p-7
	`;

	const	title_box = document.createElement('div');
	title_box.title = 'title_box';
	title_box.className = `
        fixed p-0 h-[6%] w-[100%]
        flex items-center justify-center-safe
	`.trim();
	title_box.style.overflowY = 'hidden';

	mainContainer.appendChild(title_box);

	const	messages_box = document.createElement('div');
	messages_box.title = 'messages_box';
	messages_box.className = `
		font-['Orbitron']
		text-white font-semibold
        fixed top-[7%] h-[70%] w-[99%]
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
	mainContainer.appendChild(messages_box);

	const	friendship_status = await UserService.getFriendshipStatus(receiver.id);

	const	block_button = CommonComponent.createStylizedButton(`${language_obj['Block']}`, 'red');
	block_button.title = 'block_button',
	block_button.style.marginRight = '5px';
	block_button.style.textWrap = 'nowrap';
	block_button.onclick = async () => {
		await FriendService.blockUser(receiver.id);
		location.reload();
	}

	const	unblock_button = CommonComponent.createStylizedButton(`${language_obj['Unblock']}`, 'red');
	unblock_button.title = 'unblock_button',
	unblock_button.style.marginRight = '5px';
	unblock_button.style.textWrap = 'nowrap';
	unblock_button.onclick = async () => {
		await FriendService.unblockUser(receiver.id);
		location.reload();
	}

	if (friendship_status.status === 'blocked') {
		title_box.appendChild(unblock_button);
	} else if (friendship_status.status != 'blocked_by') {
		title_box.appendChild(block_button);
		const	friend_button = CommonComponent.createStylizedButton('', 'blue');
		friend_button.style.marginRight = '5px';
		friend_button.style.textWrap = 'nowrap';
		if (friendship_status.status === 'none') {
			friend_button.textContent = `${language_obj['Add_friend']}`;
			friend_button.onclick = async () => {
				await FriendService.sendFriendRequest(receiver.id);
				location.reload();
			};
		} else if (friendship_status.status === 'pending') {
			friend_button.textContent = `${language_obj['Cancel_request']}`;
			friend_button.onclick = async () => {
				if (friendship_status.requestId) {
					await FriendService.rejectFriendRequest(friendship_status.requestId);
					location.reload();
				}
			};
		} else if (friendship_status.status === 'incoming') {
			friend_button.textContent = `${language_obj['Accept_request']}`;
			friend_button.onclick = async () => {
				if (friendship_status.requestId) {
					await FriendService.acceptFriendRequest(friendship_status.requestId);
					location.reload();
				}
			};
			const	reject_button = CommonComponent.createStylizedButton(`${language_obj['Reject_request']}`, 'gray');
			reject_button.style.marginRight = '5px';
			reject_button.style.textWrap = 'nowrap';
			reject_button.onclick = async () => {
				if (friendship_status.requestId) {
					await FriendService.rejectFriendRequest(friendship_status.requestId);
					location.reload();
				}
			};
			title_box.appendChild(reject_button);
		} else if (friendship_status.status === 'friends') {
			friend_button.textContent = `${language_obj['Remove_friend']}`;
			friend_button.onclick = async () => {
				await UserService.removeFriend(receiver.id);
				location.reload();
			};
		}
		title_box.appendChild(friend_button);

		let hasPendingGameInvite = false;
		try {
			const invitesResponse = await fetch('/api/invites/sent');
			if (invitesResponse.ok) {
				const invitesData = await invitesResponse.json();
				if (invitesData.success) {
					hasPendingGameInvite = invitesData.invites.some((invite: any) =>
						invite.inviteeId === receiver.id && invite.status === 'pending'
					);
				}
			}
		} catch (error) {
			console.error('Error checking pending invites:', error);
		}

		if (!hasPendingGameInvite) {
			const inviteBtn = CommonComponent.createStylizedButton(`${language_obj['Invite_to_game']}`, 'purple');
			inviteBtn.style.marginRight = '5px';
			inviteBtn.style.textWrap = 'nowrap';
			inviteBtn.onclick = async () => {
				FriendsRender.showGameTypeModal(receiver);
			};
			title_box.appendChild(inviteBtn);
		} else {
			const pendingInviteBtn = CommonComponent.createStylizedButton(`${language_obj['Invite_pending']}`, 'gray');
			pendingInviteBtn.style.marginRight = '5px';
			pendingInviteBtn.style.textWrap = 'nowrap';
			pendingInviteBtn.disabled = true;
			title_box.appendChild(pendingInviteBtn);
		}
	}

	if (friendship_status.status === 'blocked') {
		messages_box.textContent = `${language_obj['User']} ${ receiver.displayName } ${language_obj['Is_blocked']}`;
		messages_box.style.justifyContent = 'center';
		messages_box.style.alignItems = 'center';
		document.body.appendChild(mainContainer);
	} else if (friendship_status.status === 'blocked_by') {
		messages_box.textContent = `${language_obj['User']} ${ receiver.displayName } ${language_obj['Blocked_you']}`;
		messages_box.style.justifyContent = 'center';
		messages_box.style.alignItems = 'center';
		document.body.appendChild(mainContainer);
	} else {
		await getAllMessages(receiver.id, messages_box);
		messages_box.scrollTop = messages_box.scrollHeight;

		const	prompt_box = document.createElement('div');
		prompt_box.title = 'prompt_box';
		prompt_box.className = `
			fixed bottom-4 h-[20%] w-[99%]
			bg-amber-300/50
			rounded-lg text-lg transition-colors
			focus:outline-none focus:ring-2
			shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
			disabled:opacity-50 disabled:cursor-not-allowed
			border-2 border-black
			flex flex-col items-start p-6
			space-y-4 z-11
		`.trim()

		const	prompt_area = document.createElement('textarea');
		prompt_area.title = 'prompt_area';
		prompt_area.className = `
		font-['Orbitron']
		bg-purple-900/100 backdrop-blur-2xl
		h-[100%] w-[100%]
		text-white font-semibold p-1
		border-2 border-black
		rounded-lg text-lg transition-colors
		focus:outline-none focus:ring-2
		shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
		disabled:opacity-50 disabled:cursor-not-allowed
		resize-none
		`.replace(/\s+/g, ' ').trim()
		prompt_area.placeholder = `${language_obj['Type_here']}`;

		prompt_area.onkeydown = async (event) => {
			if (event.key === "Enter" && prompt_area.value) {
				await ChatService.postMessage(receiver.id, prompt_area.value);
				prompt_area.value = '';
			}
		};

		prompt_box.appendChild(prompt_area);
		mainContainer.appendChild(prompt_box);
		document.body.appendChild(mainContainer);

		while (true) {
			await getAllMessages(receiver.id, messages_box);
			await delay(500);
		}
	}
}

async function getAllMessages(receiver_id: string, messages_box: any) {
	const	previous_fetch = g_last_fetch_date;
	const	messages_list = messages_box.childNodes;
	let		messages: any;
	try {
		messages = await ChatService.getMessages(receiver_id, g_last_fetch_date);
	}
	catch(error) {
		console.error('Failed to fetch messages:', error);
		return;
	}
	g_last_fetch_date = new Date();

	for (const message of messages) {
		if (previous_fetch
			&& message.created_at < previous_fetch.toJSON()
			&& message.updated_at > previous_fetch.toJSON()) {
			for (const message_box of messages_list) {
				if (message.id == message_box.title) {
					if (!message.deleted) {
						message_box.firstElementChild.firstElementChild.style.fontStyle = 'normal';
						message_box.firstElementChild.firstElementChild.textContent = `\n${message.content} `;
					} else {
						message_box.firstElementChild.firstElementChild.style.fontStyle = 'italic';
						message_box.firstElementChild.firstElementChild.textContent = `\n${language_obj['Deleted']}`;
					}
				}
			}
		} else {
			const	message_box = makeMsgBox(messages_box, message, message.sender_id === receiver_id)

			if (previous_fetch && message === messages[0]) {
				message_box.scrollIntoView({behavior: 'smooth', block: 'center'});
			}
		}
	}
}

function makeMsgBox(content_box: Element, message: any, received: boolean) {
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
	if (!message.deleted) {
		box_text.style.fontStyle = 'normal';
		box_text.textContent = `\n${message.content}`;
	} else {
		box_text.style.fontStyle = 'italic';
		box_text.textContent = `\n${language_obj['Deleted']}`;
	}
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

	const	buttons_box = document.createElement('div');
	buttons_box.title = 'buttons_box';
	buttons_box.className = `
	absolute
	w-full h-full
	`.trim();
	buttons_box.style.display = 'none';

	makeMsgButtons(message, buttons_box, box_text, box);

	box_content.onmouseenter = () => {
		buttons_box.style.display = 'block';
	}

	box_content.onmouseleave = () => {
		buttons_box.style.display = 'none';
	}

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

function	makeMsgButtons(message: any, buttons_box: Element, box_text: Element, box: Element) {
	if (!message.deleted) {
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
		edit_button.textContent = `${language_obj['Edit']}`;
		edit_button.style.justifyContent = 'center';
		edit_button.style.alignItems = 'center'

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
		delete_button.textContent = `${language_obj['Delete']}`;
		delete_button.style.justifyContent = 'center';
		delete_button.style.alignItems = 'center'

		delete_button.onclick = async () => {
			await ChatService.deleteMessage(message.id);
			edit_button.remove();
			delete_button.remove();
			message.deleted = !message.deleted;
			makeMsgButtons(message, buttons_box, box_text, box);
		}

		buttons_box.appendChild(edit_button);
		buttons_box.appendChild(delete_button);
	} else {
		const	restore_button = document.createElement('div');

		restore_button.title = 'restore_button';
		restore_button.className = `
		font-['Orbitron']
		h-[100%]
		text-white font-semibold
		bg-green-600/100 backdrop-blur-2xl
		border-1 border-black
		rounded-lg text-lg transition-colors
		focus:outline-none focus:ring-2
		flex
	  `.replace(/\s+/g, ' ').trim();
		restore_button.style.fontSize = '12px';
		restore_button.style.userSelect = 'none';
		restore_button.textContent = `${language_obj['Restore']}`;
		restore_button.style.justifyContent = 'center';
		restore_button.style.alignItems = 'center'

		restore_button.onclick = async () => {
			await ChatService.deleteMessage(message.id);
			restore_button.remove();
			message.deleted = !message.deleted;
			makeMsgButtons(message, buttons_box, box_text, box);
		}

		buttons_box.appendChild(restore_button);
	}
}

function	makeEditPromptArea(message: any, box_text: Element) {
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
	prompt_title.textContent = `${language_obj['Edit_message']}`;

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

	const	send_button = CommonComponent.createStylizedButton(`${language_obj['Send']}`, 'blue');
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

	const	close_button = CommonComponent.createStylizedButton(`${language_obj['Close']}`, 'red');
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
