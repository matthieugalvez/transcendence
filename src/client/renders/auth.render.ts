import logo from '../assets/logo.png';
import { CommonComponent } from '../components/common.component';
import { BackgroundComponent } from '../components/background.component';
import { AuthService } from '../services/auth.service';
import { GoogleService } from '../services/google.service';
import { UserService } from '../services/user.service';
import { language_obj } from '../index.ts';

export class AuthRender {
	/**
	 * Render the complete signup/login page
	 */
	static renderSignupPage(): {
		emailInput: HTMLInputElement;
		passwordInput: HTMLInputElement;
		signupButton: HTMLButtonElement;
		loginButton: HTMLButtonElement;
	} {
		// Set document title and body styles to match HomePage
		document.title = `${language_obj['Authpage_title']}`;
		//document.body.innerHTML = '';

		// Apply centered gradient layout using BackgroundComponent
		BackgroundComponent.applyCenteredGradientLayout();


		// Main container
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

	// Logo
	private static createLogo(container: HTMLElement): void {
		const img = document.createElement('img');
		img.src = logo;
		img.alt = 'Project Logo';
		img.className = 'w-32 h-auto mx-auto mb-4';
		container.appendChild(img);
	}

	// Page Title
	private static createPageTitle(container: HTMLElement): void {
		const title = document.createElement('h1');
    	title.textContent = `${language_obj['Authpage_box_title']}`;
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
    	subtitle.textContent = `${language_obj['Authpage_box_subtitle']}`;
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
		emailInput: HTMLInputElement;
		passwordInput: HTMLInputElement;
		signupButton: HTMLButtonElement;
		loginButton: HTMLButtonElement;
	} {
		const inputContainer = document.createElement('div');
		inputContainer.className = 'text-center mb-6';

		// Name input and label with gaming theme
		const emailLabel = CommonComponent.createLabel('Email');
		const emailInput = CommonComponent.createInput('email', 'Enter your email');

    // Password input and label with gaming theme
		const passwordLabel = CommonComponent.createLabel(`${language_obj['Authpage_password_label']}`);
		const passwordInput = CommonComponent.createInput('password', `${language_obj['Authpage_password_input']}`);

		// Button container
		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'flex gap-4 justify-center mt-6';

    // Create buttons with gaming theme
		const loginButton = CommonComponent.createStylizedButton(`${language_obj['Authpage_login_button']}`, 'blue');
		const signupButton = CommonComponent.createStylizedButton(`${language_obj['Authpage_signup_button']}`, 'purple');
		const googleButton = this.createGoogleSigninButton();


		// Append buttons to container
		buttonContainer.appendChild(loginButton);
		buttonContainer.appendChild(signupButton);


		// Append all elements to input container
		inputContainer.appendChild(emailLabel);
		inputContainer.appendChild(emailInput);
		inputContainer.appendChild(passwordLabel);
		inputContainer.appendChild(passwordInput);
		inputContainer.appendChild(buttonContainer);
		inputContainer.appendChild(googleButton);


		googleButton.addEventListener('click', () => {
			// console.log('Clicked on google signin');
			GoogleService.signin(); // Remove the semicolon after signin
		});
		container.appendChild(inputContainer);

		return {
			emailInput,
			passwordInput,
			signupButton,
			loginButton
		};
	}

	private static createGoogleSigninButton(): HTMLButtonElement {
		const googleButton = document.createElement('button');
		googleButton.type = 'button';
		googleButton.className = `
        flex items-center justify-center gap-4 w-full mt-5 px-4 py-6
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 hover:shadow-md
        transition-all duration-200
        text-gray-700 font-medium text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `.replace(/\s+/g, ' ').trim();

		// Google logo SVG
		const googleIcon = document.createElement('div');
		googleIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
    `;

		const buttonText = document.createElement('span');
		buttonText.textContent = `${language_obj['Authpage_Google_signin']}`;

		googleButton.appendChild(googleIcon);
		googleButton.appendChild(buttonText);

		// Add click event
		googleButton.addEventListener('click', () => {
			// console.log('Clicked on Google signin');
			GoogleService.signin();
		});

		return googleButton;
	}

	// Container pour les msg d'erreurs
	private static createMessageDisplay(container: HTMLElement): void {
		const signupMsgDisplay = document.createElement('div');
		signupMsgDisplay.id = 'signup-msg-display';
		signupMsgDisplay.className = 'text-center mt-4';
		container.appendChild(signupMsgDisplay);
	}

	// Modal 2FA Login
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
			const input = CommonComponent.createInput('text', `${language_obj['Auth2FApage_askcode']}`);
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

			const submitButton = CommonComponent.createStylizedButton(`${language_obj['Auth2FApage_submit_button']}`, 'blue');
			const cancelButton = CommonComponent.createStylizedButton(`${language_obj['Auth2FApage_cancel_button']}`, 'gray');
			buttonContainer.appendChild(submitButton);
			buttonContainer.appendChild(cancelButton);
			modal.appendChild(buttonContainer);

			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			input.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					submitButton.click();
				}
			});

			submitButton.addEventListener('click', async () => {
				const code = input.value.trim();
				if (!code) {
					msg.textContent = `${language_obj['Auth2FApage_askcode']}`;
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

			// overlay.addEventListener('click', (e) => {
			// 	if (e.target === overlay) {
			// 		document.body.removeChild(overlay);
			// 		resolve();
			// 	}
			// });

			input.focus();
		});
	}

	// Modal 2FA Setup (in user settings)
	static show2FASetupModal(qrCodeDataURL: string, secret: string, errorMsg?: string): Promise<string | null> {
		return new Promise((resolve) => {
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

			const modal = CommonComponent.createContainer(`
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-12 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-md w-full mx-1 text-center
    `);

			const title = CommonComponent.createHeading(`${language_obj['Auth2FApage_Header']}`, 2, `
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
			const input = CommonComponent.createInput('text', `${language_obj['Auth2FApage_askcode']}`);
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

			const submitButton = CommonComponent.createStylizedButton(`${language_obj['Auth2FApage_verify_button']}`, 'blue');
			const cancelButton = CommonComponent.createStylizedButton(`${language_obj['Auth2FApage_cancel_button']}`, 'gray');
			buttonContainer.appendChild(submitButton);
			buttonContainer.appendChild(cancelButton);
			modal.appendChild(buttonContainer);

			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			input.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					submitButton.click();
				}
			});

			submitButton.addEventListener('click', async () => {
				const code = input.value.trim();
				if (!code) {
					msg.textContent = `${language_obj['Auth2FApage_error_empty_field']}`;
					return;
				}
				// Call backend to verify code
				const verifyData = await AuthService.verify2FA(code);
				if (verifyData.success) {
					document.body.removeChild(overlay);
					resolve(code);
				} else {
					msg.textContent = `❌ ${verifyData.error}` || `${language_obj['Auth2FApage_error_invalid_code']}`;
					input.value = '';
				}
			});

			cancelButton.addEventListener('click', () => {
				document.body.removeChild(overlay);
				resolve(null);
			});

			input.focus();
		});
	}

	static showDisplayNameModal(isGoogleUser: boolean = false): Promise<string | null> {
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

			// Create modal container
			const modal = CommonComponent.createContainer(`
                bg-white/90 backdrop-blur-md
                border-2 border-black
                rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
                max-w-md w-full mx-4 text-center
            `);

			// Title
			const title = CommonComponent.createHeading(
				isGoogleUser ? 'Complete Your Sign-Up' : 'Choose Your Display Name',
				2,
				`
                    font-['Canada-big'] uppercase font-bold
                    text-xl text-center mb-2
                    bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
                    bg-clip-text text-transparent
                    select-none
                `
			);
			title.style.letterSpacing = "0.1em";
			modal.appendChild(title);

			// Description
			const description = document.createElement('p');
			description.textContent = isGoogleUser
				? 'Please choose a display name for your account'
				: 'This will be shown to other players';
			description.className = 'text-gray-600 mb-4';
			modal.appendChild(description);

			// Input
			const input = CommonComponent.createInput('text', 'Enter your display name');
			input.id = 'displayname-input';
			input.style.marginTop = '1rem';
			modal.appendChild(input);

			// Error message
			const errorMsg = document.createElement('div');
			errorMsg.id = 'displayname-error-msg';
			errorMsg.className = 'text-red-600 font-semibold mt-2 text-center';
			modal.appendChild(errorMsg);

			// Buttons
			const buttonContainer = document.createElement('div');
			buttonContainer.className = 'flex gap-4 justify-center mt-6';

			const submitButton = CommonComponent.createStylizedButton('Continue', 'blue');

			buttonContainer.appendChild(submitButton);

			// Only show cancel if not required

			modal.appendChild(buttonContainer);
			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			// Event listeners
			input.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					submitButton.click();
				}
			});

			submitButton.addEventListener('click', async () => {
				const displayName = input.value.trim();

				// Clear previous error
				errorMsg.textContent = '';

				// Basic validation
				if (!displayName) {
					errorMsg.textContent = 'Please enter a display name';
					return;
				}
				if (displayName.length < 3) {
					errorMsg.textContent = 'Display name must be at least 3 characters';
					return;
				}
				if (displayName.length > 12) {
					errorMsg.textContent = 'Display name must be less than 12 characters';
					return;
				}

				// Disable button during check
				submitButton.disabled = true;
				submitButton.textContent = 'Checking...';

				try {
					const availabilityResult = await UserService.checkDisplayNameAvailability(displayName);

					// console.log('🔍 Display name availability result:', availabilityResult);

					if (availabilityResult.available) {
						// Display name is available, close modal
						document.body.removeChild(overlay);
						resolve(displayName);
					} else {
						// Display name is taken
						errorMsg.textContent = availabilityResult.message || 'Display name is already taken';
						submitButton.disabled = false;
						submitButton.textContent = 'Continue';
					}

				} catch (error) {
					console.error('Error checking display name:', error);
					errorMsg.textContent = 'Failed to check availability. Please try again.';
					submitButton.disabled = false;
					submitButton.textContent = 'Continue';
				}
			});
		});
	}
}
