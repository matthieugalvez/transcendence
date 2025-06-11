import { prisma } from '../db'
import bcrypt from 'bcrypt'
import { User } from '@prisma/client'

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
                created_at: true,
                updated_at: true
            }
        });
    }

    static async updateUserName(userId: number, newDisplayName: string): Promise<User | null> {
        try {
            // Validation is handled by middleware, so we can remove it here
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { displayName: newDisplayName }
            });

            return updatedUser;
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
    }

    static async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
        try {
            // Validation is handled by middleware, so we can remove it here
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { password_hash: hashedPassword }
            });

            return !!updatedUser;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }
}