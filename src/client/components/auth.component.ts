import { CommonComponent } from './common.component';
import { AuthService } from '../services/auth.service';

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
  static async loginUser(name: string, password: string): Promise<boolean> {
    if (!AuthService.validateInput(name, password)) {
      CommonComponent.showMessage('❌ Please fill in all fields', 'error');
      return false;
    }

    const apiResponseData = await AuthService.loginUser(name, password);

    if (apiResponseData.success) {
      CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
      return true;
    } else {
      CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Login failed'}`, 'error');
      return false;
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
}