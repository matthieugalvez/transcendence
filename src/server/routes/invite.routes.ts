import { InviteController } from '../controllers/invite.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function inviteRoutes(fastify) {
	fastify.post('/invite', {
		preHandler: authMiddleware },
		InviteController.createInvite);
	fastify.post('/invite/:inviteId/accept', {
		preHandler: authMiddleware },
		InviteController.acceptInvite);
	fastify.post('/invite/:inviteId/decline', {
		preHandler: authMiddleware },
		InviteController.declineInvite);
	fastify.get('/invites', {
		preHandler: authMiddleware },
		InviteController.getPendingInvites);
}