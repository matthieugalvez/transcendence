import { FastifyInstance } from 'fastify'
import { ChatController } from '../controllers/chat.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

export default async function	chatRoutes(fastify: FastifyInstance) {
	fastify.post('/messages', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.getMessages);

	fastify.post('/post', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.postMessage);

	fastify.post('/edit', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.editMessage);

	fastify.delete('/delete', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.deleteMessage);
}
