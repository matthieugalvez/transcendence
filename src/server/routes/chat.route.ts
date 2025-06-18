import { FastifyInstance } from 'fastify'
import { ChatController } from '../controllers/chat.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

export default async function	chatRoutes(fastify: FastifyInstance) {
	fastify.get('/send-messages', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.getSendMessages);

	fastify.get('/received-messages', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.getReceivedMessages);

	fastify.post('/post', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.postMessage);

	fastify.post('/edit', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.editMessage);
}
