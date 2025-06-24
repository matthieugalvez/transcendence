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
            console.log('🖼️ Avatar request for:', filename);

            // Validate filename for security
            if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                console.log('❌ Invalid filename:', filename);
                return reply.code(400).send({ error: 'Invalid filename' });
            }

            const uploadDir = process.env.AVATAR_UPLOAD_DIR || '/app/uploads/avatars';
            const filePath = path.join(uploadDir, filename);

            console.log('🔍 Looking for avatar at:', filePath);
            console.log('📁 Upload directory:', uploadDir);

            // Check if upload directory exists
            if (!fs.existsSync(uploadDir)) {
                console.log('❌ Upload directory does not exist:', uploadDir);
                return reply.code(404).send({ error: 'Upload directory not found' });
            }

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log('❌ Avatar file not found:', filePath);

                // List files for debugging
                try {
                    const files = fs.readdirSync(uploadDir);
                    console.log('📋 Files in upload directory:', files);
                } catch (listError) {
                    console.log('❌ Could not list directory contents:', listError);
                }

                return reply.code(404).send({ error: 'Avatar not found' });
            }

            // Get file stats
            const stats = fs.statSync(filePath);
            console.log('✅ File found, size:', stats.size);

            // Determine content type from extension
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';

            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.svg':
                    contentType = 'image/svg+xml';
                    break;
                case '.webp':
                    contentType = 'image/webp';
                    break;
            }

            // Set proper headers
            reply.header('Content-Type', contentType);
            reply.header('Content-Length', stats.size);
            reply.header('Cache-Control', 'public, max-age=86400'); // 1 day cache
            reply.header('Last-Modified', stats.mtime.toUTCString());
            reply.header('Accept-Ranges', 'bytes');

            console.log('📤 Serving avatar with content-type:', contentType);

            // Create read stream and send file
            const stream = fs.createReadStream(filePath);

            // Handle stream errors
            stream.on('error', (streamError) => {
                console.error('❌ Stream error:', streamError);
                if (!reply.sent) {
                    reply.code(500).send({ error: 'Failed to read file' });
                }
            });

            return reply.send(stream);

        } catch (error) {
            console.error('❌ Avatar serving error:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

}
