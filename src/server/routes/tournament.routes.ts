import type { FastifyInstance } from 'fastify';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { StatsService } from '../services/stats.service.js';

export async function tournamentRoutes(fastify: FastifyInstance) {
    fastify.post('/tournament/create', {
        preHandler: AuthMiddleware.authenticateUser },
        async (request, reply) => {
            try {
                await StatsService.createTournament(request.body as any)
                reply.send({ success: true })
            } catch (e) {
                console.error(e);
                reply.status(500).send({ success: false, error: 'server_error' })
            }
        }
    )

    fastify.get('/users/:userId/tournaments', {
        preHandler: AuthMiddleware.authenticateUser },
        async (request, reply) => {
            const { userId } = request.params as { userId: string }
            const list = await StatsService.getUserTournament(userId)
            reply.send(list)
        }
    )
}