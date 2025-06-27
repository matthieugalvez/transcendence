import { FastifyInstance } from 'fastify';
import { InviteController } from '../controllers/invite.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

export async function inviteRoutes(fastify : FastifyInstance) {
	fastify.post('/invite', {
		preHandler: AuthMiddleware.authenticateUser },
		InviteController.createInvite);
	fastify.post('/invite/:inviteId/accept', {
		preHandler: AuthMiddleware.authenticateUser },
		InviteController.acceptInvite);
	fastify.post('/invite/:inviteId/decline', {
		preHandler: AuthMiddleware.authenticateUser },
		InviteController.declineInvite);
	fastify.get('/invites', {
		preHandler: AuthMiddleware.authenticateUser },
		InviteController.getPendingInvites);
}