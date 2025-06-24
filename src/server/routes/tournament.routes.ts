import { FastifyInstance } from 'fastify'
// import { TournamentController } from '../controllers/tournament.controller.js';
// import { AuthMiddleware } from '../middlewares/auth.middleware.js';

// export async function tournamentRoutes(fastify: FastifyInstance) {
//   fastify.get('/tournaments/:tournamentId', {
//     preHandler: AuthMiddleware.authenticateUser
//   }, TournamentController.getTournamentDetails);

//   fastify.get('/users/:userId/tournaments', {
//     preHandler: AuthMiddleware.authenticateUser
//   }, TournamentController.getUserTournaments);
// }