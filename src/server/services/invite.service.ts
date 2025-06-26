import { prisma } from '../db.js';

export class InviteService {
  static async createInvite(gameId: string, inviterId: string, inviteeId: string, ttlMs = 10 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + ttlMs);
    return prisma.gameInvite.create({
      data: { gameId, inviterId, inviteeId, status: 'pending', expiresAt }
    });
  }

  static async acceptInvite(inviteId: string) {
    return prisma.gameInvite.update({
      where: { id: inviteId },
      data: { status: 'accepted' }
    });
  }

  static async declineInvite(inviteId: string) {
    return prisma.gameInvite.update({
      where: { id: inviteId },
      data: { status: 'declined' }
    });
  }

  static async getPendingInvites(userId: string) {
    return prisma.gameInvite.findMany({
      where: { inviteeId: userId, status: 'pending', expiresAt: { gt: new Date() } }
    });
  }
}