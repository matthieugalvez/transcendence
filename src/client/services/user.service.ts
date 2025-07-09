import { ApiClient } from '../utils/apiclient.utils';
import { CommonComponent } from '../components/common.component'
import { WebSocketService } from '../services/websocket.service'
import { WebSocket } from 'ws';

export class UserService {
	static async GetLanguageFile(): Promise<{ success: boolean; message?: string; error?: string }> {
		try {
		  const response = await fetch('/api/users/me/language', {
			method: 'GET',
			credentials: 'include', // Include cookies for authentication
		  });

			const	apiResponse = await response.json();
		//		console.log('language file response:', apiResponse);
			const	ResponseData = apiResponse.data;
			return	ResponseData;
		}
		catch (error) {
		  console.error('Error language file:', error);
		  return {
			success: false,
			error: 'Error connecting to server'
		  };
		}
	}

	static async getAllUsers(): Promise<Array<{ id: string; name: string; created_at: string; update_at: string }>> {
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
	static async getCurrentUser(): Promise<{ id: string; name: string; avatar: string; displayName: string; created_at: string; updated_at: string }> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/users/me');

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to get user data');
			}

			// User log on appelle la websocket
			WebSocketService.getInstance()
			return data.data;
		} catch (error) {
			console.error('Error fetching current user:', error);
			throw new Error('Failed to fetch user data. Please try again.');
		}
	}

	/**
	 * Check if a user exists by name (PROTECTED)
	 */
	static async checkUserExists(displayName: string): Promise<boolean> {
		try {
			const response = await ApiClient.authenticatedFetch(`/api/users/check/${encodeURIComponent(displayName)}`);

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

			// console.log('🔍 Server response for display name check:', data);

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

			// console.log('Change username response:', data); // Debug log

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
					'Content-Type': 'application/json'
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

	static async changeAvatar(password: string): Promise<{ success: boolean; error?: string; details?: any[] }> {
		try {
			const response = await ApiClient.authenticatedFetch('/api/me/avatar', {
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
					error: data.error || 'Failed to update profile pic',
					details: data.details || [] // Include validation details
				};
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('Error changing profile pic:', error);
			return {
				success: false,
				error: 'Failed to update profile pic. Please try again.'
			};
		}
	}

	static async handleAvatarUpload(file: File, avatarImg: HTMLImageElement): Promise<void> {
		try {
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				CommonComponent.showMessage('❌ File size must be less than 5MB', 'error');
				return;
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				CommonComponent.showMessage('❌ Please select an image file', 'error');
				return;
			}

			// Show loading state
			const uploadButton = document.getElementById('avatar-upload-btn') as HTMLButtonElement;
			if (uploadButton) {
				uploadButton.disabled = true;
				uploadButton.textContent = 'Uploading...';
			}

			// Create FormData for upload
			const formData = new FormData();
			formData.append('avatar', file);

			// Upload to server - ADD credentials and better error handling
			const response = await fetch('/api/me/avatar', {
				method: 'POST',
				body: formData,
				credentials: 'include' // This is crucial for authentication
			});

			// console.log('Upload response status:', response.status);
			// console.log('Upload response headers:', response.headers);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Upload failed with status:', response.status, 'Error:', errorText);
				throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
//			console.log('Upload result:', result);

			if (result.success) {
				// Update avatar preview
				const avatarUrl = result.data.avatarUrl;
				avatarImg.src = avatarUrl + '?t=' + Date.now(); // Add cache busting

				// Show success message
				CommonComponent.showMessage('✅ Avatar updated successfully', 'success');

				// Update sidebar avatar if exists
				const sidebarAvatar = document.querySelector('nav img') as HTMLImageElement;
				if (sidebarAvatar) {
					sidebarAvatar.src = avatarUrl + '?t=' + Date.now();
				}

				// Reload page after a delay
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} else {
				throw new Error(result.message || 'Upload failed');
			}

		} catch (error) {
			console.error('Avatar upload error:', error);
			CommonComponent.showMessage(`❌ Failed to upload avatar: ${error.message}`, 'error');
		} finally {
			// Reset upload button
			const uploadButton = document.getElementById('avatar-upload-btn') as HTMLButtonElement;
			if (uploadButton) {
				uploadButton.disabled = false;
				uploadButton.textContent = 'Change Avatar';
			}
		}
	}

	// FRIEND PROFILE AND SO ON

	static async getUserProfile(userId: string): Promise<{ id: string; name: string; displayName: string; avatar: string; created_at: string; updated_at: string }> {
		try {
			const response = await ApiClient.authenticatedFetch(`/api/users/profile/${encodeURIComponent(userId)}`);

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to get user profile');
			}

			return data.data;
		} catch (error) {
			console.error('Error fetching user profile:', error);
			throw new Error('Failed to fetch user profile. Please try again.');
		}
	}

	static async getUserProfileByDisplayName(displayName: string): Promise<{ id: string; name: string; displayName: string; avatar: string; created_at: string; updated_at: string }> {
		try {
			const response = await ApiClient.authenticatedFetch(`/api/users/profile/${encodeURIComponent(displayName)}`);

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to get user profile');
			}

			return data.data;
		} catch (error) {
			console.error('Error fetching user profile by displayName:', error);
			throw new Error('Failed to fetch user profile. Please try again.');
		}
	}

	static async searchUsers(query: string, limit: number = 10): Promise<Array<{ id: string; displayName: string; avatar: string }>> {
		try {
			const response = await ApiClient.authenticatedFetch(
				`/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`
			);

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to search users');
			}

			return data.data;
		} catch (error) {
			console.error('Error searching users:', error);
			throw new Error('Failed to search users. Please try again.');
		}
	}

	static async addFriend(recipientId: string): Promise<void> {
		const response = await ApiClient.authenticatedFetch(
			'/api/friends/request',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipientId })
			}
		);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error);
		}
	}

	static async getFriends(): Promise<any[]> {
		try {
			const response = await fetch('/api/friends', {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const responseData = await response.json();
			// console.log('getFriends response:', responseData); // Debug log

			// Return just the data array, not the whole response object
			return responseData.data || [];
		} catch (error) {
			console.error('Error fetching friends:', error);
			return []; // Return empty array instead of throwing to prevent render issues
		}
	}
	static async getFriendshipStatus(otherUserId: string): Promise<{
		status: 'friends' | 'pending' | 'incoming' | 'blocked' | 'blocked_by' | 'none', requestId?: string }> {
		const response = await ApiClient.authenticatedFetch(`/api/friends/status/${encodeURIComponent(otherUserId)}`);
		const data = await response.json();
		if (!data.success)
			throw new Error(data.error || 'Failed to get friendship status');
		return data.data; // { status, requestId }
	}

	static async rejectFriendRequest(friendshipId: string): Promise<void> {
		const response = await ApiClient.authenticatedFetch(
			`/api/friends/request/${encodeURIComponent(friendshipId)}/reject`,
			{ method: 'DELETE' }
		);
		const data = await response.json();
		if (!data.success) throw new Error(data.error || 'Failed to reject friend request');
	}

	static async removeFriend(friendId: string): Promise<void> {
		const response = await ApiClient.authenticatedFetch(
			`/api/friends/${encodeURIComponent(friendId)}`,
			{ method: 'DELETE' }
		);
		const data = await response.json();
		if (!data.success) throw new Error(data.error || 'Failed to remove friend');
	}

	static async acceptFriendRequest(requestId: string): Promise<void> {
		const response = await ApiClient.authenticatedFetch(
			`/api/friends/request/${encodeURIComponent(requestId)}/accept`,
			{ method: 'PUT' }
		);
		const data = await response.json();
		if (!data.success)
			throw new Error(data.error || 'Failed to accept friend request');
	}

	static checkUserOnline(userId: string): boolean {
		return WebSocketService.getInstance().isUserOnline(userId);
	}
}
