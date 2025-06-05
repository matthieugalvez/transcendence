import { FastifyInstance } from 'fastify'
import { HealthController } from '../controllers/health.controller'

//Health check, si on s'y connecte l'API fonctionne
// Repond aux requetes GET envoyes a /api/health

export default async function healthRoutes(fastify: FastifyInstance) {
  // GET /api/health - Health check endpoint
  fastify.get('/health', HealthController.healthCheck) // no prehandler.
}