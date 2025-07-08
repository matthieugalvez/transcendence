import '../styles.css';
import { router } from '../configs/simplerouter';
import { ApiClient } from '../utils/apiclient.utils';
import { CommonComponent } from '../components/common.component';
import { AuthRender } from '../renders/auth.render';
import { AuthComponent } from '../components/auth.component';
import { language_obj } from '../index.js';

let emailInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let signupButton: HTMLButtonElement;
let loginButton: HTMLButtonElement;

/**
 * Main auth page function - checks authentication and handles rendering
 */
export async function authPage(): Promise<void> {
	// Check if user is already authenticated
	try {
		const response = await ApiClient.silentFetch('/api/users/me');

		if (response.ok) {
			const data = await response.json();
			if (data.success) {
				console.log('User already authenticated, redirecting to /home');
				router.navigate('/home');
				return;
			}
		}
	} catch (error) {
		console.log('Error checking authentication:', error);
	}

	// User is not authenticated, continue with auth page rendering
	console.log('User not authenticated, showing auth page');
	// Render the page and get form elements
	const formElements = AuthRender.renderSignupPage();

	emailInput = formElements.emailInput;
	passwordInput = formElements.passwordInput;
	signupButton = formElements.signupButton;
	loginButton = formElements.loginButton;

	// Setup event listeners
	setupEventListeners();

	// Focus on name input
	emailInput.focus();
}

/**
 * Setup event listeners for buttons and keyboard events
 */
function setupEventListeners(): void {
	// Button click handlers
	signupButton.addEventListener('click', onSignupClick);
	loginButton.addEventListener('click', onLoginClick);
}

/**
 * Handle signup button click - includes navigation logic
 */
async function onSignupClick(): Promise<void> {
	const email = emailInput.value.trim();
	const password = passwordInput.value.trim();

	if (!AuthComponent.validateInput(email, password)) {
		return;
	}

	// DEPRECATED FOR UX FLOW Better to ask once the account is created, need to check on all pages.
	// Show display name modal BEFORE creating user
	// const displayName = await AuthRender.showDisplayNameModal(false);

	// if (!displayName) {
	//     // User cancelled, no account is created
	//     CommonComponent.showMessage('⚠️ Account creation cancelled', 'warning');
	//     return;
	// }

	// Now create user with display name in one step
	const success = await AuthComponent.signupUser(email, password);
	//const success = await AuthComponent.signupUserWithDisplayName(name, password, displayName);

	if (success) {
		// Navigate to home after successful signup
		setTimeout(() => {
			const redirect = localStorage.getItem('postAuthRedirect');
			if (redirect) { // rediriger vers url en store pour duo online ou tournoi online
				localStorage.removeItem('postAuthRedirect');
				router.navigate(redirect);
			} else {
				router.navigate('/home');
			}
			// router.navigate('/home');
		}, 500);
	}
}

async function onLoginClick(): Promise<void> {
	const email = emailInput.value.trim();
	const password = passwordInput.value.trim();

	if (!AuthComponent.validateInput(email, password)) {
		return;
	}

	let loginResponse = await AuthComponent.loginUser(email, password);

	if (
		loginResponse &&
		(loginResponse.error === '2FA Code is missing' || loginResponse.error === 'Invalid 2FA Code')
	) {
		let initialError = loginResponse.error === '2FA Code is missing' ? loginResponse.error : undefined;
		await AuthRender.show2FAModal(async (code, setError) => {
			const response = await AuthComponent.loginUser(email, password, code);
			if (response && response.success) {
				CommonComponent.showMessage('✅ ' + (response.message || 'Login successful'), 'success');
				setTimeout(() => {
					router.navigate('/home');
				}, 500);
				return true; // Close modal
			} else if (response && response.error) {
				setError(response.error);
				return false;
			}
			return false;
		}, initialError);
	} else if (loginResponse && loginResponse.success) {
		CommonComponent.showMessage('✅ ' + (loginResponse.message || 'Login successful'), 'success');
		const redirect = localStorage.getItem('postAuthRedirect');
		if (redirect) {
			localStorage.removeItem('postAuthRedirect');
			router.navigate(redirect);
		} else {
			router.navigate('/home');
		}
	} else if (loginResponse && loginResponse.error) {
		CommonComponent.showMessage(`❌ ${loginResponse.error}`, 'error');
	}
}

// const redirect = localStorage.getItem('postAuthRedirect');
// 					if (redirect) {
// 						localStorage.removeItem('postAuthRedirect');
// 						router.navigate(redirect);
// 					} else {
// 						router.navigate('/home');
// 					}
