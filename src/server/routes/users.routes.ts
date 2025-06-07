import { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/user.controller'
import AuthMiddleware from '../middlewares/auth.middleware'
import cookie from '@fastify/cookie'

export default async function userDataRoutes(fastify: FastifyInstance) {
  await fastify.register(cookie)

  // GET /api/users - Get all users (remove /users prefix since it's in router)
  fastify.get('/', UserController.getAllUsers)

  // GET /api/users/check/:name - Check if user exists
  fastify.get('/check/:name', UserController.checkUserExists)

  // GET /api/users/me - Get current user
  fastify.get('/me', {
    preHandler: AuthMiddleware.authenticateUser
  }, UserController.getCurrentUser)
}