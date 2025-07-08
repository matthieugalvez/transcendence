import { router } from './configs/simplerouter';
import { renderIndexPage } from './pages/IndexPage';
import { authPage } from './pages/AuthPage'
import { renderPongGamePage } from './pages/GamePage';
import { renderTournamentPage } from './pages/TournamentPage';
import { RenderHomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { oauth2FAPage } from './pages/OAuth2FAPage';
import { renderJoinPage } from './pages/JoinPage';
import { renderChatPage } from './pages/ChatPage';
import { FriendsPage } from './pages/FriendListPage'
import { StatsPage } from './pages/StatsPage';
import { UserService } from './services/user.service';
let language_obj: any = await UserService.GetLanguageFile();

let isShowingViewportWarning = false;

function checkMinimumViewport(): boolean {
	if (window.self !== window.top) {
		return true;
	}
	const minWidth = 1024;
	const minHeight = 700;
	const currentWidth = window.innerWidth;
	const currentHeight = window.innerHeight;

	return currentWidth >= minWidth && currentHeight >= minHeight;
}

function showViewportWarning(): void {
	if (isShowingViewportWarning) return; // Prevent multiple warnings

	isShowingViewportWarning = true;
	document.body.innerHTML = '';
	document.title = 'Transcendence - Viewport Too Small';

	const container = document.createElement('div');
	container.className = `
        fixed inset-0 w-full h-full
        flex flex-col items-center justify-center
        bg-gradient-to-br from-purple-900 to-blue-900
        text-white text-center p-8 z-50
    `;
	container.id = 'viewport-warning'; // Add ID for easy identification

	const icon = document.createElement('div');
	icon.textContent = '📱➡️💻';
	icon.className = 'text-6xl mb-6';

	const title = document.createElement('h1');
	title.textContent = 'Screen Too Small';
	title.className = `
        font-['Canada-big'] text-4xl font-bold mb-4
        bg-gradient-to-r from-yellow-400 to-orange-500
        bg-clip-text text-transparent
    `;

	const message = document.createElement('p');
	message.textContent = 'Transcendence requires a minimum screen size of 1024x768 pixels for the best gaming experience.';
	message.className = `font-['Orbitron'] text-lg mb-6 max-w-md leading-relaxed`;

	const currentSize = document.createElement('p');
	currentSize.textContent = `Current size: ${window.innerWidth}x${window.innerHeight}`;
	currentSize.className = `font-['Orbitron'] text-sm text-gray-300 mb-4`;
	currentSize.id = 'current-size'; // Add ID for updating

	const instruction = document.createElement('p');
	instruction.textContent = 'Please resize your browser window or use a larger device.';
	instruction.className = `font-['Orbitron'] text-sm text-gray-400`;

	container.appendChild(icon);
	container.appendChild(title);
	container.appendChild(message);
	container.appendChild(currentSize);
	container.appendChild(instruction);

	document.body.appendChild(container);
}

function hideViewportWarning(): void {
	isShowingViewportWarning = false;
	const warning = document.getElementById('viewport-warning');
	if (warning) {
		warning.remove();
	}
}

function updateCurrentSizeDisplay(): void {
	const currentSizeElement = document.getElementById('current-size');
	if (currentSizeElement) {
		currentSizeElement.textContent = `Current size: ${window.innerWidth}x${window.innerHeight}`;
	}
}

function startSPA() {webkitURL
	// Check viewport size on window resize
	window.onresize = async () => {
		if (!checkMinimumViewport()) {
			showViewportWarning();
			updateCurrentSizeDisplay(); // Update the size display in real-time
		} else if (isShowingViewportWarning) {
			// Viewport is now large enough, hide warning and re-render current page
			hideViewportWarning();

			// Re-trigger the current route to restore the page
			const currentPath = window.location.pathname + window.location.search;
			router.navigate(currentPath);
		}
	};

	// Initial viewport check
	if (!checkMinimumViewport()) {
		showViewportWarning();
		return;
	}

	// Wrap all route handlers with viewport check
	router.register('/', renderIndexPage);
	router.register('/auth', async () => await authPage());
	router.register('/home', (async () => await RenderHomePage()));
	router.register('/settings', (async () => await SettingsPage()));
	router.register('/game', (renderPongGamePage));
	router.register('/tournament', (renderTournamentPage));
	router.register('/auth/oauth-2fa', (async () => await oauth2FAPage()));
	router.register(
		'/game/online/duo/:gameId',
		((params = {}) => renderJoinPage({ gameId: params.gameId, mode: 'duo' }))
	);
	router.register(
		'/game/online/tournament/:gameId',
		((params = {}) => renderJoinPage({ gameId: params.gameId, mode: 'tournament' }))
	);
	router.register('/profile', (async () => await StatsPage()));
	router.register('/profile/:displayName', (async (params = {}) => await StatsPage({ displayName: params.displayName })));
	router.register('/users', (async () => await UsersPage()));
	router.register('/friendlist', (async () => await FriendsPage()));
	router.register('/statistics', (async () => await StatsPage()));
	router.register('/statistics/:displayName', (async (params = {}) => await StatsPage({ displayName: params.displayName })));
	router.register('/chat/:displayName', (async () => await renderChatPage()));

	router.start();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startSPA);
} else {
	startSPA();
}
