import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createUser, getUserByName, getAllUsers, verifyUser } from '../db'

export default async function userDataRoutes(fastify: FastifyInstance) {
  // POST /api/signup - Create new user



  // GET /api/users - Get all users
	fastify.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
		const users = await getAllUsers()
		return {
			success: true,
			users: users.map(user => ({
			id: user.id,
			name: user.name,
			created_at: user.created_at
			})),
			count: users.length
		}
		} catch (error) {
		console.error('Error fetching users:', error)
		return reply.code(500).send({ success: false, error: 'Failed to fetch users' })
		}
	})

	fastify.get('/api/users/check/:name', async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const { name } = request.params as { name: string }

		const user = await getUserByName(decodeURIComponent(name))

		return {
		success: true,
		exists: !!user
		}
	} catch (error) {
		console.error('Error checking user existence:', error)
		return reply.code(500).send({ success: false, error: 'Failed to check user' })
	}
	})
}

