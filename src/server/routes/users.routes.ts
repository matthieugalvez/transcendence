import { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/user.controller'

export default async function userDataRoutes(fastify: FastifyInstance) {
  // GET /api/users - Get all users
  fastify.get('/users', UserController.getAllUsers)

  // GET /api/users/check/:name - Check if user exists
  fastify.get('/users/check/:name', UserController.checkUserExists)
}