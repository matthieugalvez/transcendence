import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth.config'

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

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        authConfig.secret,
        { expiresIn: authConfig.secret_expires_in }
      )

      const refreshToken = jwt.sign(
        { userId: user.id },
        authConfig.refresh_secret,
        { expiresIn: authConfig.refresh_secret_expires_in }
      )

      console.log('🍪 Setting cookies for new user:', user.id);
      console.log('🔑 AccessToken being set:', accessToken ? '***CREATED***' : 'FAILED');

      // Set HttpOnly cookies with proper domain settings for development
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined, // Don't set domain for localhost
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes in milliseconds
      })

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined, // Don't set domain for localhost
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      })

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

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        authConfig.secret,
        { expiresIn: authConfig.secret_expires_in }
      )

      const refreshToken = jwt.sign(
        { userId: user.id },
        authConfig.refresh_secret,
        { expiresIn: authConfig.refresh_secret_expires_in }
      )

      console.log('🍪 Setting cookies for user:', user.id);
      console.log('🔑 AccessToken being set:', accessToken ? '***CREATED***' : 'FAILED');
      console.log('🔄 RefreshToken being set:', refreshToken ? '***CREATED***' : 'FAILED');

      // Set HttpOnly cookies with proper domain settings for development
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined, // Don't set domain for localhost
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes in milliseconds
      })

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined, // Don't set domain for localhost
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      })

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

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Clear the JWT cookies by setting them to expire immediately
      reply.setCookie('accessToken', '', {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined,
        path: '/',
        maxAge: 0 // Expire immediately
      })

      reply.setCookie('refreshToken', '', {
        httpOnly: true,
        secure: false, // Set to false for development (localhost)
        sameSite: 'lax',
        domain: undefined,
        path: '/',
        maxAge: 0 // Expire immediately
      })

      console.log('🍪 Cookies cleared for logout');

      return Send.success(reply, null, 'Logged out successfully');

    } catch (error) {
      console.error('Logout error:', error);
      return Send.internalError(reply, 'Logout failed');
    }
  }
}