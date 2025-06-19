import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Seeding database...')

	// Check if admin user already exists
	const existingAdmin = await prisma.user.findUnique({
		where: { email: 'admin@admin.com' }
	})

	if (existingAdmin) {
		console.log('👑 Admin user already exists')
		return
	}

	// Create admin user
	const password_hash = await bcrypt.hash('Paris4242!', 10)

	const admin = await prisma.user.create({
		data: {
			email: 'admin@admin.com',
			password_hash,
		}
	})

	console.log('👑 Admin user created:', {
		id: admin.id,
		email: admin.email,
		created_at: admin.created_at
	})

	// Create test user for remote match
	const userPwd_hash = await bcrypt.hash('Bonjour42!', 10)

	const testUser = await prisma.user.create({
		data: {
			email: 'test@test.com',
			password_hash: userPwd_hash,
		}
	})

	console.log('👑 Test user created:', {
		id: testUser.id,
		email: testUser.email,
		created_at: testUser.created_at
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