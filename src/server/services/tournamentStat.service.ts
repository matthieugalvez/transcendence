import { prisma } from '../db';
import { incrementWin, incrementLoss } from "./stats.service";

export class TournamentStatService {
    static async createTournament(payload: {
        tournamentId: string
        participants: string[]
        winnerId: string
        matches: {
            playerOneId: string
            playerTwoId: string
            playerOneScore: number
            playerTwoscore: number
            winnerId: string
        }[]
    }) {
        return prisma.$transaction(async tx => {
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
                        playerTwoScore: m.playerTwoscore,
                        tournamentId: payload.tournamentId
                    }
                })
            }

            // stats gagnant/perdants
            await Promise.all(
                payload.participants.map(uid =>
                    uid === payload.winnerId
                        ? incrementWin(uid, 'TOURNAMENT')
                        : incrementLoss(uid, 'TOURNAMENT')
                )
            )
        })
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