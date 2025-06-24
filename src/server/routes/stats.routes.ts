import type { FastifyInstance } from 'fastify';
import { StatsController } from '../controllers/stats.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js'


export async function statsRoutes(fastify: FastifyInstance) {
	// Get user stats (public route - can view anyone's stats)
	fastify.get('/users/:userId/stats', {
		preHandler: AuthMiddleware.authenticateUser
	}, StatsController.getUserStats);

	// Update user stats (protected route - requires authentication)
	fastify.put('/users/:userId/stats', {
		preHandler: AuthMiddleware.authenticateUser
	}, StatsController.updateUserStats);

	// Get leaderboard (public route)
	fastify.get('/leaderboard',{
		preHandler: AuthMiddleware.authenticateUser
	}, StatsController.getLeaderboard);

	fastify.get('/users/:userId/matches', {
		preHandler: AuthMiddleware.authenticateUser
	}, StatsController.getUserMatches);

    fastify.post('/match/create/:gameId', {
        preHandler: AuthMiddleware.authenticateUser
    }, StatsController.createMatch);
}