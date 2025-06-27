import { InviteService } from '../services/invite.service.js';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'


export class InviteController {
	static async createInvite(request: FastifyRequest, reply: FastifyReply) {
		// Try both userId and user.id for compatibility
		const inviterId = (request as any).userId || ((request as any).user && (request as any).user.id);
		const { gameId, inviteeId } = request.body as any; // Use body, not params, for POST
		if (!inviterId) {
			return reply.code(401).send({ success: false, error: 'Unauthorized' });
		}
		const invite = await InviteService.createInvite(gameId, inviterId, inviteeId);
		reply.send({ success: true, invite });
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