import { ApiClient } from "../utils/apiclient.utils";
import { CommonComponent } from "../components/common.component";
import { router } from "../configs/simplerouter";

export class GoogleService {
	static signin(): void {
		try {
			// Use current origin to determine the correct API endpoint
			const baseUrl = window.location.origin.includes('8443')
				? 'https://localhost:8443'  // Production through Nginx
				: 'http://localhost:3000';  // Development direct to API

			window.location.href = `${baseUrl}/api/auth/oauth2/google`;
		} catch (error) {
			console.error('Error initiating Google signin:', error);
		}
	}

	static async verifyOAuth2FA(code: string, setError: (error: string) => void): Promise<boolean> {
		try {
			const response = await fetch('/api/auth/oauth-2fa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ token: code })
			});

			const data = await response.json();

			if (data.success) {
				CommonComponent.showMessage('✅ Google Sign-In successful', 'success');
				setTimeout(() => {
					router.navigate('/home');
				}, 500);
				return true; // Close modal and indicate success
			} else {
				setError(data.error || 'Invalid 2FA code');
				return false; // Keep modal open
			}
		} catch (error) {
			console.error('OAuth 2FA verification error:', error);
			setError('Network error occurred. Please try again.');
			return false; // Keep modal open
		}
	}
}
