import { InviteService } from '../services/invite.service.js';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'


export class InviteController {
	
	static async createInvite(request: FastifyRequest, reply: FastifyReply) {
		try {
			const inviterId = (request as any).userId || ((request as any).user && (request as any).user.id);
			const { gameId, inviteeId, gameType } = request.body as any;

			if (!inviterId) {
				return reply.code(401).send({ success: false, error: 'Unauthorized' });
			}

			const invite = await InviteService.createInvite(gameId, inviterId, inviteeId, gameType || 'duo');
			reply.send({ success: true, invite });
		} catch (error) {
			console.error('Error creating invite:', error);

			// Handle specific error types
			if (error.message === 'Cannot invite yourself') {
				return reply.code(400).send({ success: false, error: 'Cannot invite yourself' });
			}
			if (error.message === 'User already has a pending invite for this game') {
				return reply.code(409).send({ success: false, error: 'User already invited to this game' });
			}

			reply.code(500).send({ success: false, error: 'Failed to create invite' });
		}
	}

	static async acceptInvite(request: FastifyRequest, reply: FastifyReply) {
		const { inviteId } = (request as any).params;
		await InviteService.acceptInvite(inviteId);
		reply.send({ success: true });
	}

	static async declineInvite(request: FastifyRequest, reply: FastifyReply) {
		const { inviteId } = (request as any).params;
		await InviteService.declineInvite(inviteId);
		reply.send({ success: true });
	}

	static async getPendingInvites(request: FastifyRequest, reply: FastifyReply) {
		const userId = (request as any).userId; // Use userId, not user.id
		if (!userId) {
			return reply.code(401).send({ success: false, error: 'Unauthorized' });
		}
		const invites = await InviteService.getPendingInvites(userId);
		reply.send({ success: true, invites });
	}
}