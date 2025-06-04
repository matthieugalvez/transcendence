import { createUser, getUserByName, verifyUser } from '../db'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import authSchema from '../validations/auth.schema'
import { validateBody } from '../middlewares/validation.middleware'

export default async function authRoutes(fastify: FastifyInstance) {

  // Signup route with Zod validation
  fastify.post('/api/signup', {
    preHandler: validateBody(authSchema.signup)
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // No need to validate here anymore - preHandler does it
      const { name, password } = request.body as { name: string, password: string }

      // Check if user already exists
      const existingUser = await getUserByName(name)
      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'Username already exists'
        })
      }

      // Create new user
      const user = await createUser(name, password)

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
  })

  // Login route with Zod validation
  fastify.post('/api/login', {
    preHandler: validateBody(authSchema.login)
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // No need to validate here anymore - preHandler does it
      const { name, password } = request.body as { name: string, password: string }

      const user = await verifyUser(name, password)

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
          success: false, // Fixed typo from 'succes'
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
  })


}