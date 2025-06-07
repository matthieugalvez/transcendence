import { CommonComponent } from './common.component';

export class AuthComponent {
  /**
   * Signup user with API call
   */
  static async signupUser(name: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password })
      });

      const apiResponseData = await response.json();
      console.log('Server response:', apiResponseData);

      if (apiResponseData.success) {
        CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
        return true;
      } else {
        this.handleAuthError(apiResponseData);
        return false;
      }

    } catch (error) {
      console.error('Error signing up user:', error);
      CommonComponent.showMessage('❌ Error connecting to server', 'error');
      return false;
    }
  }

  /**
   * Login user with API call
   */
  static async loginUser(name: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password })
      });

      const apiResponseData = await response.json();
      console.log('Server response:', apiResponseData);

      if (apiResponseData.success) {
        CommonComponent.showMessage(`✅ ${apiResponseData.message}`, 'success');
        return true;
      } else {
        CommonComponent.showMessage(`❌ ${apiResponseData.error || 'Login failed'}`, 'error');
        return false;
      }

    } catch (error) {
      console.error('Error checking user:', error);
      CommonComponent.showMessage('❌ Error connecting to server', 'error');
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
   * Validate input fields
   */
  static validateInput(name: string, password: string): boolean {
    if (!name.trim() || !password.trim()) {
      CommonComponent.showMessage('❌ Please fill in all fields', 'error');
      return false;
    }
    return true;
  }
}