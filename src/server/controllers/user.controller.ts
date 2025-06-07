import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class UserController {
  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserService.getAllUsers()

      const userData = {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          created_at: user.created_at
        })),
        count: users.length
      }

      return Send.success(reply, userData, 'Users retrieved successfully')

    } catch (error) {
      console.error('Error fetching users:', error)
      return Send.internalError(reply, 'Failed to fetch users')
    }
  }

  static async checkUserExists(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.params as { name: string }

      const user = await UserService.getUserByName(decodeURIComponent(name))

      return Send.success(reply, { exists: !!user }, 'User check completed')

    } catch (error) {
      console.error('Error checking user existence:', error)
      return Send.internalError(reply, 'Failed to check user')
    }
  }

static async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get the user ID from the authentication middleware
    const userId = (request as any).userId;

    if (!userId) {
      return Send.unauthorized(reply, 'Authentication required');
    }

    // Fix: Use getUserById instead of getUserByName
    const user = await UserService.getUserById(userId);

    if (!user) {
      return Send.notFound(reply, 'User not found');
    }

    const userData = {
      id: user.id,
      name: user.name,
      created_at: user.created_at
    };

    return Send.success(reply, userData, 'Current user retrieved successfully');

  } catch (error) {
    console.error('Get current user error:', error);
    return Send.internalError(reply, 'Failed to get current user');
  }
}
}