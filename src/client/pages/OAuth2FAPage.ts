import { AuthRender } from '../renders/auth.render';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';
import { BackgroundComponent } from '../components/background.component';
import { UserService } from '../services/user.service';
import { language_obj } from '../index.ts';

export async function oauth2FAPage(): Promise<void> {
    console.log('🔐 OAuth 2FA page loaded');

    // Clear any existing content
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '';
    }

    // Set up the page background
    document.title = `${language_obj['Auth2FApage_title']}`;
    document.body.innerHTML = '';

    // Create a simple background container
    const container = BackgroundComponent.applyNormalGradientLayout();
   // const loadingText = CommonComponent.createText('Completing Google Sign-In...', 'text-white text-lg');
    //container.appendChild(loadingText);
    //document.body.appendChild(container);

    // Show the 2FA modal
    try {
        await AuthRender.show2FAModal(async (code, setError) => {
            console.log('🔐 Attempting OAuth 2FA verification with code:', code);

            try {
                const response = await fetch('/api/auth/oauth-2fa/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token: code })
                });

                const data = await response.json();
                console.log('🔐 OAuth 2FA verification response:', data);

                if (data.success) {
                    CommonComponent.showMessage(`${language_obj['Auth2FApage_GoogleSIsuccess']}`, 'success');
                    setTimeout(() => {
                        router.navigate('/home');
                    }, 500);
                    return true; // Close modal
                } else {
                    setError(data.error || 'Invalid 2FA code');
                    return false; // Keep modal open
                }
            } catch (error) {
                console.error('🔐 OAuth 2FA verification error:', error);
                setError('Network error occurred. Please try again.');
                return false;
            }
        })
    } catch (error) {
        console.error('🔐 Error showing 2FA modal:', error);
        // If modal fails, redirect back to auth
        router.navigate('/auth');
    }

    // If we reach here, the modal was closed without success
    console.log('🔐 2FA modal closed, redirecting to auth');
    router.navigate('/auth');
}
