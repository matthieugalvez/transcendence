import { prisma } from '../db'
import bcrypt from 'bcrypt'

export class UserService {
  static async createUser(name: string, password: string) {
    const password_hash = await bcrypt.hash(password, 10)

    return await prisma.user.create({
      data: {
        name: name.trim(),
        password_hash
      }
    })
  }

  static async getUserByName(name: string) {
    return await prisma.user.findUnique({
      where: { name }
    })
  }

  static async verifyUser(name: string, password: string) {
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

  static async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    })
  }
}