import { prisma } from '../db';

// export class TournamentService {
//   static async createTournament(gameId: string, playerIds: string[]): Promise<any> {
//     try {
//       const tournament = await prisma.tournament.create({
//         data: {
//           gameId,
//           players: {
//             create: playerIds.map((playerId, index) => ({
//               playerId,
//               position: index + 1
//             }))
//           }
//         },
//         include: {
//           players: {
//             include: {
//               player: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               }
//             }
//           }
//         }
//       });

//       return tournament;
//     } catch (error) {
//       console.error('Error creating tournament:', error);
//       throw error;
//     }
//   }

//   static async createTournamentMatch(
//     tournamentId: string,
//     gameId: string,
//     playerOneId: string,
//     playerTwoId: string,
//     winnerId: string | null,
//     playerOneScore: number,
//     playerTwoScore: number,
//     round: number
//   ): Promise<any> {
//     try {
//       const match = await prisma.match.create({
//         data: {
//           id: gameId,
//           playerOneId,
//           playerTwoId,
//           winnerId,
//           matchType: 'TOURNAMENT',
//           tournamentId,
//           tournamentRound: round,
//           playerOneScore,
//           playerTwoScore,
//           playedAt: new Date()
//         },
//         include: {
//           playerOne: {
//             select: {
//               id: true,
//               displayName: true,
//               avatar: true
//             }
//           },
//           playerTwo: {
//             select: {
//               id: true,
//               displayName: true,
//               avatar: true
//             }
//           }
//         }
//       });

//       // Update user stats
//       if (winnerId) {
//         await StatsService.incrementWin(winnerId, 'TOURNAMENT');
//         const loserId = winnerId === playerOneId ? playerTwoId : playerOneId;
//         await StatsService.incrementLoss(loserId, 'TOURNAMENT');
//       }

//       return match;
//     } catch (error) {
//       console.error('Error creating tournament match:', error);
//       throw error;
//     }
//   }

//   static async finishTournament(tournamentId: string, winnerId: string): Promise<any> {
//     try {
//       const tournament = await prisma.tournament.update({
//         where: { id: tournamentId },
//         data: {
//           status: 'COMPLETED',
//           finishedAt: new Date(),
//           winnerId
//         }
//       });

//       // Update final rankings
//       await this.updateTournamentRankings(tournamentId, winnerId);

//       return tournament;
//     } catch (error) {
//       console.error('Error finishing tournament:', error);
//       throw error;
//     }
//   }

//   static async getTournamentDetails(tournamentId: string): Promise<any> {
//     try {
//       const tournament = await prisma.tournament.findUnique({
//         where: { id: tournamentId },
//         include: {
//           players: {
//             include: {
//               player: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               }
//             },
//             orderBy: {
//               position: 'asc'
//             }
//           },
//           matches: {
//             include: {
//               playerOne: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               },
//               playerTwo: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               }
//             },
//             orderBy: {
//               tournamentRound: 'asc'
//             }
//           },
//           winner: {
//             select: {
//               id: true,
//               displayName: true,
//               avatar: true
//             }
//           }
//         }
//       });

//       return tournament;
//     } catch (error) {
//       console.error('Error getting tournament details:', error);
//       throw error;
//     }
//   }

//   static async getUserTournaments(userId: string, limit: number = 10): Promise<any[]> {
//     try {
//       const tournaments = await prisma.tournament.findMany({
//         where: {
//           players: {
//             some: {
//               playerId: userId
//             }
//           },
//           status: 'COMPLETED'
//         },
//         include: {
//           players: {
//             include: {
//               player: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               }
//             }
//           },
//           matches: {
//             include: {
//               playerOne: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               },
//               playerTwo: {
//                 select: {
//                   id: true,
//                   displayName: true,
//                   avatar: true
//                 }
//               }
//             }
//           },
//           winner: {
//             select: {
//               id: true,
//               displayName: true,
//               avatar: true
//             }
//           }
//         },
//         orderBy: {
//           finishedAt: 'desc'
//         },
//         take: limit
//       });

//       return tournaments;
//     } catch (error) {
//       console.error('Error getting user tournaments:', error);
//       return [];
//     }
//   }

//   private static async updateTournamentRankings(tournamentId: string, winnerId: string): Promise<void> {
//     // This would implement the logic to assign final rankings based on tournament results
//     // For now, just mark the winner as rank 1
//     await prisma.tournamentPlayer.update({
//       where: {
//         tournamentId_playerId: {
//           tournamentId,
//           playerId: winnerId
//         }
//       },
//       data: {
//         finalRank: 1
//       }
//     });
//   }
// }