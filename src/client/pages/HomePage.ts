import '../styles.css';
import { router } from '../configs/simplerouter.js';

let gameButton: HTMLButtonElement;

export function renderHomePage() {
	document.title = 'Transcendence';

    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';
	const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Signup success';
    pageTitle.className = 'text-green-600 text-3xl font-bold mb-4 text-center';
    document.body.appendChild(pageTitle);

    gameButton = document.createElement('button');
    gameButton.textContent = 'Play';
    gameButton.className = 'bg-blue-600 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors';
    document.body.appendChild(gameButton);

    // ajoute la nav vers /game
    gameButton.addEventListener('click', () => {
        router.navigate('/game');
    });
}
