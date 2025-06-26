import { FastifyRequest, FastifyReply } from 'fastify'
import { StatsService } from '../services/stats.service.js'
import { ResponseUtils as Send } from '../utils/response.utils.js'

export class StatsController {


	static async getUserStats(request: FastifyRequest, reply: FastifyReply) {
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
	}

	static async updateUserStats(request: FastifyRequest, reply: FastifyReply) {
		const { userId } = request.params as { userId: string };
		const stats = request.body as {
			oneVOneWins?: number;
			oneVOneLosses?: number;
			tournamentWins?: number;
			tournamentLosses?: number;
		};

		// Check if user is updating their own stats or is admin
		if ((request as any).userId !== userId) {
			return reply.code(403).send({ error: 'Cannot update other users stats' });
		}

		try {
			const updatedStats = await StatsService.updateUserStats(userId, stats);
			return updatedStats;
		} catch (error) {
			console.error('Failed to update user stats:', error);
			return reply.code(500).send({ error: 'Failed to update user stats' });
		}
	}

	static async getLeaderboard(request: FastifyRequest, reply: FastifyReply) {
		try {
			const leaderboard = await StatsService.getLeaderboard(10);
			return leaderboard;
		} catch (error) {
			console.error('Failed to fetch leaderboard:', error);
			return reply.code(500).send({ error: 'Failed to fetch leaderboard' });
		}
	}

	static async getUserMatches(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { userId } = request.params as { userId: string };
			const { limit = '10' } = request.query as { limit?: string };

			const matches = await StatsService.getUserMatchHistory(userId, parseInt(limit));

			return Send.success(reply, matches, 'Matches retrieved successfully');
		} catch (error) {
			console.error('Error fetching user matches:', error);
			return Send.error(reply, 'Failed to fetch matches', 500);
		}
	}

static async createMatch(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { gameId } = request.params as { gameId: string };
            const {
                playerOneId,
                playerTwoId,
                winnerId,
                matchType,
                playerOneScore,
                playerTwoScore
            } = request.body as {
                playerOneId: string;
                playerTwoId: string;
                winnerId: string | null;
                matchType: 'ONE_V_ONE' | 'TOURNAMENT';
                playerOneScore: number;
                playerTwoScore: number;
            };

            const match = await StatsService.createMatch(
                gameId,
                playerOneId,
                playerTwoId,
                winnerId,
                matchType,
                playerOneScore,
                playerTwoScore
            );

            return Send.success(reply, match, 'Match created successfully');
        } catch (error) {
            console.error('Error creating match:', error);
            return Send.error(reply, 'Failed to create match', 500);
        }
    }
}