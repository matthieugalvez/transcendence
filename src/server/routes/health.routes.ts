import { FastifyInstance } from 'fastify'
import { HealthController } from '../controllers/health.controller'

// Health check should remain public for monitoring/load balancers
export default async function healthRoutes(fastify: FastifyInstance) {
  // GET /health - Health check endpoint (PUBLIC)
  fastify.get('/health', HealthController.healthCheck)
}