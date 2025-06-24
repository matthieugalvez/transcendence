import { FastifyRequest, FastifyReply } from 'fastify'
// // import { TournamentService } from '../services/tournament.service.js';
// import { ResponseUtils as Send } from '../utils/response.utils.js';

// export class TournamentController {
//   static async getTournamentDetails(request: FastifyRequest, reply: FastifyReply) {
//     try {
//       const { tournamentId } = request.params as { tournamentId: string };

//       const tournament = await TournamentService.getTournamentDetails(tournamentId);

//       if (!tournament) {
//         return Send.error(reply, 'Tournament not found', 404);
//       }

//       return Send.success(reply, tournament, 'Tournament details retrieved');
//     } catch (error) {
//       console.error('Error fetching tournament details:', error);
//       return Send.error(reply, 'Failed to fetch tournament details', 500);
//     }
//   }

//   static async getUserTournaments(request: FastifyRequest, reply: FastifyReply) {
//     try {
//       const { userId } = request.params as { userId: string };
//       const { limit = '10' } = request.query as { limit?: string };

//       const tournaments = await TournamentService.getUserTournaments(userId, parseInt(limit));

//       return Send.success(reply, tournaments, 'User tournaments retrieved');
//     } catch (error) {
//       console.error('Error fetching user tournaments:', error);
//       return Send.error(reply, 'Failed to fetch tournaments', 500);
//     }
//   }
// }