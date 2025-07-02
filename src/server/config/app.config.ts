interface AppConfig {
	port: number;
	host: string;
	protocol: 'http' | 'https';
	baseUrl: string;
	clientUrl: string;
	isDevelopment: boolean;
	isProduction: boolean;
}

const createAppConfig = (): AppConfig => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	const isProduction = process.env.NODE_ENV === 'production';

	// Server configuration
	const port = parseInt(process.env.PORT || '3000');
	const host = process.env.HOST || 'localhost';

	// Base URL (where the API is accessible from outside)
	const baseUrl = process.env.BASE_URL || (isProduction ? 'https://pong42.click' : 'http://localhost:3000');
	const clientUrl = process.env.CLIENT_URL || (isProduction ? 'https://pong42.click' : 'http://localhost:5173');

	const protocol = baseUrl.startsWith('https') ? 'https' : 'http';

	return {
		port,
		host,
		protocol,
		baseUrl,
		clientUrl,
		isDevelopment,
		isProduction
	};
};

export const appConfig = createAppConfig();

// Helper function to get redirect URL for auth flows
export const getAuthRedirectUrl = (path: string): string => {
	return `${appConfig.clientUrl}${path}`;
};