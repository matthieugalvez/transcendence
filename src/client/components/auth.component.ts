import { CommonComponent } from './common.component';
import { AuthService } from '../services/auth.service';
import {AuthRender} from '../renders/auth.render'

export class AuthComponent {
  /**
   * Signup user with API call and UI feedback
   */
  static async signupUser(name: string, password: string): Promise<boolean> {
    if (!AuthService.validateInput(name, password)) {
      CommonComponent.showMessage('❌ Please fill in all fields', 'error');
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

  /**
   * Login user with API call and UI feedback
   */
static async loginUser(name: string, password: string, twoFACode?: string): Promise<any> {
  if (!AuthService.validateInput(name, password)) {
    CommonComponent.showMessage('❌ Please fill in all fields', 'error');
    return false;
  }

  const apiResponseData = await AuthService.loginUser(name, password, twoFACode);

  if (apiResponseData.success) {
    CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
    return apiResponseData;
  } else {
    CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Login failed'}`, 'error');
    return apiResponseData;
  }
}

  /**
   * Logout user with API call and UI feedback
   */
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

  /**
   * Handle authentication errors with validation details
   */
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

  /**
   * Validate input fields with UI feedback
   */
  static validateInput(name: string, password: string): boolean {
    if (!AuthService.validateInput(name, password)) {
      CommonComponent.showMessage('❌ Please fill in all fields', 'error');
      return false;
    }
    return true;
  }
	static async handle2FASetup() {
	// 1. Call backend to get QR code and secret
	const data = await AuthService.setup2FA();
	console.log('2FA Setup response:', data);
	if (!data.success) {
		CommonComponent.showMessage(`❌ ${data.error || 'Failed to start 2FA setup'}`, 'error');
		return;
	}

	// 2. Show QR code as a link in an alert (or render in modal for better UX)
	const code = await AuthRender.show2FASetupModal(data.data.qrCodeDataURL, data.data.secret);
	if (!code) {
		CommonComponent.showMessage('❌ You must enter a code to enable 2FA.', 'error');
		return;
	}

	// 4. Handle verification
	const verifyData = await AuthService.verify2FA(code);
	if (verifyData.success) {
		CommonComponent.showMessage('✅ 2FA enabled!', 'success');
	} else {
		CommonComponent.showMessage('❌ Invalid code. Try again.', 'error');
	}
	}

	static async Disable2FA() {
	const data = await AuthService.disable2FA();
	console.log('2FA Disable response:', data);
	if (!data.success) {
		CommonComponent.showMessage(`❌ ${data.error || 'Failed to disable 2FA'}`, 'error');
		return;
	}
	CommonComponent.showMessage('✅ 2FA disabled!', 'success');
	}
}