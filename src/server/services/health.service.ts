export class HealthService {
  static async getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  }
}