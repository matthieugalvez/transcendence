import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart'; // Add this import
import path from 'path';

export async function registerPlugins(app: FastifyInstance, __dirname: string) {
	console.log('🔌 Registering plugins...');

	// Register CORS
	await app.register(fastifyCors, {
		origin: process.env.NODE_ENV === 'production'
			? ['https://pong42.click']
			: ['http://localhost:5173', 'http://localhost:3000'],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	});

	// CRITICAL: Register multipart plugin for file uploads
	await app.register(fastifyMultipart, {
		limits: {
			fieldNameSize: 100,
			fieldSize: 100,
			fields: 10,
			fileSize: 5 * 1024 * 1024, // 5MB limit
			files: 1,
			headerPairs: 2000
		}
	});

	// Register static file serving
	await app.register(fastifyStatic, {
		root: path.join(process.cwd(), 'public'),
		prefix: '/public/',
	});

	console.log('✅ Plugins registered successfully');
}