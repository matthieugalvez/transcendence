import { router } from '../configs/simplerouter';

export class ApiClient {
  /**
   * Make authenticated API requests with automatic redirect on 401
   */
 static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    // If we get 401 Unauthorized, redirect to auth page (but only if not already on auth page)
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/auth') {
        console.warn('Authentication failed - redirecting to login');
        router.navigate('/auth');
      }
      throw new Error('Authentication required');
    }

    return response;
  }

  /**
   * Make API requests without automatic redirect (useful for auth checks)
   */
  static async silentFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
  }
}