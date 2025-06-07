export class UserService {
  /**
   * Get current authenticated user data
   */
  static async getCurrentUser(): Promise<{ id: number; name: string; created_at: string }> {
    try {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
   * Check if a user exists by name
   */
  static async checkUserExists(name: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/check/${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      return data.success && data.data.exists === true;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  /**
   * Get all users (if needed for leaderboards, etc.)
   */
  static async getAllUsers(): Promise<Array<{ id: number; name: string; created_at: string }>> {
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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