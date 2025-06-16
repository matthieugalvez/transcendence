const authConfig = {
	secret: process.env.AUTH_SECRET as string,
	secret_expires_in: process.env.AUTH_SECRET_EXPIRES_IN as string,
	refresh_secret: process.env.AUTH_REFRESH_SECRET as string,
	refresh_secret_expires_in: process.env.AUTH_REFRESH_SECRET_EXPIRES_IN as string
}

// Debug: Check if environment variables are loaded
console.log('🔧 Auth config loaded:', {
	secret: authConfig.secret ? '***SET***' : 'MISSING',
	secret_expires_in: authConfig.secret_expires_in || 'MISSING',
	refresh_secret: authConfig.refresh_secret ? '***SET***' : 'MISSING',
	refresh_secret_expires_in: authConfig.refresh_secret_expires_in || 'MISSING'
});

if (!authConfig.secret) {
	console.error('❌ CRITICAL: AUTH_SECRET environment variable is missing!');
}

export default authConfig;