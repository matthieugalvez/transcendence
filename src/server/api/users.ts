import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createUser, getUserByName, getAllUsers } from '../database/database'

export default async function userRoutes(fastify: FastifyInstance) {
  // POST /api/signup - Create new user
  fastify.post('/api/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, password } = request.body as { name: string, password: string }

      if (!name || name.trim() === '') {
        return reply.code(400).send({ success: false, error: 'Name is required' })
      }
      if (!password || password.trim() === '') {
        return reply.code(400).send({ success: false, error: 'Password is required' })
      }

      // Check if user already exists
      const existing = await getUserByName(name.trim())
      if (existing) {
        return reply.code(409).send({ success: false, error: 'Username already exists' })
      }

      // Create new user
      const user = await createUser(name.trim(), password.trim())

      return {
        success: true,
        message: `Account created for: ${name}`,
        user: {
          id: user.id,
          name: user.name,
          logged_at: user.logged_at
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Database error:', error)
      return reply.code(500).send({ success: false, error: 'Failed to save name to database' })
    }
  })

  // GET /api/users - Get all users
  fastify.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await getAllUsers()
      return {
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          logged_at: user.logged_at
        })),
        count: users.length
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return reply.code(500).send({ success: false, error: 'Failed to fetch users' })
    }
  })
}