import '../styles.css';
import { router } from '../configs/simplerouter.js';


export function renderHomePage() {
	document.title = 'Transcendence';

    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';
	 const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Success';
    pageTitle.className = 'text-green-600 text-3xl font-bold mb-4 text-center';
    document.body.appendChild(pageTitle);
}
