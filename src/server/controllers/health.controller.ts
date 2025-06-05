import { FastifyRequest, FastifyReply } from 'fastify'
import { HealthService } from "../services/health.service"
import { ResponseUtils as Send } from '../utils/response.utils'

export class HealthController {
  static async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      const healthData = await HealthService.getHealthStatus()
      return Send.success(reply, healthData, 'Health check successful')
    } catch (error) {
      console.error('Health check error:', error)
      return Send.internalError(reply, 'Health check failed')
    }
  }
}