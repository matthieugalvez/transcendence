import { ApiClient } from '../utils/apiclient.utils';

export class UserService {


	static async getAllUsers(): Promise<Array<{ id: number; name: string; created_at: string; update_at: string }>> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/users');

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to get users');
			}

			return data.data.users;
		} catch (error) {
			console.error('Error fetching users:', error);
			throw new Error('Failed to fetch users. Please try again.');
		}
	}

	/**
	 * Get current authenticated user data
	 */
	static async getCurrentUser(): Promise<{ id: number; name: string; displayName: string; created_at: string; updated_at: string }> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/users/me');

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to get user data');
			}

			return data.data;
		} catch (error) {
			console.error('Error fetching current user:', error);
			throw new Error('Failed to fetch user data. Please try again.');
		}
	}

	/**
	 * Check if a user exists by name (PROTECTED)
	 */
	static async checkUserExists(name: string): Promise<boolean> {
		try {
			const response = await ApiClient.authenticatedFetch(`/api/users/check/${encodeURIComponent(name)}`);

			const data = await response.json();
			return data.success && data.data.exists === true;
		} catch (error) {
			console.error('Error checking if user exists:', error);
			return false;
		}
	}

	static async checkDisplayNameAvailability(displayName: string): Promise<{ available: boolean; message?: string }> {
		try {
const response = await fetch(`/api/check-display-name?displayName=${encodeURIComponent(displayName)}`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();

			console.log('🔍 Server response for display name check:', data);

			// Handle the server response structure
			if (response.ok && data.success) {
				return {
					available: data.data?.available || false,
					message: data.data?.message || data.message
				};
			} else {
				return {
					available: false,
					message: data.message || data.error || 'Display name check failed'
				};
			}

		} catch (error) {
			console.error('Error checking display name availability:', error);
			return {
				available: false,
				message: 'Failed to check availability'
			};
		}
	}

	/**
	 * Get all users (PROTECTED)
	 */
	// ...existing methods...

	static async changeUsername(displayName: string): Promise<{ success: boolean; error?: string; details?: any[] }> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/me/display-name', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ displayName })
			});

			const data = await response.json();

			console.log('Change username response:', data); // Debug log

			if (!data.success) {
				return {
					success: false,
					error: data.error || 'Failed to update display name',
					details: data.details || [] // Include validation details
				};
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('Error changing display name:', error);
			return {
				success: false,
				error: 'Failed to update display name. Please try again.'
			};
		}
	}

	/**
	 * Change user password
	 */
	static async changePassword(password: string): Promise<{ success: boolean; error?: string; details?: any[] }> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/me/password', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password })
			});

			const data = await response.json();

			if (!data.success) {
				return {
					success: false,
					error: data.error || 'Failed to update password',
					details: data.details || [] // Include validation details
				};
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('Error changing password:', error);
			return {
				success: false,
				error: 'Failed to update password. Please try again.'
			};
		}
	}
}
