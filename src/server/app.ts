import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerDb } from './db.js';
import { registerPlugins } from './config/plugins.config.js';
import { registerRoutes } from './routes/router.js';
import { registerPongWebSocket } from './routes/game.routes.js';
import { registerUserStatusWebSocket } from './routes/users.routes.js';
import { GameCleanupService } from './services/gamecleanup.service.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create Fastify instance with proper configuration
const app = Fastify({
	logger: false,//{
	//   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	//  },
	trustProxy: true,
	bodyLimit: 10 * 1024 * 1024, // 10MB limit for file uploads
});

// Register essential plugins first (before any other setup)
await app.register(fastifyWebsocket);

// Register cookie plugin once at the top level
await app.register(import('@fastify/cookie'), {
	secret: process.env.COOKIE_SECRET || 'your-cookie-secret',
	parseOptions: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax'
	}
});

// Server setup function - DO NOT call listen here
async function setupServer() {
	try {
		console.log('🔧 Setting up server...');

		// Register everything BEFORE starting to listen
		await registerDb(app);
		await registerPlugins(app, __dirname);
		await registerRoutes(app);
		await registerPongWebSocket(app);
		await registerUserStatusWebSocket(app);

		console.log('✅ Server setup completed');
	} catch (error) {
		console.error('❌ Server setup failed:', error);
		throw error;
	}
}

setInterval(async () => {
	try {
		await GameCleanupService.cleanupExpiredInvites();
	} catch (error) {
		console.error('Error during periodic cleanup:', error);
	}
}, 5 * 60 * 1000);

// Start server function - call listen here
async function start() {
	try {
		// Setup everything first
		await setupServer();

		// Only AFTER setup is complete, start listening
		const port = Number(process.env.PORT) || 3000;
		const host = process.env.HOST || '0.0.0.0';

		await app.listen({ port, host });
		console.log(`🚀 Server running on http://${host}:${port}`);
		console.log(`🎮 Production mode: ${process.env.NODE_ENV === 'production'}`);

		// Debug routes after server is ready
		console.log('🔍 Registered routes:');
		app.printRoutes();
	} catch (error) {
		app.log.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Start the server
start();

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('\n🛑 Shutting down...')
	await app.close()
	process.exit(0)
})
