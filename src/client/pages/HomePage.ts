import '../styles.css';
import { router } from '../configs/simplerouter'; // Fixed: removed .js extension

export function renderHomePage() {
  document.title = 'Transcendence - Home';
  document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';

  const pageTitle = document.createElement('h1');
  pageTitle.textContent = 'Welcome Home! 🏠';
  pageTitle.className = 'text-green-600 text-3xl font-bold mb-4 text-center';
  document.body.appendChild(pageTitle);

  // Add a back button for navigation
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to Login';
  backButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors mt-4';
  backButton.addEventListener('click', () => {
    router.navigate('/');
  });
  document.body.appendChild(backButton);
}