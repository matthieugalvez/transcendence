import { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/user.controller'
import AuthMiddleware from '../middlewares/auth.middleware'
import cookie from '@fastify/cookie'

export default async function userDataRoutes(fastify: FastifyInstance) {
  await fastify.register(cookie)

  // GET /api/users - Get all users (PROTECTED)
  fastify.get('/', {
    preHandler: AuthMiddleware.authenticateUser
  }, UserController.getAllUsers)

  // GET /api/users/check/:name - Check if user exists (PROTECTED)
  fastify.get('/check/:name', {
    preHandler: AuthMiddleware.authenticateUser
  }, UserController.checkUserExists)

  // GET /api/users/me - Get current user (PROTECTED)
  fastify.get('/me', {
    preHandler: AuthMiddleware.authenticateUser
  }, UserController.getCurrentUser)
}