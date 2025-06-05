import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { name: 'Admin' }
  })

  if (existingAdmin) {
    console.log('👑 Admin user already exists')
    return
  }

  // Create admin user
  const password_hash = await bcrypt.hash('Paris4242!', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      password_hash,
    }
  })

  console.log('👑 Admin user created:', {
    id: admin.id,
    name: admin.name,
    created_at: admin.created_at
  })
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })