import { router } from '../configs/simplerouter';
import { BackgroundComponent } from '../components/background.component';
import { AuthComponent } from '../components/auth.component';
import { CommonComponent } from '../components/common.component';

// export async function googleCompletePage(): Promise<void> {
//     document.title = 'Transcendence - Completing Sign-In';
//     document.body.innerHTML = '';
//     BackgroundComponent.applyCenteredGradientLayout();

//     // Show loading message
//     const container = document.createElement('div');
//     container.className = `
//         bg-white/90 backdrop-blur-md
//         border-2 border-black
//         rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
//         max-w-md w-full mx-4 text-center
//     `.replace(/\s+/g, ' ').trim();

//     const loadingText = document.createElement('p');
//     loadingText.textContent = 'Completing your sign-in...';
//     loadingText.className = 'text-gray-600 text-lg';
//     container.appendChild(loadingText);
//     document.body.appendChild(container);

//     try {
//         // Check and handle display name (this will show modal if needed)
//         const success = await AuthComponent.checkAndHandleDisplayName();

//         if (success) {
//             // Everything is complete, go to home
//             router.navigate('/home');
//         }
//         // If not successful, user is already redirected to auth

//     } catch (error) {
//         console.error('Google complete error:', error);
//         CommonComponent.showMessage('❌ Sign-in failed. Please try again.', 'error');
//         setTimeout(() => {
//             router.navigate('/auth');
//         }, 2000);
//     }
// }