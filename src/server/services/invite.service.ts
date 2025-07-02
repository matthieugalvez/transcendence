import { prisma } from '../db.js';

export class InviteService {
	static async createInvite(gameId: string, inviterId: string, inviteeId: string, gameType: string = 'duo', ttlMs = 2 * 60 * 1000) {
		// Check if user is trying to invite themselves
		if (inviterId === inviteeId) {
			throw new Error('Cannot invite yourself');
		}

		// Check if there's already an active invite for this game
		const existingInvite = await prisma.gameInvite.findFirst({
			where: {
				gameId,
				inviteeId,
				status: 'pending',
				expiresAt: { gt: new Date() }
			}
		});

		if (existingInvite) {
			throw new Error('User already has a pending invite for this game');
		}

		const expiresAt = new Date(Date.now() + ttlMs);
		return prisma.gameInvite.create({
			data: { gameId, inviterId, inviteeId, status: 'pending', expiresAt, gameType }
		});
	}

	static async acceptInvite(inviteId: string) {
		return prisma.gameInvite.update({
			where: { id: inviteId },
			data: { status: 'accepted' }
		});
	}

	static async getSentInvites(userId: string) {
		return prisma.gameInvite.findMany({
			where: {
				inviterId: userId,
				status: 'pending',
				expiresAt: { gt: new Date() }
			},
			include: {
				inviter: true,
				invitee: true
			}
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
			where: {
				inviteeId: userId,
				status: 'pending',
				expiresAt: { gt: new Date() }
			},
			include: {
				inviter: true,
				invitee: true
			}
		});
	}

	static async getGameInvites(gameId: string) {
		return prisma.gameInvite.findMany({
			where: { gameId },
			include: {
				inviter: true,
				invitee: true
			}
		});
	}
}