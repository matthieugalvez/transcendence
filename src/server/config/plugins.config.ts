import { FastifyInstance } from 'fastify'
import { join } from 'path'
import OAuth2, { OAuth2Namespace } from "@fastify/oauth2";
import { googleOAuth2Options } from './google.config.js';
import cookie from '@fastify/cookie'; // Add this import

export async function registerPlugins(app: FastifyInstance, dirname: string) {
	// Register cookie plugin globally
	await app.register(cookie, {
		secret: process.env.COOKIE_SECRET || 'your-cookie-secret', // Add cookie secret
		parseOptions: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax' // Changed from 'strict' for OAuth2 flow
		}
	})

	// Register static files
	await app.register(import('@fastify/static'), {
		root: join(dirname, '../../dist'),
		prefix: '/',
	})

	// SPA fallback - serve index.html for any non-API routes
	app.setNotFoundHandler(async (request, reply) => {
		// Only handle GET requests that don't start with /api
		if (request.method === 'GET' && !request.url.startsWith('/api')) {
			return reply.sendFile('index.html')
		}

		// For API routes or non-GET requests, return 404
		return reply.code(404).send({
			success: false,
			error: 'Route not found'
		})
	})

	// Add CORS if needed
	if (process.env.NODE_ENV !== 'production') {
		await app.register(import('@fastify/cors'), {
			origin: true,
			credentials: true
		})
	}

	// Register Google OAuth2
	await app.register(OAuth2, googleOAuth2Options)

	console.log('✅ Plugins registered')
}