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
	static async loginUser(name: string, password: string, twoFACode?: string): Promise<any> {
		try {
			const body: any = { name, password };
			if (twoFACode) body.twoFACode = twoFACode;

			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(body)
			});

			return await response.json();
		} catch (error) {
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

	/**
	 * Validate input fields
	 */
	static validateInput(name: string, password: string): boolean {
		if (!name.trim() || !password.trim()) {
			return false;
		}
		return true;
	}

	static async setup2FA(): Promise<any> {
		try {
			const res = await fetch('/api/auth/2fa/setup', {
				method: 'POST',
				credentials: 'include'
			});
			return await res.json();
		} catch (error) {
			return { success: false, error: 'Error connecting to server' };
		}
	}

	static async verify2FA(code: string): Promise<any> {
		try {
			const res = await fetch('/api/auth/2fa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ token: code })
			});
			return await res.json();
		} catch (error) {
			return { success: false, error: 'Error connecting to server' };
		}
	}

	static async disable2FA(): Promise<any> {
		try {
			const res = await fetch('/api/auth/2fa/disable', {
				method: 'POST',
				credentials: 'include'
			});
			return await res.json();
		} catch (error) {
			return { success: false, error: 'Error connecting to server' };
		}
	}
}
