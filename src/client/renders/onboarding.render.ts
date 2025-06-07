import { router } from '../configs/simplerouter';
let gameButton: HTMLButtonElement;

 export class OnboardingRender {

	static render() : void {
		document.title = 'Transcendence - Home';
		document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';

		document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';
		const pageTitle = document.createElement('h1');
		pageTitle.textContent = 'Welcome Home! 🏠';
		pageTitle.className = 'text-green-600 text-3xl font-bold mb-4 text-center';
		document.body.appendChild(pageTitle);

		gameButton = document.createElement('button');
		gameButton.textContent = 'Play';
		gameButton.className = 'bg-blue-600 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors mt-4';
		document.body.appendChild(gameButton);

		// ajoute la nav vers /game
		gameButton.addEventListener('click', () => {
			router.navigate('/game');
		});

		gameButton = document.createElement('button');
		gameButton.textContent = 'Tournament';
		gameButton.className = 'bg-blue-600 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors mt-4';
		document.body.appendChild(gameButton);

		// ajoute la nav vers /tournament
		gameButton.addEventListener('click', () => {
			router.navigate('/tournament');
		});

	// Add a back button for navigation
	const backButton = document.createElement('button');
	backButton.textContent = 'Back to Login';
	backButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors mt-4';
	backButton.addEventListener('click', () => {
		router.navigate('/');
	});
	document.body.appendChild(backButton);
}
}