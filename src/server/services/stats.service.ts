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
			console.log(`Creating match: ${gameId}, Winner: ${winnerId}, Type: ${matchType}`);

			// Check if match already exists to prevent duplicates
			const existingMatch = await prisma.match.findFirst({
				where: {
					playerOneId,
					playerTwoId,
					playerOneScore,
					playerTwoScore,
					matchType,
					createdAt: {
						gte: new Date(Date.now() - 10000) // Within last 10 seconds
					}
				}
			});

			if (existingMatch) {
				console.log('Match already exists, skipping creation and stats increment');
				return existingMatch;
			}

			// Generate a unique match ID to prevent duplicates
			const matchId = `${gameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			const match = await prisma.match.create({
				data: {
					id: matchId,
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

			// Only increment stats if we have a winner and the match was actually created
			if (winnerId && match) {
				console.log(`Incrementing stats: Winner ${winnerId}, Loser ${winnerId === playerOneId ? playerTwoId : playerOneId}`);

				// Use a transaction to ensure atomicity
				await prisma.$transaction(async (tx) => {
					// Increment win for winner
					const winField = matchType === 'ONE_V_ONE' ? 'oneVOneWins' : 'tournamentWins';
					await tx.userStats.upsert({
						where: { userId: winnerId },
						update: {
							[winField]: { increment: 1 }
						},
						create: {
							userId: winnerId,
							oneVOneWins: matchType === 'ONE_V_ONE' ? 1 : 0,
							oneVOneLosses: 0,
							tournamentWins: matchType === 'TOURNAMENT' ? 1 : 0,
							tournamentLosses: 0,
						}
					});

					// Increment loss for loser
					const loserId = winnerId === playerOneId ? playerTwoId : playerOneId;
					const lossField = matchType === 'ONE_V_ONE' ? 'oneVOneLosses' : 'tournamentLosses';
					await tx.userStats.upsert({
						where: { userId: loserId },
						update: {
							[lossField]: { increment: 1 }
						},
						create: {
							userId: loserId,
							oneVOneWins: 0,
							oneVOneLosses: matchType === 'ONE_V_ONE' ? 1 : 0,
							tournamentWins: 0,
							tournamentLosses: matchType === 'TOURNAMENT' ? 1 : 0,
						}
					});
				});

				console.log('Stats incremented successfully');
			}

			return match;
		} catch (error) {
			console.error('Error creating match:', error);
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