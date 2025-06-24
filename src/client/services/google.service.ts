import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';

export class GoogleService {
    static signin(): void {
        try {
            console.log('🔍 Initiating Google signin...');

            // Always use the current page's origin for consistency
            const baseUrl = window.location.origin;
            const googleUrl = `${baseUrl}/api/auth/oauth2/google`;

            console.log('🔗 Redirecting to:', googleUrl);
            window.location.href = googleUrl;
        } catch (error) {
            console.error('❌ Error initiating Google signin:', error);
            CommonComponent.showMessage('❌ Failed to initiate Google sign-in', 'error');
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
                return true;
            } else {
                setError(data.error || 'Invalid 2FA code');
                return false;
            }
        } catch (error) {
            console.error('OAuth 2FA verification error:', error);
            setError('Network error occurred. Please try again.');
            return false;
        }
    }
}