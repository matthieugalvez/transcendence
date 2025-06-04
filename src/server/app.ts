import Fastify from 'fastify';
import authRoutes from '@routes/auth.routes';
import userRoutes from '@routes/user.routes';
import appConfig from '@config/app.config';
import { registerDb } from './database/database';
import "tsconfig-paths/register"
import "dotenv/config"

// Create Fastify instance
const app = Fastify({
    logger: true
});

// Setup server with all plugins and routes
async function setupServer() {
    // Register CORS
    await app.register(import('@fastify/cors'), {
        origin: [
            'http://localhost:3000',
            'https://mywebsite.com'
        ],
        methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
        credentials: true
    });

    // Register cookie support
    await app.register(import('@fastify/cookie'));

    // Initialize database connection
    await registerDb(app);

    // Register routes with prefixes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/user' });
	await app.register(healthRoutes, { prefix: '/api/health'})
}

// Start the server
const start = async () => {
    try {
        await setupServer();
        const { port, host } = appConfig;

        await app.listen({ port, host });
        console.log(`🚀 Server running on http://${host}:${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();

export default app;