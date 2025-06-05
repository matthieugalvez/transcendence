import { PrismaClient } from '@prisma/client'
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