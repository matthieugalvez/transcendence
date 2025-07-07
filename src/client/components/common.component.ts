import { router } from "../configs/simplerouter";
import { BackgroundComponent } from "./background.component";

export class CommonComponent {
	/**
	 * Display a message to the user
	 */
	static showMessage(text: string, type: 'success' | 'error' | 'warning' | 'info' = 'error', isHtml: boolean = false): void {
		// First try to find existing message display container
		let signupMsgDisplay = document.getElementById('signup-msg-display');

		// If not found, create a global toast message instead
		if (!signupMsgDisplay) {
			this.showToastMessage(text, type, isHtml);
			return;
		}

		// Original logic for pages with signup-msg-display
		signupMsgDisplay.innerHTML = '';

		const message = document.createElement('div');
		if (isHtml) {
			message.innerHTML = text;
		} else {
			message.textContent = text;
		}

		message.className = `
        ${type === 'success' ? 'text-green-600' : type === 'warning' ? 'text-yellow-600' : 'text-red-600'}
        font-semibold mt-2 text-center
    `.replace(/\s+/g, ' ').trim();

		message.style.letterSpacing = "0.05em";
		signupMsgDisplay.appendChild(message);
	}

	static showToastMessage(text: string, type: 'success' | 'error' | 'warning' | 'info' = 'error', isHtml: boolean = false): void {
		// Remove any existing toast
		const existingToast = document.getElementById('global-toast-message');
		if (existingToast) {
			existingToast.remove();
		}

		// Create toast container - centered on screen
		const toast = document.createElement('div');
		toast.id = 'global-toast-message';
		toast.className = `
			fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]
			max-w-md w-full mx-4
			bg-white border-2 border-black rounded-lg
			shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
			p-6
			opacity-0 scale-95 transition-all duration-300 ease-in-out
		`;

		// Create message content
		const messageContent = document.createElement('div');
		messageContent.className = 'flex flex-col items-center text-center space-y-3';

		// Add icon based on type (larger for center display)
		const icon = document.createElement('div');
		icon.className = 'text-4xl';
		switch (type) {
			case 'success':
				icon.textContent = '✅';
				break;
			case 'warning':
				icon.textContent = '⚠️';
				break;
			case 'info':
				icon.textContent = 'ℹ️';
				break;
			default:
				icon.textContent = '❌';
		}

		// Add message text (larger and centered)
		const messageText = document.createElement('div');
		messageText.className = `
			text-lg font-['Orbitron'] font-semibold text-center
			${type === 'success' ? 'text-green-600' :
			  type === 'warning' ? 'text-yellow-600' :
			  type === 'info' ? 'text-blue-600' : 'text-red-600'}
		`;

		if (isHtml) {
			messageText.innerHTML = text;
		} else {
			messageText.textContent = text;
		}

		// Add close button (smaller and less prominent)
		const closeButton = document.createElement('button');
		closeButton.textContent = '×';
		closeButton.className = 'absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold';
		closeButton.onclick = () => {
			toast.style.opacity = '0';
			toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
			setTimeout(() => toast.remove(), 300);
		};

		messageContent.appendChild(icon);
		messageContent.appendChild(messageText);
		toast.appendChild(messageContent);
		toast.appendChild(closeButton);

		// Add to page
		document.body.appendChild(toast);

		// Animate in (center fade + scale)
		setTimeout(() => {
			toast.style.opacity = '1';
			toast.style.transform = 'translate(-50%, -50%) scale(1)';
		}, 10);

		// Auto-remove after 4 seconds (slightly shorter since it's more prominent)
		setTimeout(() => {
			if (toast.parentNode) {
				toast.style.opacity = '0';
				toast.style.transform = 'translate(-50%, -50%) scale(0.95)';
				setTimeout(() => toast.remove(), 300);
			}
		}, 4000);
	}

	/**
	 * Create a styled label element
	 */
	static createLabel(text: string): HTMLLabelElement {
		const label = document.createElement('label');
		label.textContent = text;
		label.className = `
		font-['Orbitron']
		block text-lg font-semibold mb-2 text-gray-700
	  `.replace(/\s+/g, ' ').trim();

		label.style.letterSpacing = "0.1em";

		return label;
	}

	/**
	 * Create a styled input element
	 */
	static createInput(type: string, placeholder: string): HTMLInputElement {
		const input = document.createElement('input');
		input.type = type;
		input.placeholder = placeholder;
		input.className = `
    font-['Orbitron']
    border-2 border-black rounded-lg
    px-4 py-3
    text-lg font-medium
    w-80 mx-auto block mb-4
    bg-white
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    shadow-[2.0px_3.0px_0.0px_rgba(0,0,0,0.6)]
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim();

		input.style.letterSpacing = "0.1em";

		return input;
	}

	/**
	 * Create a styled button element
	 */
	static createButton(text: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.textContent = text;
		button.className = 'bg-blue-600 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors';
		return button;
	}

	static createStylizedButton(text: string, color: 'blue' | 'red' | 'purple' | 'orange' | 'gray' = 'blue'): HTMLButtonElement {
		const button = document.createElement('button');
		button.textContent = text;

		const colorClasses = {
			blue: 'bg-blue-500 hover:bg-blue-700 focus:ring-blue-300',
			purple: 'bg-purple-500 hover:bg-purple-700 focus:ring-purple-300',
			gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300',
			red: 'bg-red-500 hover:bg-red-700 focus:ring-red-300',
			orange: 'bg-orange-500 hover:bg-orange-700 focus:ring-orange-300',
		};

		button.className = `
		font-['Orbitron']
		${colorClasses[color]} text-white font-semibold
		border-2 border-black
		py-2 px-12
		rounded-lg text-lg transition-colors
		focus:outline-none focus:ring-2
		shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
		disabled:opacity-50 disabled:cursor-not-allowed
	  `.replace(/\s+/g, ' ').trim();

		button.style.letterSpacing = "0.2em";

		return button;
	}

	/**
	 * Create a styled container div
	 */
	static createContainer(className: string = ''): HTMLDivElement {
		const container = document.createElement('div');
		container.className = className;
		return container;
	}

	/**
	 * Create a styled heading
	 */
	static createHeading(text: string, level: number = 1, className: string = ''): HTMLHeadingElement {
		const heading = document.createElement(`h${level}`) as HTMLHeadingElement;
		heading.textContent = text;
		heading.className = className;
		return heading;
	}

	/**
	 * Clear the content of an element
	 */
	static clearElement(element: HTMLElement): void {
		element.innerHTML = '';
	}

	/**
	 * Add multiple CSS classes to an element
	 */
	static addClasses(element: HTMLElement, ...classes: string[]): void {
		element.classList.add(...classes);
	}

	/**
	 * Remove multiple CSS classes from an element
	 */
	static removeClasses(element: HTMLElement, ...classes: string[]): void {
		element.classList.remove(...classes);
	}

	static handleAuthError(): void {
		// Clear any existing content first
		document.body.innerHTML = '';

		// Apply background
		BackgroundComponent.applyCenteredGradientLayout();

		// Show error message and redirect to auth
		const errorContainer = document.createElement('div');
		errorContainer.className = `
		bg-white/90 backdrop-blur-md
		border-2 border-red-500
		rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
		max-w-lg w-full mx-4 text-center
		`.replace(/\s+/g, ' ').trim();

		const errorIcon = document.createElement('div');
		errorIcon.textContent = '🔒';
		errorIcon.className = 'text-4xl mb-4';

		const errorTitle = document.createElement('h2');
		errorTitle.textContent = 'Authentication Required';
		errorTitle.className = `
			font-['Canada-big'] uppercase font-bold
			text-2xl text-center mb-2
			text-red-600
			select-none
		`.replace(/\s+/g, ' ').trim();

		const errorText = document.createElement('p');
		errorText.textContent = 'You need to be logged in to play games.';
		errorText.className = 'text-red-600 font-semibold mb-6';

		const loginButton = CommonComponent.createStylizedButton('Go to Login', 'blue');
		loginButton.addEventListener('click', () => {
			router.navigate('/auth');
		});

		errorContainer.appendChild(errorIcon);
		errorContainer.appendChild(errorTitle);
		errorContainer.appendChild(errorText);
		errorContainer.appendChild(loginButton);
		document.body.appendChild(errorContainer);

		// Auto-redirect after 3 seconds
		setTimeout(() => {
			router.navigate('/auth');
		}, 3000);
	}

	static showGameError(message: string, redirectPath: string = '/home', delay: number = 3000): void {
		// Create error overlay
		const errorOverlay = document.createElement('div');
		errorOverlay.className = `
            fixed inset-0 bg-black/70 flex items-center justify-center z-50
            backdrop-blur-sm
        `;

		const errorModal = document.createElement('div');
		errorModal.className = `
            bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center
            border-2 border-red-500 shadow-[4.0px_5.0px_0.0px_rgba(220,38,38,0.8)]
        `;

		const errorIcon = document.createElement('div');
		errorIcon.className = 'text-6xl mb-4';
		errorIcon.textContent = '❌';
		errorModal.appendChild(errorIcon);

		const errorMessage = document.createElement('h2');
		errorMessage.textContent = message;
		errorMessage.className = `font-['Orbitron'] text-xl font-bold mb-6 text-red-600`;
		errorModal.appendChild(errorMessage);

		const redirectMessage = document.createElement('p');
		redirectMessage.textContent = `Redirecting to home in ${delay / 1000} seconds...`;
		redirectMessage.className = 'text-gray-600 mb-4';
		errorModal.appendChild(redirectMessage);

		errorOverlay.appendChild(errorModal);
		document.body.appendChild(errorOverlay);

		// Countdown and redirect
		let countdown = delay / 1000;
		const countdownInterval = setInterval(() => {
			countdown--;
			redirectMessage.textContent = `Redirecting to home in ${countdown} seconds...`;

			if (countdown <= 0) {
				clearInterval(countdownInterval);
				errorOverlay.remove();
				window.dispatchEvent(new Event('app:close-sockets'));
				router.navigate(redirectPath);
			}
		}, 1000);
	}

	static guardEmbedding() {
		const topLocation = window.top?.location;
		if (topLocation === undefined) {
			window.location.href = "/";
			return;
		}

		// Same-origin policy
		try {
		topLocation.hostname;
		} catch (e) {
			if (e instanceof DOMException) {
				console.error("Access to this app from an unknown host is prohibited.");
				window.location.href = "/";
				return;
			}
		}

		// Verify top window domain name
		if (
			topLocation.hostname !== "pong42.click" &&
			topLocation.hostname !== "localhost" // For local debugging
		) {
			window.location.href = "/";
			return;
		}

		// Prevent visitors from directly visiting
		if (topLocation.pathname.startsWith("/chat")) {
			window.location.href = "/";
			return;
		}
	}
}
