import { prisma } from '../db'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import qrcode from 'node-qrcode'


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
   * Update refresh token for a user
   */

}