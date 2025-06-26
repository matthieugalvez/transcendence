import { InviteService } from '../services/invite.service.js';
import { FastifyRequest, FastifyReply } from 'fastify'


export class InviteController {
  static async createInvite(request: FastifyRequest & { user: { id: string } }, reply: FastifyReply) {
    const { gameId, inviteeId } = request.params as any;
    const inviterId = request.user.id;
    const invite = await InviteService.createInvite(gameId, inviterId, inviteeId);
    reply.send({ success: true, invite });
  }

  static async acceptInvite(request: FastifyRequest<{ Params: { inviteId: string } }>, reply: FastifyReply) {
    const { inviteId } = request.params;
    await InviteService.acceptInvite(inviteId);
    reply.send({ success: true });
  }

  static async declineInvite(request: FastifyRequest<{ Params: { inviteId: string } }>, reply: FastifyReply) {
    const { inviteId } = request.params;
    await InviteService.declineInvite(inviteId);
    reply.send({ success: true });
  }

  static async getPendingInvites(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const invites = await InviteService.getPendingInvites(userId);
    reply.send({ success: true, invites });
  }
}