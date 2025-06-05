import { FastifyRequest, FastifyReply } from 'fastify'
import { HealthService } from "../services/health.service"

export class HealthController {
  static async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      const healthData = await HealthService.getHealthStatus()
      return healthData
    } catch (error) {
      console.error('Health check error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Health check failed'
      })
    }
  }
}