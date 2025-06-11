import { UserService } from '../services/user.service';
import { CommonComponent } from './common.component';

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
        msgDisplay.innerHTML = ''; // Clear HTML content too
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
                    // Handle detailed validation errors for username - same as AuthComponent
                    this.handleUserUpdateError(usernameResult, '', errors);
                }
            }

            // Update password if provided
            if (newPassword) {
                const passwordResult = await UserService.changePassword(newPassword);
                if (passwordResult.success) {
                    hasChanges = true;
                    passwordInput.value = ''; // Clear the input
                } else {
                    // Handle detailed validation errors for password - same as AuthComponent
                    this.handleUserUpdateError(passwordResult, '', errors);
                }
            }

            // Display results exactly like AuthComponent
            if (errors.length > 0) {
                // Join errors with <br> tags like in AuthComponent
                const errorMessage = `<div class="text-left"><br>${errors.join('<br>')}</div>`;

                // Use HTML formatting for validation errors (same as AuthComponent)
                CommonComponent.showMessage(`${errorMessage}`, 'error', true);
            } else if (hasChanges) {
                CommonComponent.showMessage('✅ Settings saved successfully!', 'success');
            } else {
                CommonComponent.showMessage('⚠️ No changes to save', 'error');
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            CommonComponent.showMessage('❌ Failed to save settings. Please try again.', 'error');
        }
    }

    /**
     * Handle user update errors - exactly like AuthComponent.handleAuthError
     */
    private static handleUserUpdateError(apiResponseData: any, fieldName: string, errors: string[]): void {
        if (apiResponseData.details && apiResponseData.details.length > 0) {
            // Handle detailed validation errors with proper formatting - same as AuthComponent
            const validationErrors = apiResponseData.details.map((detail: any) =>
                `❌ ${fieldName} ${detail.message}`
            );
            errors.push(...validationErrors);
        } else {
            // Handle simple error message
            const errorMessage = apiResponseData.error || `Failed to update ${fieldName.toLowerCase()}`;
            errors.push(`❌ ${fieldName} ${errorMessage}`);
        }
    }
}