import { FastifyInstance } from 'fastify'
import { ChatController } from '../controllers/chat.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

export default async function	chatRoutes(fastify: FastifyInstance) {
	fastify.get('/chat/:send-messages', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.getSendMessages);

	fastify.get('/chat/:recieved-messages', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.getRecievedMessages);

	fastify.post('/chat/:post', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.postMessage)

	fastify.post('/chat/:edit', {
		preHandler: AuthMiddleware.authenticateUser
	}, ChatController.editMessage)
}
