import '../styles.css';
import logo from '../assets/logo.png';
import { router } from '../configs/simplerouter';

// Fonction "RENDER" a pour vocation d'avoir juste le html/css dedans en gros

function renderTestPage() : void {
    document.title = 'Transcendence';
    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col p-0 m-0 relative overflow-hidden';

    // Clear previous content
    document.body.innerHTML = '';

    // Blurry background
    const bg = document.createElement('div');
    bg.className = 'absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 blur-2xl opacity-60 -z-10';
    document.body.appendChild(bg);

    // Full-width banner at the top
    const banner = document.createElement('header');
    banner.className = 'w-full flex items-center justify-between bg-white/80 rounded-b-2xl shadow-lg px-12 py-8 mb-12 backdrop-blur-md border-b border-white/40 fixed top-0 left-0 z-10';
    banner.innerHTML = `
        <div class="flex items-center gap-4">
            <img src="${logo}" alt="Transcendence Logo" class="h-14 w-14 rounded-full shadow-md border-2 border-white" />
            <span class="text-3xl font-bold text-gray-800">Transcendence</span>
        </div>
        <nav class="flex gap-8">
            <a href="#" class="text-lg text-gray-700 hover:text-blue-600 transition">Home</a>
            <a href="#" class="text-lg text-gray-700 hover:text-blue-600 transition">Features</a>
            <a href="#" class="text-lg text-gray-700 hover:text-blue-600 transition">Games</a>
            <a href="#" class="text-lg text-gray-700 hover:text-blue-600 transition">About</a>
            <a href="#" class="text-lg text-blue-500 font-semibold hover:underline">Sign In</a>
        </nav>
    `;
    document.body.appendChild(banner);

    // Main content placeholder
    const main = document.createElement('main');
    main.className = 'w-full max-w-2xl bg-white/70 rounded-lg shadow p-8 mt-48 mx-auto text-center backdrop-blur-md border border-white/30';
    main.innerHTML = `
        <h2 class="text-2xl font-semibold mb-4">Welcome!</h2>
        <p class="text-gray-700 mb-6">Explore features, play games, and connect with friends!</p>
        <button class="px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition">Get Started</button>
    `;
    document.body.appendChild(main);
}

export default renderTestPage;