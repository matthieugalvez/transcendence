import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'

export class UserController {
  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserService.getAllUsers()
      return {
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          created_at: user.created_at
        })),
        count: users.length
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch users'
      })
    }
  }

  static async checkUserExists(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.params as { name: string }

      const user = await UserService.getUserByName(decodeURIComponent(name))

      return {
        success: true,
        exists: !!user
      }
    } catch (error) {
      console.error('Error checking user existence:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to check user'
      })
    }
  }
}