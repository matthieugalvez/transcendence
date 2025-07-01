import { prisma } from '../db.js';
import { InviteService } from './invite.service.js';
import { getGameRoom, removeGameRoom } from '../game/gameRooms.js';
import { getTournamentRoom, removeTournamentRoom } from '../game/tournamentRooms.js';

export class GameCleanupService {
    static async cleanupGameAndInvites(gameId: string, userId: string) {
        console.log(`Cleaning up game ${gameId} for user ${userId}`);

        try {
            // 1. Get all invites for this game where user is the inviter
            const invites = await prisma.gameInvite.findMany({
                where: {
                    gameId,
                    inviterId: userId,
                    status: 'pending'
                }
            });

            // 2. Cancel all pending invites
            if (invites.length > 0) {
                await prisma.gameInvite.updateMany({
                    where: {
                        gameId,
                        inviterId: userId,
                        status: 'pending'
                    },
                    data: {
                        status: 'cancelled'
                    }
                });
                console.log(`Cancelled ${invites.length} pending invites for game ${gameId}`);
            }

            // 3. Check if there are any other active players in the game
            const gameRoom = getGameRoom(gameId);
            const tournamentRoom = getTournamentRoom(gameId);

            let hasOtherPlayers = false;

            if (gameRoom) {
                // Check if there are other connected players
                hasOtherPlayers = gameRoom.players.some(p => p.ws && p.username !== userId);
            }

            if (tournamentRoom) {
                // Check if there are other connected players
                hasOtherPlayers = tournamentRoom.players.some(p => p.ws && p.username !== userId);
            }

            // 4. If no other players, remove the game room
            if (!hasOtherPlayers) {
                if (gameRoom) {
                    removeGameRoom(gameId);
                    console.log(`Removed duo game room ${gameId}`);
                }

                if (tournamentRoom) {
                    removeTournamentRoom(gameId);
                    console.log(`Removed tournament room ${gameId}`);
                }
            }

            return {
                success: true,
                cancelledInvites: invites.length,
                gameRoomRemoved: !hasOtherPlayers
            };

        } catch (error) {
            console.error('Error cleaning up game:', error);
            throw error;
        }
    }

    static async cleanupExpiredInvites() {
        try {
            const result = await prisma.gameInvite.updateMany({
                where: {
                    status: 'pending',
                    expiresAt: { lt: new Date() }
                },
                data: {
                    status: 'expired'
                }
            });

            if (result.count > 0) {
                console.log(`Cleaned up ${result.count} expired invites`);
            }

            return result.count;
        } catch (error) {
            console.error('Error cleaning up expired invites:', error);
            throw error;
        }
    }
}