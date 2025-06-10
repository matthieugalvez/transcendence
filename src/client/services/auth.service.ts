export class AuthService {
  /**
   * Signup user with API call
   */
  static async signupUser(name: string, password: string): Promise<{ success: boolean; message?: string; error?: string; details?: any[] }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password })
      });

      const apiResponseData = await response.json();
      console.log('Signup response:', apiResponseData);

      return apiResponseData;
    } catch (error) {
      console.error('Error signing up user:', error);
      return {
        success: false,
        error: 'Error connecting to server'
      };
    }
  }

  /**
   * Login user with API call
   */
  static async loginUser(name: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ name, password })
      });

      const apiResponseData = await response.json();
      console.log('Login response:', apiResponseData);

      return apiResponseData;
    } catch (error) {
      console.error('Error logging in user:', error);
      return {
        success: false,
        error: 'Error connecting to server'
      };
    }
  }

  /**
   * Logout user with API call
   */
  static async logoutUser(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
      });

      const apiResponseData = await response.json();
      console.log('Logout response:', apiResponseData);

      return apiResponseData;
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        error: 'Error connecting to server'
      };
    }
  }

  static async languageUser(language: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/users/me/:language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ language })
      });

      const apiResponseData = await response.json();
      console.log('language response:', apiResponseData);

      return apiResponseData;
    } catch (error) {
      console.error('Error language:', error);
      return {
        success: false,
        error: 'Error connecting to server'
      };
    }
  }

  /**
   * Validate input fields
   */
  static validateInput(name: string, password: string): boolean {
    if (!name.trim() || !password.trim()) {
      return false;
    }
    return true;
  }
}
