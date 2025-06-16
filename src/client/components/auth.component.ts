import { CommonComponent } from './common.component';
import { AuthService } from '../services/auth.service';
import { AuthRender } from '../renders/auth.render'
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();

export class AuthComponent {

	// Signup User main function
	static async signupUser(name: string, password: string): Promise<boolean> {
		if (!AuthService.validateInput(name, password)) {
			CommonComponent.showMessage(`${language_obj['Authpage_error_empty_field']}`, 'error');
			return false;
		}

		const apiResponseData = await AuthService.signupUser(name, password);

		if (apiResponseData.success) {
			CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
			return true;
		} else {
			this.handleAuthError(apiResponseData);
			return false;
		}
	}

	// Login user main function
	static async loginUser(name: string, password: string, twoFACode?: string): Promise<any> {
		if (!AuthService.validateInput(name, password)) {
			// Only show error message on main page if modal is not open
			if (!document.getElementById('twofa-modal-msg')) {
				CommonComponent.showMessage(`${language_obj['Authpage_error_empty_field']}`, 'error');
			}
			return false;
		}

		const apiResponseData = await AuthService.loginUser(name, password, twoFACode);

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
			CommonComponent.showMessage(`❌ ${apiResponseData.error || `${language_obj['Authpage_error_logout_failed']}`}`, 'error');
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
	static validateInput(name: string, password: string): boolean {
		if (!AuthService.validateInput(name, password)) {
			CommonComponent.showMessage(`${language_obj['Authpage_error_empty_field']}`, 'error');
			return false;
		}
		return true;
	}

	static async	SetLanguageUser(language: string): Promise<boolean> {
		const	apiResponseData = await AuthService.SetLanguageUser(language);

		if (apiResponseData.success) {
			CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
			return true;
		}
		else {
			CommonComponent.showMessage(`❌ ${apiResponseData.error || 'language change failed'}`, 'error');
			return false;
		}
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
}
