import { FastifyInstance } from 'fastify'
import { StatsService } from '../services/stats.service'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export async function statsRoutes(fastify: FastifyInstance) {
    // Get user stats (public route - can view anyone's stats)
    fastify.get('/users/:userId/stats', async (request, reply) => {
        const { userId } = request.params as { userId: string };

        try {
            const [userStats, matchHistory] = await Promise.all([
                StatsService.getUserStats(userId),
                StatsService.getUserMatchHistory(userId, 5)
            ]);

            return {
                ...userStats,
                matchHistory
            };
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            return reply.code(500).send({ error: 'Failed to fetch user stats' });
        }
    });


    // Update user stats (protected route - requires authentication)
    fastify.put('/users/:userId/stats', {
        preHandler: AuthMiddleware.authenticateUser
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const stats = request.body as {
            oneVOneWins?: number;
            oneVOneLosses?: number;
            tournamentWins?: number;
            tournamentLosses?: number;
        };

        // Check if user is updating their own stats or is admin
        if (request.userId !== userId) {
            return reply.code(403).send({ error: 'Cannot update other users stats' });
        }

        try {
            const updatedStats = await StatsService.updateUserStats(userId, stats);
            return updatedStats;
        } catch (error) {
            console.error('Failed to update user stats:', error);
            return reply.code(500).send({ error: 'Failed to update user stats' });
        }
    });

    fastify.get('/leaderboard', async (request, reply) => {
        try {
            const leaderboard = await StatsService.getLeaderboard(10);
            return leaderboard;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return reply.code(500).send({ error: 'Failed to fetch leaderboard' });
        }
    });
}