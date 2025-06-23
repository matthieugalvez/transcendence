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
			displayName: 'Admin',
			password_hash,
		}
	})

    await prisma.userStats.create({
        data: {
            userId: admin.id,
            oneVOneWins: 0,
            oneVOneLosses: 0,
            tournamentWins: 0,
            tournamentLosses: 0,
        }
    })

    // Create test users for debugging
    const testUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = []
    for (let i = 1; i <= 3; i++) {
        const testUser = await prisma.user.create({
            data: {
                email: `test${i}@test.com`,
                displayName: `TestUser${i}`,
                password_hash: await bcrypt.hash('test123', 10),
            }
        })

        // Create stats for test users
        await prisma.userStats.create({
            data: {
                userId: testUser.id,
                oneVOneWins: Math.floor(Math.random() * 10),
                oneVOneLosses: Math.floor(Math.random() * 10),
                tournamentWins: Math.floor(Math.random() * 5),
                tournamentLosses: Math.floor(Math.random() * 5),
            }
        })

        testUsers.push(testUser)
    }

    // Create some test matches
    for (let i = 0; i < 5; i++) {
        const player1 = testUsers[Math.floor(Math.random() * testUsers.length)]
        const player2 = testUsers[Math.floor(Math.random() * testUsers.length)]

        if (player1.id !== player2.id) {
            const winner = Math.random() > 0.5 ? player1 : player2

            await prisma.match.create({
                data: {
                    playerOneId: player1.id,
                    playerTwoId: player2.id,
                    winnerId: winner.id,
                    matchType: Math.random() > 0.5 ? 'ONE_V_ONE' : 'TOURNAMENT',
                    playerOneScore: Math.floor(Math.random() * 21),
                    playerTwoScore: Math.floor(Math.random() * 21),
                    playedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                }
            })
        }
    }

    console.log('👑 Admin user created:', {
        id: admin.id,
        email: admin.email,
        created_at: admin.created_at
    })

    console.log('👥 Test users created:', testUsers.length)
    console.log('🎮 Test matches created')
}
main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})