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

  static async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  /**
   * Update refresh token for a user
   */
  static async updateRefreshToken(userId: number, refreshToken: string | null) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refreshToken }
    })
  }

  /**
   * Verify user credentials and return user if valid
   */
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
      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (isValidPassword) {
        return user
      } else {
        return null
      }

    } catch (error) {
      console.error('Error verifying user:', error)
      return null
    }
  }

  /**
   * Get all users (for admin purposes)
   */
  static async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        created_at: true
        // Don't return password_hash or refreshToken for security
      }
    })
  }

  /**
   * Invalidate all refresh tokens for a user (useful for security)
   */
  static async invalidateAllTokens(userId: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    })
  }

  static async setUserLanguage(userId: number, new_language: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { language:  new_language }
    })
  }
}
