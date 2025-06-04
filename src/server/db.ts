import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { FastifyInstance } from 'fastify'

// Create a global Prisma client instance
export const prisma = new PrismaClient()

// Plugin to register Prisma with Fastify
export async function registerDb(fastify: FastifyInstance) {
  // Add Prisma to Fastify instance
  fastify.decorate('prisma', prisma)

  // Connect to database
  await prisma.$connect()
  console.log('✅ Database connected via Prisma')

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
    console.log('📴 Database disconnected')
  })
}

// Helper functions for user operations
export async function createUser(name: string, password: string) {
  const password_hash = await bcrypt.hash(password, 10)

  return await prisma.user.create({
    data: {
      name: name.trim(),
      password_hash
    }
  })
}

export async function getUserByName(name: string) {
  return await prisma.user.findUnique({
    where: { name }
  })
}

export async function verifyUser(name: string, password: string) {
  try {
    // Get the user by name
    const user = await prisma.user.findUnique({
      where: { name }
    })

    // If user doesn't exist
    if (!user) {
      return null
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (passwordMatch) {
      return user  // Return the user object
    } else {
      return null  // Return null for invalid password
    }
  } catch (error) {
    console.error('Error verifying user:', error)
    return null
  }
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { created_at: 'desc' }  // Change from logged_at to created_at
  })
}

// Helper functions for game sessions
export async function createGameSession(data: {
  player1_id: number
  player2_id: number
  player1_score: number
  player2_score: number
  winner_id?: number
  status?: string
}) {
  return await prisma.gameSession.create({
    data,
    include: {
      player1: true,
      player2: true
    }
  })
}

export async function getGameSessions() {
  return await prisma.gameSession.findMany({
    include: {
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } }
    },
    orderBy: { created_at: 'desc' }
  })
}