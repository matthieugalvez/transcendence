import './styles.css';
import logo from './assets/logo.png';

function greet(name: string): void {
  const heading = document.createElement('h1');
  heading.textContent = `Hello, ${name}!`;
  heading.className = 'text-green-600 text-2xl font-semibold mt-4';
  document.body.appendChild(heading);

  const img = document.createElement('img');
  img.src = logo;
  img.alt = 'Project Logo';
  img.style.width = 'w-48 h-auto mt-4';
	img.className = 'w-48 h-auto mt-4';

  document.body.appendChild(img);
}

greet('TypeScript + Vite');