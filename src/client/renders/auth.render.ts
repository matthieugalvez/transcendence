import logo from '../assets/logo.png';
import { CommonComponent } from '../components/common.component';

import { BackgroundComponent } from '../components/background.component';
import { AuthService } from '../services/auth.service';


export class AuthRender {
	/**
	 * Render the complete signup/login page
	 */
	static renderSignupPage(): {
		nameInput: HTMLInputElement;
		passwordInput: HTMLInputElement;
		signupButton: HTMLButtonElement;
		loginButton: HTMLButtonElement;
	} {
		// Set document title and body styles to match HomePage
		document.title = 'Transcendence - Authentication';
		document.body.innerHTML = '';

		// Apply centered gradient layout using BackgroundComponent
		BackgroundComponent.applyCenteredGradientLayout();


		// Main container with glassmorphism
		const mainContainer = document.createElement('div');
		mainContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-md w-full mx-4
    `.replace(/\s+/g, ' ').trim();


		// Create and append logo
		this.createLogo(mainContainer);

		// Create and append page title
		this.createPageTitle(mainContainer);

		// Create form elements
		const formElements = this.createFormElements(mainContainer);

		// Create message display container
		this.createMessageDisplay(mainContainer);

		document.body.appendChild(mainContainer);

		return formElements;
	}

	/**
	 * Create and append logo to the container
	 */
	private static createLogo(container: HTMLElement): void {
		const img = document.createElement('img');
		img.src = logo;
		img.alt = 'Project Logo';
		img.className = 'w-32 h-auto mx-auto mb-4';
		container.appendChild(img);
	}

	/**
	 * Create and append page title
	 */
	private static createPageTitle(container: HTMLElement): void {
		const title = document.createElement('h1');
		title.textContent = 'Enter the Game';
		title.className = `
      font-['Canada-big'] uppercase font-bold
      text-3xl text-center mb-2
      bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
      bg-clip-text text-transparent
      select-none
    `.replace(/\s+/g, ' ').trim();
		title.style.letterSpacing = "0.1em";

		// Subtitle
		const subtitle = document.createElement('p');
		subtitle.textContent = 'Join the ultimate ping pong experience';
		subtitle.className = `
      font-['Orbitron'] text-center text-gray-600
      text-sm font-medium mb-6
    `.replace(/\s+/g, ' ').trim();
		subtitle.style.letterSpacing = "0.05em";

		container.appendChild(title);
		container.appendChild(subtitle);
	}

	/**
	 * Create form elements (inputs and buttons)
	 */
	private static createFormElements(container: HTMLElement): {
		nameInput: HTMLInputElement;
		passwordInput: HTMLInputElement;
		signupButton: HTMLButtonElement;
		loginButton: HTMLButtonElement;
	} {
		const inputContainer = document.createElement('div');
		inputContainer.className = 'text-center mb-6';

		// Name input and label with gaming theme
		const nameLabel = CommonComponent.createLabel('Nickname');
		const nameInput = CommonComponent.createInput('text', 'Enter your nickname');

		// Password input and label with gaming theme
		const passwordLabel = CommonComponent.createLabel('Password');
		const passwordInput = CommonComponent.createInput('password', 'Enter your password');

		// Button container
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex gap-4 justify-center mt-6';

		const loginButton = CommonComponent.createStylizedButton('LOGIN', 'blue');
		const signupButton = CommonComponent.createStylizedButton('SIGNUP', 'purple');

		// Append buttons to container
		buttonContainer.appendChild(loginButton);
		buttonContainer.appendChild(signupButton);

		// Append all elements to input container
		inputContainer.appendChild(nameLabel);
		inputContainer.appendChild(nameInput);
		inputContainer.appendChild(passwordLabel);
		inputContainer.appendChild(passwordInput);
		inputContainer.appendChild(buttonContainer);

		container.appendChild(inputContainer);

		return {
			nameInput,
			passwordInput,
			signupButton,
			loginButton
		};
	}

	/**
	 * Create message display container
	 */
	private static createMessageDisplay(container: HTMLElement): void {
		const signupMsgDisplay = document.createElement('div');
		signupMsgDisplay.id = 'signup-msg-display';
		signupMsgDisplay.className = 'text-center mt-4';
		container.appendChild(signupMsgDisplay);
	}

	// Place this outside your functions in AuthPage.ts

	static show2FAModal(
		onVerify: (code: string, setError: (msg: string) => void) => Promise<boolean>,
		initialErrorMsg?: string
	): Promise<void> {
		return new Promise((resolve) => {
			// Create overlay with blur
			const overlay = document.createElement('div');
			overlay.style.position = 'fixed';
			overlay.style.top = '0';
			overlay.style.left = '0';
			overlay.style.width = '100vw';
			overlay.style.height = '100vh';
			overlay.style.background = 'rgba(0,0,0,0.35)';
			overlay.style.backdropFilter = 'blur(6px)';
			overlay.style.display = 'flex';
			overlay.style.justifyContent = 'center';
			overlay.style.alignItems = 'center';
			overlay.style.zIndex = '1000';

			// Create modal container using CommonComponent
			const modal = CommonComponent.createContainer(`
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-md w-full mx-4 text-center
    `);
	modal.id = 'twofa-modal';

			// Title
			const title = CommonComponent.createHeading('Two-Factor Authentication', 2, `
      font-['Canada-big'] uppercase font-bold
      text-xl text-center mb-2
      bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
      bg-clip-text text-transparent
      select-none
    `);
			title.style.letterSpacing = "0.1em";
			modal.appendChild(title);

			// Input
			const input = CommonComponent.createInput('text', 'Enter your 2FA code');
			input.id = 'twofa-code-input';
			input.style.marginTop = '1rem';
			modal.appendChild(input);

			// Error message
			const msg = document.createElement('div');
			msg.id = 'twofa-modal-msg';
			msg.className = 'text-red-600 font-semibold mt-2 text-center';
			if (initialErrorMsg) msg.textContent = initialErrorMsg;
			modal.appendChild(msg);

			// Buttons
			const buttonContainer = document.createElement('div');
			buttonContainer.className = 'flex gap-4 justify-center mt-6';

			const submitButton = CommonComponent.createStylizedButton('Submit', 'blue');
			const cancelButton = CommonComponent.createStylizedButton('Cancel', 'gray');
			buttonContainer.appendChild(submitButton);
			buttonContainer.appendChild(cancelButton);
			modal.appendChild(buttonContainer);

			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			submitButton.addEventListener('click', async () => {
				const code = input.value.trim();
				if (!code) {
					msg.textContent = 'Please enter your 2FA code.';
					return;
				}
				const shouldClose = await onVerify(code, (err) => { msg.textContent = `❌ ${err}`; });
				if (shouldClose) {
					document.body.removeChild(overlay);
					resolve();
				} else {
					input.value = '';
				}
			});

			cancelButton.addEventListener('click', () => {
				document.body.removeChild(overlay);
				resolve();
			});

			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					document.body.removeChild(overlay);
					resolve();
				}
			});

			input.focus();
		});
	}


	static show2FASetupModal(qrCodeDataURL: string, secret: string, errorMsg?: string): Promise<string | null> {
		return new Promise((resolve) => {
			// Overlay with blur
			const overlay = document.createElement('div');
			overlay.style.position = 'fixed';
			overlay.style.top = '0';
			overlay.style.left = '0';
			overlay.style.width = '100vw';
			overlay.style.height = '100vh';
			overlay.style.background = 'rgba(0,0,0,0.35)';
			overlay.style.backdropFilter = 'blur(6px)';
			overlay.style.display = 'flex';
			overlay.style.justifyContent = 'center';
			overlay.style.alignItems = 'center';
			overlay.style.zIndex = '1000';

			// Modal
			const modal = CommonComponent.createContainer(`
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-12 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-md w-full mx-1 text-center
    `);

			const title = CommonComponent.createHeading('Enable Two-Factor Authentication', 2, `
      font-['Canada-big'] uppercase font-bold
      text-xl text-center mb-2
      bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
      bg-clip-text text-transparent
      select-none
    `);
			title.style.letterSpacing = "0.1em";
			modal.appendChild(title);

			// QR code
			const qrImg = document.createElement('img');
			qrImg.src = qrCodeDataURL;
			qrImg.alt = '2FA QR Code';
			qrImg.style.width = '160px';
			qrImg.style.height = '160px';
			qrImg.style.margin = '1rem auto';
			modal.appendChild(qrImg);

			// Input
			const input = CommonComponent.createInput('text', 'Enter your 2FA Code');
			input.id = 'twofa-setup-code-input';
			input.style.marginTop = '1rem';
			modal.appendChild(input);

			// Error message
			const msg = document.createElement('div');
			msg.id = 'twofa-setup-msg';
			msg.className = 'text-red-600 font-semibold mt-8 text-center';
			if (errorMsg) msg.textContent = errorMsg;
			modal.appendChild(msg);

			// Buttons
			const buttonContainer = document.createElement('div');
			buttonContainer.className = 'flex gap-4 justify-center mt-6';

			const submitButton = CommonComponent.createStylizedButton('Verify', 'blue');
			const cancelButton = CommonComponent.createStylizedButton('Cancel', 'gray');
			buttonContainer.appendChild(submitButton);
			buttonContainer.appendChild(cancelButton);
			modal.appendChild(buttonContainer);

			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			submitButton.addEventListener('click', async () => {
				const code = input.value.trim();
				if (!code) {
					msg.textContent = '❌ You must enter a code to enable 2FA.';
					return;
				}
				// Call backend to verify code
				const verifyData = await AuthService.verify2FA(code);
				if (verifyData.success) {
					document.body.removeChild(overlay);
					resolve(code);
				} else {
					msg.textContent = `❌ ${verifyData.error}` || '❌ Invalid code. Try again.';
					input.value = '';
				}
			});

			cancelButton.addEventListener('click', () => {
				document.body.removeChild(overlay);
				resolve(null);
			});

			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					document.body.removeChild(overlay);
					resolve(null);
				}
			});

			input.focus();
		});
	}

}