import { FastifyRequest, FastifyReply } from 'fastify';
import { InviteService } from '../services/invite.service.js';
import { ResponseUtils as Send } from '../utils/response.utils.js';

export class InviteController {

	static async getSentInvites(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const invites = await InviteService.getSentInvites(userId);
			reply.send({ success: true, invites });
		} catch (error: any) {
			console.error('Get sent invites error:', error);
			return Send.internalError(reply, error?.message || 'Failed to get sent invites');
		}
	}

	static async createInvite(request: FastifyRequest, reply: FastifyReply) {
		try {
			const inviterId = (request as any).userId || ((request as any).user && (request as any).user.id);
			const { gameId, inviteeId, gameType } = request.body as any;

			if (!inviterId) {
				return reply.code(401).send({ success: false, error: 'Unauthorized' });
			}

			const invite = await InviteService.createInvite(gameId, inviterId, inviteeId, gameType || 'duo');
			reply.send({ success: true, invite });
		} catch (error: any) {
			console.error('Create invite error:', error);

			// Handle specific error types
			if (error?.message === 'Cannot invite yourself') {
				return reply.code(400).send({ success: false, error: 'Cannot invite yourself' });
			}
			if (error?.message === 'User already has a pending invite for this game') {
				return reply.code(409).send({ success: false, error: 'User already invited to this game' });
			}

			reply.code(500).send({ success: false, error: 'Failed to create invite' });
		}
	}

	static async getPendingInvites(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const invites = await InviteService.getPendingInvites(userId);
			reply.send({ success: true, invites });
		} catch (error: any) {
			console.error('Get invites error:', error);
			return Send.internalError(reply, error?.message || 'Failed to get invites');
		}
	}

	static async acceptInvite(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { inviteId } = request.params as { inviteId: string };
			const invite = await InviteService.acceptInvite(inviteId);
			reply.send({ success: true, invite });
		} catch (error: any) {
			console.error('Accept invite error:', error);
			reply.code(500).send({ success: false, error: error?.message || 'Failed to accept invite' });
		}
	}

	static async declineInvite(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { inviteId } = request.params as { inviteId: string };
			const invite = await InviteService.declineInvite(inviteId);
			reply.send({ success: true, invite });
		} catch (error: any) {
			console.error('Decline invite error:', error);
			reply.code(500).send({ success: false, error: error?.message || 'Failed to decline invite' });
		}
	}
}