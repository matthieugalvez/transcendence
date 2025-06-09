// C'est l'equivalent de notre MAIN en gros, on recupere le code et on le route au bon endroit grace a simpler router.
// C'est un peu temporaire je pense qu'il faut le mettre dans le back peut etre.


import { router } from './configs/simplerouter';
import { renderHomePage  } from './pages/HomePage';
import { authPage } from './pages/AuthPage'
import { renderGamePage } from './pages/GamePage';
import { renderTournamentPage } from './pages/TournamentPage';
import { RenderOnboardingPage } from './pages/OnboardingPage';
// import { OnboardingPage, RenderOnboardingPage } from './pages/OnboardingPage';

// Register routes
// router.register ('/', renderHomePage);
// router.register('/signup', signup);
// router.register ('/home', renderHomePage);
// router.register ('/game', renderGamePage);
// router.register ('/tournament', renderTournamentPage);
// router.start();

function startSPA() {
    router.register('/', renderHomePage);
    router.register('/auth', async() => await authPage());
    router.register('/home', async() => await RenderOnboardingPage());
    router.register('/game', renderGamePage);
    router.register('/tournament', renderTournamentPage);
    router.start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSPA);
} else {
    startSPA();
}