import { router } from '../configs/simplerouter';

export class ApiClient {

	private static getBaseUrl(): string {
		// In production, API calls should go through the same host as the page
		// In development, Vite proxy handles this
		return '';
	}

	static async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
		const url = `${this.getBaseUrl()}${endpoint}`;
		//console.log('API request:', url);

		return fetch(url, {
			credentials: 'include', // Always include cookies
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});
	}
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
