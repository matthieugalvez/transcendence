// C'est l'equivalent de notre MAIN en gros, on recupere le code et on le route au bon endroit grace a simpler router.
// C'est un peu temporaire je pense qu'il faut le mettre dans le back peut etre.


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
import { ProfilePage } from './pages/UserProfilePage';
import { UsersPage } from './pages/UserPage';
import { FriendsPage } from './pages/FriendListPage'

function startSPA() {
	router.register('/', renderIndexPage);
	router.register('/auth', async () => await authPage());
	router.register('/home', async () => await RenderHomePage());
	router.register('/settings', async () => await SettingsPage());
	router.register('/game', renderPongGamePage);
	router.register('/tournament', renderTournamentPage);
	router.register('/auth/oauth-2fa', async () => await oauth2FAPage());
	router.register('/game/online/:gameId', renderJoinPage);
	router.register('/profile', async () => await ProfilePage()); // Own profile
    router.register('/profile/:displayName', async(params) => await ProfilePage({ displayName: params.displayName })); // Other user's profile by displayName
	router.register('/users', async () => await UsersPage()); // Add this line
	router.register('/friendlist', async () => await FriendsPage());
	router.register('/chat/:displayName', async() => await renderChatPage());
    router.start();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startSPA);
} else {
	startSPA();
}
