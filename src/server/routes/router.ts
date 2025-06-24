import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
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

    app.get('/avatars/:filename', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { filename } = request.params as { filename: string };

            // Security check - prevent directory traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return reply.code(400).send({ error: 'Invalid filename' });
            }

            const uploadDir = process.env.AVATAR_UPLOAD_DIR || '/app/uploads/avatars';
            const filePath = path.join(uploadDir, filename);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                // Return default avatar if file doesn't exist
                const defaultAvatarPath = path.join(process.cwd(), 'src/server/db/users/default.svg');
                if (fs.existsSync(defaultAvatarPath)) {
                    return reply.sendFile('default.svg', path.join(process.cwd(), 'src/server/db/users'));
                } else {
                    return reply.code(404).send({ error: 'Avatar not found' });
                }
            }

            // Serve the file
            return reply.sendFile(filename, uploadDir);
        } catch (error) {
            console.error('Avatar serving error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
