import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'

export class AuthController {
  static async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, password } = request.body as { name: string, password: string }

      // Check if user already exists
      const existingUser = await UserService.getUserByName(name)
      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'Username already exists'
        })
      }

      // Create new user
      const user = await UserService.createUser(name, password)

      return reply.send({
        success: true,
        message: `Account created for: ${name}`,
        user: {
          id: user.id,
          name: user.name,
          created_at: user.created_at
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Database error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to create account'
      })
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, password } = request.body as { name: string, password: string }

      const user = await UserService.verifyUser(name, password)

      if (user) {
        return reply.send({
          success: true,
          message: `Successful login for: ${name}`,
          user: {
            id: user.id,
            name: user.name,
            created_at: user.created_at
          },
          timestamp: new Date().toISOString()
        })
      } else {
        return reply.code(401).send({
          success: false,
          error: 'Invalid username or password'
        })
      }
    } catch (error) {
      console.error('Database error:', error)
      return reply.code(500).send({
        success: false,
        error: 'Login failed'
      })
    }
  }
}