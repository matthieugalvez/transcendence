import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class AuthController {
  static async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, password } = request.body as { name: string, password: string }

      // Check if user already exists
      const existingUser = await UserService.getUserByName(name)
      if (existingUser) {
        return Send.conflict(reply, 'Username already exists')
      }

      // Create new user
      const user = await UserService.createUser(name, password)

      const userData = {
        id: user.id,
        name: user.name,
        created_at: user.created_at
      }

      return Send.created(reply, userData, `Account created for: ${name}`)

    } catch (error) {
      console.error('Signup error:', error)
      return Send.internalError(reply, 'Failed to create account')
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, password } = request.body as { name: string, password: string }

      const user = await UserService.verifyUser(name, password)

      if (!user) {
        return Send.unauthorized(reply, 'Invalid username or password')
      }

      const userData = {
        id: user.id,
        name: user.name,
        created_at: user.created_at
      }

      return Send.success(reply, userData, `Successful login for: ${name}`)

    } catch (error) {
      console.error('Login error:', error)
      return Send.internalError(reply, 'Login failed')
    }
  }
}