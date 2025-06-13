import { prisma } from '../db'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

export class UserService {
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
   * Get all users with selected fields
   */
  static async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        created_at: true
      }
    });
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

	static async	setUserLanguage(userId: number, new_language: string) {
		return await prisma.user.update({
			where: { id: userId },
			data: { language: new_language }
		})
	}
}
