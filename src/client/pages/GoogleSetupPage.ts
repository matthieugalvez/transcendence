import { router } from '../configs/simplerouter';
import { BackgroundComponent } from '../components/background.component';
import { AuthRender } from '../renders/auth.render';
import { CommonComponent } from '../components/common.component';

export async function googleSetupPage(): Promise<void> {
    document.title = 'Transcendence - Complete Google Setup';
    document.body.innerHTML = '';
    BackgroundComponent.applyCenteredGradientLayout();

    try {
        // Check setup status
        const statusResponse = await fetch('/api/auth/google-setup/status', {
            credentials: 'include'
        });

        if (!statusResponse.ok) {
            console.error('No pending Google setup session');
            router.navigate('/auth');
            return;
        }

        const statusData = await statusResponse.json();

        if (!statusData.success) {
            router.navigate('/auth');
            return;
        }

        const { needsDisplayName, email } = statusData.data;

        if (!needsDisplayName) {
            // Setup already complete
            router.navigate('/home');
            return;
        }

        // Show setup UI
        const container = document.createElement('div');
        container.className = 'text-center';

        const title = CommonComponent.createHeading(
            'Complete Your Google Sign-In',
            1,
            `font-['Canada-big'] uppercase font-bold text-2xl mb-4
             bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
             bg-clip-text text-transparent`
        );

        const description = document.createElement('p');
        description.textContent = `Welcome ${email}! Please choose a display name for your account.`;
        description.className = 'text-gray-600 mb-6 text-lg';

        container.appendChild(title);
        container.appendChild(description);
        document.body.appendChild(container);

        // Show display name modal
        const displayName = await AuthRender.showDisplayNameModal(true);

        if (!displayName) {
            // This shouldn't happen for Google users, but handle it
            CommonComponent.showMessage('⚠️ Setup cancelled. Redirecting...', 'warning');
            setTimeout(() => router.navigate('/auth'), 2000);
            return;
        }

        // Complete setup
        const response = await fetch('/api/auth/google-setup/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ displayName })
        });

        const data = await response.json();

        if (data.success) {
            CommonComponent.showMessage('✅ Welcome! Setup complete.', 'success');
            setTimeout(() => {
                router.navigate('/home');
            }, 1000);
        } else {
            CommonComponent.showMessage(`❌ ${data.error || 'Failed to complete setup'}`, 'error');
            setTimeout(() => {
                router.navigate('/auth');
            }, 2000);
        }

    } catch (error) {
        console.error('Google setup error:', error);
        CommonComponent.showMessage('❌ Setup failed. Please try again.', 'error');
        setTimeout(() => {
            router.navigate('/auth');
        }, 2000);
    }
}