import { CommonComponent } from './common.component';
import { AuthService } from '../services/auth.service';
import { AuthRender } from '../renders/auth.render'
import { router } from '../configs/simplerouter'
import { UserService } from '../services/user.service';

export class AuthComponent {

	// Signup User main function
	static async signupUser(email: string, password: string): Promise<boolean> {
		if (!AuthService.validateInput(email, password)) {
			CommonComponent.showMessage('❌ Please fill in all fields', 'error');
			return false;
		}

		const apiResponseData = await AuthService.signupUser(email, password);

		if (apiResponseData.success) {
			CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
			return true;
		} else {
			this.handleAuthError(apiResponseData);
			return false;
		}
	}

	// Login user main function
	static async loginUser(email: string, password: string, twoFACode?: string): Promise<any> {
		if (!AuthService.validateInput(email, password)) {
			// Only show error message on main page if modal is not open
			if (!document.getElementById('twofa-modal-msg')) {
				CommonComponent.showMessage('❌ Please fill in all fields', 'error');
			}
			return false;
		}

		const apiResponseData = await AuthService.loginUser(email, password, twoFACode);

		if (apiResponseData.success) {
			if (!document.getElementById('twofa-modal')) {
				CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
			}
			return apiResponseData;
		} else {
			// Only show non-2FA errors on the main page
			const twoFAErrors = ['2FA Code is missing', 'Invalid 2FA Code'];
			if (
				!document.getElementById('twofa-modal') &&
				!twoFAErrors.includes(apiResponseData.error)
			) {
				CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Login failed'}`, 'error');
			}
			return apiResponseData;
		}
	}

	// Logout main function
	static async logoutUser(): Promise<boolean> {
		const apiResponseData = await AuthService.logoutUser();

		if (apiResponseData.success) {
			CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
			return true;
		} else {
			CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Logout failed'}`, 'error');
			return false;
		}
	}

	// Gestion d'erreur pour l'auth (mdp/signup etc)
	private static handleAuthError(apiResponseData: any): void {
		let errorMessage = apiResponseData.error || 'Registration failed';

		if (apiResponseData.details && apiResponseData.details.length > 0) {
			const validationErrors = apiResponseData.details
				.map((detail: any) => `❌ ${detail.message}`)
				.join('<br>');
			errorMessage = `<div class="text-left"><br>${validationErrors}</div>`;

			// Use HTML formatting for validation errors
			CommonComponent.showMessage(`${errorMessage}`, 'error', true);
			return;
		}

		CommonComponent.showMessage(`❌ ${errorMessage}`, 'error');
	}

	// Validate Input avec message d'erreur
	static validateInput(email: string, password: string): boolean {
		if (!AuthService.validateInput(email, password)) {
			CommonComponent.showMessage('❌ Please fill in all fields', 'error');
			return false;
		}
		return true;
	}

	// 2FA Setup Handler (modal pour User settings)
	static async handle2FASetup() {
		const data = await AuthService.setup2FA();
		if (!data.success) {
			CommonComponent.showMessage(`❌ ${data.error || 'Failed to start 2FA setup'}`, 'error');
			return;
		}

		let errorMsg: string | undefined = undefined;
		while (true) {
			const code = await AuthRender.show2FASetupModal(data.data.qrCodeDataURL, data.data.secret, errorMsg);
			if (!code) {
				// User cancelled
				return;
			}
			const verifyData = await AuthService.verify2FA(code);
			if (verifyData.success) {
				CommonComponent.showMessage('✅ 2FA enabled!', 'success');
				break;
			} else {
				errorMsg = verifyData.error || '❌ Invalid code. Try again.';
			}
		}
	}

	// Disable 2FA pour user settings
	static async disable2FA(): Promise<boolean> {
		const apiResponseData = await AuthService.disable2FA();
		if (apiResponseData.success) {
			CommonComponent.showMessage('✅ 2FA disabled!', 'success');
			return true;
		} else {
			CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Failed to disable 2FA'}`, 'error');
			return false;
		}
	}

	static async signupUserWithDisplayName(email: string, password: string, displayName: string): Promise<boolean> {
		if (!AuthService.validateInput(email, password)) {
			CommonComponent.showMessage('❌ Please fill in all fields', 'error');
			return false;
		}

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email, password, displayName })
			});

			const data = await response.json();

			if (data.success) {
				CommonComponent.showMessage(`✅ ${data.message || 'Account created successfully!'}`, 'success');
				return true;
			} else {
				this.handleAuthError(data);
				return false;
			}
		} catch (error) {
			console.error('Signup with display name error:', error);
			CommonComponent.showMessage('❌ Failed to create account. Please try again.', 'error');
			return false;
		}
	}

	static async checkAndHandleDisplayName(): Promise<{ success: boolean; userData?: any }> {
		try {
			// Get current user data
			const userData = await UserService.getCurrentUser();

			// Check if display name is missing or same as username
			const needsDisplayName = !userData.displayName ||
				userData.displayName.trim() === '' ||
				userData.displayName === userData.email;

			if (!needsDisplayName) {
				return { success: true, userData };
			}

			console.log('User needs display name setup');

			// Show display name modal
			const displayName = await AuthRender.showDisplayNameModal(true);

			if (!displayName) {
				// If user cancels, logout and redirect
				await this.logoutUser();
				router.navigate('/auth');
				return { success: false };
			}

			// Update display name
			const updateResult = await UserService.changeUsername(displayName);

			if (updateResult.success) {
				CommonComponent.showMessage('✅ Display name set successfully!', 'success');
				const updatedUserData = await UserService.getCurrentUser();
				return { success: true, userData: updatedUserData };
			} else {
				// Show error and retry
				let errorMessage = updateResult.error || 'Failed to set display name';

				// Handle validation errors
				if (updateResult.details && updateResult.details.length > 0) {
					const validationErrors = updateResult.details
						.map((detail: any) => detail.message)
						.join(', ');
					errorMessage = validationErrors;
				}

				CommonComponent.showMessage(`❌ ${errorMessage}`, 'error');

				// Recursively call this method to show the modal again
				return await this.checkAndHandleDisplayName();
			}

		} catch (error) {
			console.error('Error checking display name:', error);
			await this.logoutUser();
			router.navigate('/auth');
			return { success: false };
		}
	}
}
