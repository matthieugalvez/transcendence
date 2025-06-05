import { FastifyInstance } from 'fastify'
import authSchema from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { AuthController } from '../controllers/auth.controller'

export default async function authRoutes(fastify: FastifyInstance) {
  // Signup route
  fastify.post('/signup', {
    preHandler: [
	ValidationMiddleware.validateBody(authSchema.signup),

	// Array de middleware (middleware = truc effectuer entre la requete et la reponse)
	]
  }, AuthController.signup) // reponse

  // Login route
  fastify.post('/login', {
    preHandler: ValidationMiddleware.validateBody(authSchema.login)
  }, AuthController.login)
}