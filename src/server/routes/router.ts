import { FastifyInstance } from 'fastify'
import { registerPongWebSocket } from './game.routes.js'
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

// Import route modules
import healthRoutes from './health.routes.js'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'
import friendsRoutes from './friends.routes.js';
import { statsRoutes } from './stats.routes.js';

export async function registerRoutes(app: FastifyInstance) {
	// Health check routes (no prefix - accessible at root)
	await app.register(healthRoutes)

	// API routes with /api prefix
	await app.register(async function (fastify) {
		await fastify.register(authRoutes, { prefix: '/auth' })
		await fastify.register(userRoutes) // Remove /users prefix since it's already in the routes
		await fastify.register(registerPongWebSocket, { prefix: '/game' });
		await fastify.register(friendsRoutes);
		await fastify.register(statsRoutes);
	}, { prefix: '/api' })

    app.get('/avatars/:filename', async (request, reply) => {
        const { filename } = request.params as { filename: string };
        const avatarPath = path.join(process.cwd(), 'src/server/db/users', filename);

        try {
            if (fs.existsSync(avatarPath)) {
                return reply.sendFile(filename, path.join(process.cwd(), 'src/server/db/users'));
            } else {
                // Return default avatar if file doesn't exist
                return reply.sendFile('default.svg', path.join(process.cwd(), 'src/server/db/users'));
            }
        } catch (error) {
            return reply.code(404).send({ error: 'Avatar not found' });
        }
    });
}
