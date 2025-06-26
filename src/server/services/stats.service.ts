import { prisma } from '../db.js'

export class StatsService {

	static async createMatch(
		gameId: string,
		playerOneId: string,
		playerTwoId: string,
		winnerId: string | null,
		matchType: 'ONE_V_ONE' | 'TOURNAMENT',
		playerOneScore: number,
		playerTwoScore: number
	) {
		try {
			// Create the match record
			const match = await prisma.match.create({
				data: {
					id: gameId, // Use gameId as the match ID
					playerOneId,
					playerTwoId,
					winnerId,
					matchType,
					playerOneScore,
					playerTwoScore,
					playedAt: new Date()
				},
				include: {
					playerOne: {
						select: {
							id: true,
							displayName: true,
							avatar: true
						}
					},
					playerTwo: {
						select: {
							id: true,
							displayName: true,
							avatar: true
						}
					}
				}
			});

			// Update user statistics for both players
			if (winnerId) {
				// Increment win for winner
				await this.incrementWin(winnerId, matchType);

				// Increment loss for loser
				const loserId = winnerId === playerOneId ? playerTwoId : playerOneId;
				await this.incrementLoss(loserId, matchType);
			}

			return match;
		} catch (error) {
			console.error('Error creating match:', error);
			throw error;
		}
	}
	static async getUserStats(userId: string) {
		try {
			const userStats = await prisma.userStats.findUnique({
				where: { userId }
			});

			if (!userStats) {
				// Create default stats if they don't exist
				return await prisma.userStats.create({
					data: {
						userId,
						oneVOneWins: 0,
						oneVOneLosses: 0,
						tournamentWins: 0,
						tournamentLosses: 0,
					}
				});
			}

			return userStats;
		} catch (error) {
			console.error('Error fetching user stats:', error);
			throw error;
		}
	}

	static async updateUserStats(userId: string, stats: {
		oneVOneWins?: number;
		oneVOneLosses?: number;
		tournamentWins?: number;
		tournamentLosses?: number;
	}) {
		try {
			return await prisma.userStats.upsert({
				where: { userId },
				update: stats,
				create: {
					userId,
					oneVOneWins: stats.oneVOneWins || 0,
					oneVOneLosses: stats.oneVOneLosses || 0,
					tournamentWins: stats.tournamentWins || 0,
					tournamentLosses: stats.tournamentLosses || 0,
				}
			});
		} catch (error) {
			console.error('Error updating user stats:', error);
			throw error;
		}
	}

	static async incrementWin(userId: string, matchType: 'ONE_V_ONE' | 'TOURNAMENT') {
		const field = matchType === 'ONE_V_ONE' ? 'oneVOneWins' : 'tournamentWins';

		return await prisma.userStats.upsert({
			where: { userId },
			update: {
				[field]: { increment: 1 }
			},
			create: {
				userId,
				oneVOneWins: matchType === 'ONE_V_ONE' ? 1 : 0,
				oneVOneLosses: 0,
				tournamentWins: matchType === 'TOURNAMENT' ? 1 : 0,
				tournamentLosses: 0,
			}
		});
	}

	static async incrementLoss(userId: string, matchType: 'ONE_V_ONE' | 'TOURNAMENT') {
		const field = matchType === 'ONE_V_ONE' ? 'oneVOneLosses' : 'tournamentLosses';

		return await prisma.userStats.upsert({
			where: { userId },
			update: {
				[field]: { increment: 1 }
			},
			create: {
				userId,
				oneVOneWins: 0,
				oneVOneLosses: matchType === 'ONE_V_ONE' ? 1 : 0,
				tournamentWins: 0,
				tournamentLosses: matchType === 'TOURNAMENT' ? 1 : 0,
			}
		});
	}

	static async getUserMatchHistory(userId: string, limit: number = 5) {
		try {
			const matches = await prisma.match.findMany({
				where: {
					OR: [
						{ playerOneId: userId },
						{ playerTwoId: userId }
					]
				},
				include: {
					playerOne: {
						select: {
							id: true,
							displayName: true,
							avatar: true
						}
					},
					playerTwo: {
						select: {
							id: true,
							displayName: true,
							avatar: true
						}
					}
				},
				orderBy: {
					playedAt: 'desc'
				},
				take: limit
			});

			return matches;
		} catch (error) {
			console.error('Error fetching match history:', error);
			throw error;
		}
	}


	static async getLeaderboard(limit: number = 10) {
		try {
			const leaderboard = await prisma.userStats.findMany({
				include: {
					user: {
						select: {
							id: true,
							displayName: true,
							avatar: true
						}
					}
				},
				orderBy: [
					{
						oneVOneWins: 'desc'
					},
					{
						tournamentWins: 'desc'
					}
				],
				take: limit
			});

			// Transform data to include user info at top level
			return leaderboard.map(stats => ({
				...stats.user,
				avatar: stats.user.avatar
					? (stats.user.avatar.startsWith('/avatars/') ? stats.user.avatar : `/avatars/${stats.user.avatar}`)
					: '/avatars/default.svg',
				oneVOneWins: stats.oneVOneWins,
				oneVOneLosses: stats.oneVOneLosses,
				tournamentWins: stats.tournamentWins,
				tournamentLosses: stats.tournamentLosses,
				totalWins: stats.oneVOneWins + stats.tournamentWins,
				totalLosses: stats.oneVOneLosses + stats.tournamentLosses
			}));
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			throw error;
		}
	}

	static async createTournament(payload: {
		tournamentId: string
		participants: string[]
		winnerId: string
		matches: {
			playerOneId: string
			playerTwoId: string
			playerOneScore: number
			playerTwoScore: number
			winnerId: string
		}[]
	}) {
		await prisma.$transaction(async tx => {
			await tx.tournament.create({
				data: {
					id: payload.tournamentId,
					winnerId: payload.winnerId,
					participants: {
						createMany: {
							data: payload.participants.map(id => ({ userId: id }))
						}
					}
				}
			})

			// matchs
			for (const m of payload.matches) {
				await tx.match.create({
					data: {
						playerOneId: m.playerOneId,
						playerTwoId: m.playerTwoId,
						winnerId: m.winnerId,
						matchType: 'TOURNAMENT',
						playerOneScore: m.playerOneScore,
						playerTwoScore: m.playerTwoScore,
						tournamentId: payload.tournamentId
					}
				})
			}
		});
		// stats gagnant/perdants
			await Promise.all(
				payload.participants.map(uid =>
					uid === payload.winnerId
						? this.incrementWin(uid, 'TOURNAMENT')
						: this.incrementLoss(uid, 'TOURNAMENT')
				)
			);
	}

	static async getUserTournament(userId: string, limit = 5) {
		return prisma.tournament.findMany({
			where: { participants: { some: { userId } } },
			include: {
				participants: { include: { user: true } },
				winner: true,
				matches: true
			},
			orderBy: { playedAt: 'desc' },
			take: limit
		})
	}
}