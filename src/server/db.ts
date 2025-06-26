import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

// Create a global Prisma client instance
export const prisma = new PrismaClient()

// Plugin to register Prisma with Fastify
export async function registerDb(fastify: FastifyInstance) {
  try {
    // Check if Prisma decorator already exists
    if (!fastify.hasDecorator('prisma')) {
      // Add Prisma to Fastify instance
      fastify.decorate('prisma', prisma)
    }

    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connected via Prisma')

    // Only add the close hook if the server isn't already listening
    try {
      fastify.addHook('onClose', async () => {
        await prisma.$disconnect()
        console.log('📴 Database disconnected')
      })
    } catch (hookError) {
      // If we can't add the hook (server already listening),
      // we'll handle cleanup in the process shutdown handler
      console.warn('⚠️ Could not register onClose hook, using process handler instead');

      process.on('beforeExit', async () => {
        await prisma.$disconnect()
        console.log('📴 Database disconnected via process handler')
      })
    }
  } catch (error) {
    console.error('❌ Database registration failed:', error);
    throw error;
  }
}