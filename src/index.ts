import './styles.css';
import logo from './assets/logo.png';

async function logNameToServer(name: string): Promise<void> {
  try {
    const response = await fetch('/api/logname', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();
    console.log('Server response:', data);

    if (data.success) {
      // Show success message
      const successMsg = document.createElement('p');
      successMsg.textContent = `✅ ${data.message}`;
      successMsg.className = 'text-green-600 font-semibold mt-2';
      document.body.appendChild(successMsg);
    }
  } catch (error) {
    console.error('Error logging name:', error);

    // Show error message
    const errorMsg = document.createElement('p');
    errorMsg.textContent = '❌ Failed to log name to server';
    errorMsg.className = 'text-red-600 font-semibold mt-2';
    document.body.appendChild(errorMsg);
  }
}

function greet(name: string): void {
    // Set the page title
    document.title = 'My Vite App';

    // Set body styling for centering
    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';

    // Create the h1 from the HTML
    const viteHeading = document.createElement('h1');
    viteHeading.textContent = 'My Vite Application';
    viteHeading.className = 'text-blue-600 text-3xl font-bold mb-4 text-center';
    document.body.appendChild(viteHeading);

    const heading = document.createElement('h1');
    heading.textContent = `Hello, ${name}!`;
    heading.className = 'text-green-600 text-2xl font-semibold mt-4 text-center';
    document.body.appendChild(heading);

    const img = document.createElement('img');
    img.src = logo;
    img.alt = 'Project Logo';
    img.className = 'w-48 h-auto mt-4 mx-auto';
    document.body.appendChild(img);

    // Add button to log name to server
    const logButton = document.createElement('button');
    logButton.textContent = 'Log Name to Server';
    logButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4';
    logButton.addEventListener('click', () => logNameToServer(name));
    document.body.appendChild(logButton);
}

greet('TypeScript + Vite (pingpong)');



//  <-- //Transcendence looking page idk comment above and uncomment below to see -->!

// import './styles.css';
// import logo from './assets/logo.png';

// class TranscendenceApp {
//   private mobileMenuOpen = false;

//   constructor() {
//     this.init();
//   }

//   private init(): void {
//     // Clear body and set base classes
//     document.body.className = 'bg-gray-100 font-sans min-h-screen';
//     document.body.innerHTML = '';

//     // Create the full app structure
//     this.createNavbar();
//     this.createMainContent();

//     // Setup event listeners
//     this.setupEventListeners();
//   }

//   private createNavbar(): void {
//     const nav = document.createElement('nav');
//     nav.className = 'bg-white shadow-lg';

//     const container = document.createElement('div');
//     container.className = 'max-w-7xl mx-auto px-4';

//     const flexContainer = document.createElement('div');
//     flexContainer.className = 'flex justify-between items-center h-16';

//     // Logo section
//     const logoDiv = document.createElement('div');
//     logoDiv.className = 'flex items-center';
//     const logoSpan = document.createElement('span');
//     logoSpan.className = 'text-xl font-bold text-gray-800';
//     logoSpan.textContent = 'Transcendence';
//     logoDiv.appendChild(logoSpan);

//     // Desktop menu
//     const desktopMenu = this.createDesktopMenu();

//     // Mobile menu button
//     const mobileMenuBtn = this.createMobileMenuButton();

//     flexContainer.appendChild(logoDiv);
//     flexContainer.appendChild(desktopMenu);
//     flexContainer.appendChild(mobileMenuBtn);

//     // Mobile menu (hidden by default)
//     const mobileMenu = this.createMobileMenu();

//     container.appendChild(flexContainer);
//     container.appendChild(mobileMenu);
//     nav.appendChild(container);

//     document.body.appendChild(nav);
//   }

//   private createDesktopMenu(): HTMLElement {
//     const menu = document.createElement('div');
//     menu.className = 'hidden md:flex items-center space-x-4';

//     const menuItems = [
//       { text: 'Home', href: '#home' },
//       { text: 'Game', href: '#game' },
//       { text: 'Leaderboard', href: '#leaderboard' }
//     ];

//     menuItems.forEach(item => {
//       const link = document.createElement('a');
//       link.href = item.href;
//       link.className = 'text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors';
//       link.textContent = item.text;
//       link.addEventListener('click', (e) => this.handleNavigation(e, item.href));
//       menu.appendChild(link);
//     });

//     // Profile button
//     const profileBtn = document.createElement('button');
//     profileBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors';
//     profileBtn.textContent = 'Profile';
//     profileBtn.addEventListener('click', () => this.showProfile());
//     menu.appendChild(profileBtn);

//     return menu;
//   }

//   private createMobileMenuButton(): HTMLElement {
//     const btnContainer = document.createElement('div');
//     btnContainer.className = 'md:hidden';

//     const btn = document.createElement('button');
//     btn.id = 'mobile-menu-btn';
//     btn.className = 'text-gray-600 hover:text-gray-900 focus:outline-none';

//     // Hamburger icon (SVG)
//     btn.innerHTML = `
//       <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
//       </svg>
//     `;

//     btnContainer.appendChild(btn);
//     return btnContainer;
//   }

//   private createMobileMenu(): HTMLElement {
//     const mobileMenu = document.createElement('div');
//     mobileMenu.id = 'mobile-menu';
//     mobileMenu.className = 'md:hidden hidden';

//     const menuContainer = document.createElement('div');
//     menuContainer.className = 'px-2 pt-2 pb-3 space-y-1 border-t border-gray-200';

//     const menuItems = [
//       { text: 'Home', href: '#home' },
//       { text: 'Game', href: '#game' },
//       { text: 'Leaderboard', href: '#leaderboard' },
//       { text: 'Profile', href: '#profile', isButton: true }
//     ];

//     menuItems.forEach(item => {
//       const link = document.createElement('a');
//       link.href = item.href;
//       link.className = item.isButton
//         ? 'block bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors'
//         : 'block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors';
//       link.textContent = item.text;
//       link.addEventListener('click', (e) => this.handleNavigation(e, item.href));
//       menuContainer.appendChild(link);
//     });

//     mobileMenu.appendChild(menuContainer);
//     return mobileMenu;
//   }

//   private createMainContent(): void {
//     const main = document.createElement('main');
//     main.className = 'flex-1 flex flex-col items-center justify-center p-8';
//     main.id = 'main-content';

//     // Welcome section
//     this.renderWelcomeScreen(main);

//     document.body.appendChild(main);
//   }

//   private renderWelcomeScreen(container: HTMLElement): void {
//     container.innerHTML = '';

//     const welcomeDiv = document.createElement('div');
//     welcomeDiv.className = 'text-center max-w-2xl mx-auto';

//     // Main heading
//     const heading = document.createElement('h1');
//     heading.textContent = 'Welcome to Transcendence!';
//     heading.className = 'text-4xl font-bold text-gray-800 mb-4';

//     // Subtitle
//     const subtitle = document.createElement('p');
//     subtitle.textContent = 'The ultimate Pong gaming experience';
//     subtitle.className = 'text-xl text-gray-600 mb-8';

//     // Logo
//     const img = document.createElement('img');
//     img.src = logo;
//     img.alt = 'Transcendence Pong Game Logo';
//     img.className = 'w-48 h-auto mx-auto mb-8';

//     // Play button
//     const playButton = document.createElement('button');
//     playButton.textContent = 'Start Playing';
//     playButton.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors';
//     playButton.addEventListener('click', () => this.startGame());

//     welcomeDiv.appendChild(heading);
//     welcomeDiv.appendChild(subtitle);
//     welcomeDiv.appendChild(img);
//     welcomeDiv.appendChild(playButton);

//     container.appendChild(welcomeDiv);
//   }

//   private setupEventListeners(): void {
//     // Mobile menu toggle
//     const mobileMenuBtn = document.getElementById('mobile-menu-btn');
//     if (mobileMenuBtn) {
//       mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
//     }
//   }

//   private toggleMobileMenu(): void {
//     const mobileMenu = document.getElementById('mobile-menu');
//     if (mobileMenu) {
//       this.mobileMenuOpen = !this.mobileMenuOpen;
//       mobileMenu.classList.toggle('hidden', !this.mobileMenuOpen);
//     }
//   }

//   private handleNavigation(e: Event, href: string): void {
//     e.preventDefault();

//     // Close mobile menu if open
//     if (this.mobileMenuOpen) {
//       this.toggleMobileMenu();
//     }

//     const mainContent = document.getElementById('main-content');
//     if (mainContent) {
//       switch (href) {
//         case '#home':
//           this.renderWelcomeScreen(mainContent);
//           break;
//         case '#game':
//           this.renderGameScreen(mainContent);
//           break;
//         case '#leaderboard':
//           this.renderLeaderboard(mainContent);
//           break;
//         case '#profile':
//           this.showProfile();
//           break;
//       }
//     }
//   }

//   private renderGameScreen(container: HTMLElement): void {
//     container.innerHTML = `
//       <div class="text-center">
//         <h1 class="text-3xl font-bold text-gray-800 mb-8">Pong Game</h1>
//         <div class="bg-black w-96 h-64 mx-auto mb-4 border border-gray-400 relative">
//           <div class="text-white text-center pt-24">Game Canvas Placeholder</div>
//         </div>
//         <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">Back to Home</button>
//       </div>
//     `;

//     const backBtn = container.querySelector('button');
//     if (backBtn) {
//       backBtn.addEventListener('click', () => this.renderWelcomeScreen(container));
//     }
//   }

//   private renderLeaderboard(container: HTMLElement): void {
//     container.innerHTML = `
//       <div class="text-center max-w-md mx-auto">
//         <h1 class="text-3xl font-bold text-gray-800 mb-8">Leaderboard</h1>
//         <div class="bg-white rounded-lg shadow p-6">
//           <div class="space-y-2">
//             <div class="flex justify-between">
//               <span>1. Player One</span>
//               <span class="font-bold">1250</span>
//             </div>
//             <div class="flex justify-between">
//               <span>2. Player Two</span>
//               <span class="font-bold">1100</span>
//             </div>
//             <div class="flex justify-between">
//               <span>3. Player Three</span>
//               <span class="font-bold">950</span>
//             </div>
//           </div>
//         </div>
//         <button class="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">Back to Home</button>
//       </div>
//     `;

//     const backBtn = container.querySelector('button');
//     if (backBtn) {
//       backBtn.addEventListener('click', () => this.renderWelcomeScreen(container));
//     }
//   }

//   private showProfile(): void {
//     alert('Profile page coming soon!');
//   }

//   private startGame(): void {
//     const mainContent = document.getElementById('main-content');
//     if (mainContent) {
//       this.renderGameScreen(mainContent);
//     }
//   }
// }

// // Initialize the app
// new TranscendenceApp();