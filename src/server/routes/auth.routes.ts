import { FastifyInstance } from 'fastify'
import authSchema from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { AuthController } from '../controllers/auth.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

import cookie from '@fastify/cookie'

export default async function authRoutes(fastify: FastifyInstance) {
  // Register cookie plugin
  await fastify.register(cookie)

  // Signup route
  fastify.post('/signup', {
    preHandler: [
      ValidationMiddleware.validateBody(authSchema.signup),
    ]
  }, AuthController.signup)

  // Login route
  fastify.post('/login', {
    preHandler: ValidationMiddleware.validateBody(authSchema.login)
  }, AuthController.login)

fastify.post('/logout', {
    preHandler: AuthMiddleware.authenticateUser
  }, AuthController.logout)
}