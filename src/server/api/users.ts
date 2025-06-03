import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { insertUser, getAllUsers } from '../configs/database.js'


// Definition juste pour "conteneraiser le code" et l'assigner a la bonne isntance fastify dans app.ts

export default async function userRoutes(fastify: FastifyInstance) {
  // POST /api/signup - Create new user
  // Repond aux requetes POST envoyes a /api/signup du coup quand on clique sur le bouton dans index.ts
  // On envoie une requete POST avec les infos de nom/password dans le body, ici on les recuperes et on stock dans la db
  // Et on renvoie le message de succes/erreur au client/front (chaque RETURN est la reponse envoye au front)

  fastify.post('/api/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, password } = request.body as { name: string, password: string }

      if (!name || name.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Name is required'
        })
      }

      if (!password || password.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: 'Password is required'
        })
      }

	// Insere l'utilisateur dans la DB
      const user = await insertUser(name.trim(), password.trim())

      console.log(`👋 Hello, ${name}! Saved to database with ID: ${user.id}`)

      return {
        success: true,
        message: `Account created for: ${name}`,
        user: {
          id: user.id,
          name: user.name,
          logged_at: user.logged_at
        }, // Don't expose password_hash
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Database error:', error)

      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return reply.code(409).send({
          success: false,
          error: 'Username already exists'
        })
      }

      return reply.code(500).send({
        success: false,
        error: 'Failed to save name to database'
      })
    }
  })

  // GET /api/users - Get all users (debug only)
  // Recupere tous les utilisateurs
  fastify.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await getAllUsers()
      return {
        success: true,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          logged_at: user.logged_at
        })), // Don't expose password hashes
        count: users.length
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch users'
      })
    }
  })
}