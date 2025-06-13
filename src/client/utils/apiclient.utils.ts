import { router } from '../configs/simplerouter';

export class ApiClient {
  /**
   * Make authenticated API requests with automatic redirect on 401
   */
    static async authenticatedFetch(url: string, options: RequestInit = {}) {
        let response = await fetch(url, { ...options, credentials: 'include' });

        if (response.status === 401) {
            // Try refresh
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            if (refreshResponse.ok) {
                response = await fetch(url, { ...options, credentials: 'include' });
            } else {
                window.location.href = '/auth';
            }
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