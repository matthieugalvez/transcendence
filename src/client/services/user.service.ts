import { ApiClient } from '../utils/apiclient.utils';

export class UserService {

  static async GetLanguageFile(): Promise<{ success: boolean; message?: string; error?: string }> {

    try {
      const response = await fetch('/api/users/me/:language', {
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

  /**
   * Get current authenticated user data
   */
  static async getCurrentUser(): Promise<{ id: number; name: string; created_at: string }> {
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

  /**
   * Get all users (PROTECTED)
   */
  static async getAllUsers(): Promise<Array<{ id: number; name: string; created_at: string }>> {
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
}
