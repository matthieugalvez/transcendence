import { FastifyInstance } from 'fastify'
import { userSchema } from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { UserController } from '../controllers/user.controller'
import AuthMiddleware from '../middlewares/auth.middleware'
import { pipeline } from 'stream';
import { promisify } from 'util';
import { handleOnlineStatusWebsocket } from '../config/websocket.config'
import ws from 'ws';

const pump = promisify(pipeline);

export default async function userRoutes(fastify: FastifyInstance) {
	const server = fastify.server;
	const wss = new ws.Server({ server });
	wss.on('connection', (ws, req) => {
		handleOnlineStatusWebsocket(ws, req);
		// You can call other handlers here as needed
	});

	await fastify.register(import('@fastify/multipart'));
	// Get all users (protected)
	fastify.get('/users', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getAllUsers);

	// Get current user (protected)
	fastify.get('/users/me', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getCurrentUser);

	// Check if user exists
	fastify.get('/users/check/:name', UserController.checkUserExists);

	// Update display name (protected + validated)
	fastify.put('/me/display-name', {
		preHandler: [
			AuthMiddleware.authenticateUser,
			ValidationMiddleware.validateBody(userSchema.updateDisplayName)
		]
	}, UserController.changeUserName);

	// Update password (protected + validated)
	fastify.put('/me/password', {
		preHandler: [
			AuthMiddleware.authenticateUser,
			ValidationMiddleware.validateBody(userSchema.updatePassword)
		]
	}, UserController.changeUserPassword);

	fastify.post('/me/avatar', {
		preHandler:
			[AuthMiddleware.authenticateUser]
	}, UserController.uploadAvatar);

	fastify.get('/check-display-name', {
		preHandler: AuthMiddleware.authenticateUser
	}, UserController.checkDisplayNameAvailability);

	// fastify.get('/users/profile/:userId', {
	// 	preHandler: [AuthMiddleware.authenticateUser]
	// }, UserController.getUserProfile);

	fastify.get('/users/profile/:displayName', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getUserProfileByDisplayName);

	fastify.get('/users/search', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.searchUsers);

	fastify.get('/users/:userId/online', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getOnlineStatus);
}