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
import chatRoutes from './chat.route.js'
import { tournamentRoutes } from './tournament.routes.js';
import { statsRoutes } from './stats.routes.js';
import { inviteRoutes } from './invite.routes.js';

export async function registerRoutes(app: FastifyInstance) {

	// API routes with /api prefix
	await app.register(async function (fastify) {
		await app.register(healthRoutes)
		await fastify.register(authRoutes, { prefix: '/auth' })
		await fastify.register(userRoutes)
		await fastify.register(registerPongWebSocket, { prefix: '/game' });
		await fastify.register(chatRoutes, { prefix: '/chat' });
		await fastify.register(friendsRoutes)
		await fastify.register(statsRoutes);
        await fastify.register(tournamentRoutes);
		await fastify.register(inviteRoutes);
	}, { prefix: '/api' })
app.get('/avatars/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };

    // Use different paths for development vs production
    let avatarDir: string;

    if (process.env.NODE_ENV === 'production') {
        // In Docker container, use the uploaded avatars directory
        avatarDir = process.env.AVATAR_UPLOAD_DIR || '/app/uploads/avatars';
    } else {
        // In development, use the source directory
        avatarDir = path.join(process.cwd(), 'src/server/db/users');
    }

    const avatarPath = path.join(avatarDir, filename);

    console.log('🔍 Avatar request:', {
        filename,
        avatarDir,
        avatarPath,
        nodeEnv: process.env.NODE_ENV,
        exists: fs.existsSync(avatarPath)
    });

    try {
        if (fs.existsSync(avatarPath)) {
            console.log('✅ Serving avatar from:', avatarPath);
            return reply.sendFile(filename, avatarDir);
        } else {
            console.log('❌ Avatar not found, trying default');

            // Try default from the same directory first
            const defaultPath = path.join(avatarDir, 'default');
            if (fs.existsSync(defaultPath)) {
                console.log('✅ Serving default avatar from:', defaultPath);
                return reply.sendFile('default', avatarDir);
            } else {
                // Fallback to development path for default avatar
                const devDefaultPath = path.join(process.cwd(), 'src/server/db/users', 'default');
                if (fs.existsSync(devDefaultPath)) {
                    console.log('✅ Serving default avatar from dev path:', devDefaultPath);
                    return reply.sendFile('default', path.join(process.cwd(), 'src/server/db/users'));
                } else {
                    console.log('❌ Default avatar not found anywhere');
                    return reply.code(404).send({ error: 'Avatar not found' });
                }
            }
        }
    } catch (error) {
        console.error('❌ Avatar serving error:', error);
        return reply.code(404).send({ error: 'Avatar not found' });
    }
});
}
