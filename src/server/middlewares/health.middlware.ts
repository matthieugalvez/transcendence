import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../database/database';


class healthRoutes {
	
static healthRoutes(fastify: FastifyInstance) {
    // Basic health check
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            status: 'OK',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Database health check
    fastify.get('/db', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Simple database query to check connection
            await prisma.$queryRaw`SELECT 1`;

            return reply.send({
                status: 'OK',
                message: 'Database connection is healthy',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Database health check failed:', error);
            return reply.code(503).send({
                status: 'ERROR',
                message: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Full system health check
    fastify.get('/full', async (request: FastifyRequest, reply: FastifyReply) => {
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'OK',
            services: {
                api: 'OK',
                auth: 'OK'
            }
        };

        try {
            // Check database connection
            await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            healthCheck.status = 'DEGRADED';
            healthCheck.database = 'ERROR';
            console.error('Database health check failed:', error);
        }

        const statusCode = healthCheck.status === 'OK' ? 200 : 503;
        return reply.code(statusCode).send(healthCheck);
    });
}