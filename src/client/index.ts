// C'est l'equivalent de notre MAIN en gros, on recupere le code et on le route au bon endroit grace a simpler router.
// C'est un peu temporaire je pense qu'il faut le mettre dans le back peut etre.


import { router } from './configs/simplerouter';
import { renderIndexPage } from './pages/IndexPage';
import { authPage } from './pages/AuthPage'
import { renderGamePage } from './pages/GamePage';
import { renderTournamentPage } from './pages/TournamentPage';
import { RenderHomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { oauth2FAPage } from './pages/OAuth2FAPage';

// Register routes
// router.register ('/', renderHomePage);
// router.register('/signup', signup);
// router.register ('/home', renderHomePage);
// router.register ('/game', renderGamePage);
// router.register ('/tournament', renderTournamentPage);
// router.start();

function startSPA() {
	router.register('/', renderIndexPage);
	router.register('/auth', async () => await authPage());
	router.register('/home', async () => await RenderHomePage());
	router.register('/settings', async () => await SettingsPage());
	router.register('/game', renderGamePage);
	router.register('/tournament', renderTournamentPage);
	router.register('/auth/oauth-2fa', async () => await oauth2FAPage());
	// router.register('/auth/google-setup', async() => await googleCompletePage()); // Add this line
	router.start();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startSPA);
} else {
	startSPA();
}