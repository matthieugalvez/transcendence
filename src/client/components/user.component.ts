import { CommonComponent } from './common.component';
import { AuthService } from '../services/auth.service';
import { AuthRender } from '../renders/auth.render';
import { UserService } from '../services/user.service';

export class UserComponent {
    static async saveSettings(): Promise<void> {
        // Get the input values from the DOM
        const usernameInput = document.querySelector('#username-input') as HTMLInputElement;
        const passwordInput = document.querySelector('#password-input') as HTMLInputElement;
        const msgDisplay = document.querySelector('#signup-msg-display') as HTMLElement;

        if (!usernameInput || !passwordInput || !msgDisplay) {
            console.error('Required form elements not found');
            return;
        }

        const newUsername = usernameInput.value.trim();
        const newPassword = passwordInput.value.trim();

        // Clear previous messages
        msgDisplay.textContent = '';
        msgDisplay.className = 'text-center mt-4';

        let hasChanges = false;
        let errors: string[] = [];

        try {
            // Update username if provided
            if (newUsername) {
                const usernameResult = await UserService.changeUsername(newUsername);
                if (usernameResult.success) {
                    hasChanges = true;
                    usernameInput.value = ''; // Clear the input
                } else {
                    errors.push(`Username: ${usernameResult.error}`);
                }
            }

            // Update password if provided
            if (newPassword) {
                if (newPassword.length < 6) {
                    errors.push('Password must be at least 6 characters long');
                } else {
                    const passwordResult = await UserService.changePassword(newPassword);
                    if (passwordResult.success) {
                        hasChanges = true;
                        passwordInput.value = ''; // Clear the input
                    } else {
                        errors.push(`Password: ${passwordResult.error}`);
                    }
                }
            }

            // Display results
            if (errors.length > 0) {
                msgDisplay.className = 'text-center mt-4 text-red-600 font-semibold';
                msgDisplay.textContent = `❌ ${errors.join(', ')}`;
            } else if (hasChanges) {
                msgDisplay.className = 'text-center mt-4 text-green-600 font-semibold';
                msgDisplay.textContent = '✅ Settings saved successfully!';
            } else {
                msgDisplay.className = 'text-center mt-4 text-yellow-600 font-semibold';
                msgDisplay.textContent = '⚠️ No changes to save';
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            msgDisplay.className = 'text-center mt-4 text-red-600 font-semibold';
            msgDisplay.textContent = '❌ Failed to save settings. Please try again.';
        }
    }
}