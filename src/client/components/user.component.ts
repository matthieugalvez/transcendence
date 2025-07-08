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
    let successes: string[] = [];

    try {
        // Update username if provided
        if (newUsername) {
            const usernameResult = await UserService.changeUsername(newUsername);
            if (usernameResult.success) {
                hasChanges = true;
                successes.push('✅ Display name updated successfully!');
                usernameInput.value = ''; // Clear the input
				setTimeout(() => {
					window.location.reload();
				}, 300);

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
                successes.push('✅ Password updated successfully!');
                passwordInput.value = ''; // Clear the input
            } else {
                // Handle detailed validation errors for password - same as AuthComponent
                this.handleUserUpdateError(passwordResult, '', errors);
            }
        }

        // Display results - show both successes and errors
        if (successes.length > 0 && errors.length > 0) {
            // Both successes and errors - show both
            const successMessage = successes.join('<br>');
            const errorMessage = `<div class="text-center"><br>${errors.join('<br>')}</div>`;
            const combinedMessage = `${successMessage}<br>${errorMessage}`;
            CommonComponent.showMessage(combinedMessage, 'warning', true);
        } else if (errors.length > 0) {
            // Only errors - show as error
            const errorMessage = `<div class="text-center"><br>${errors.join('<br>')}</div>`;
            CommonComponent.showMessage(errorMessage, 'error', true);
        } else if (hasChanges) {
            // Only successes - show as success
            const successMessage = successes.join('<br>');
            CommonComponent.showMessage(successMessage, 'success', true);
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