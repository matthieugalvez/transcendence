import { prisma } from '../db'
import bcrypt from 'bcrypt'

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

	static async updateUserName(userId: number, newName: string): Promise<User | null> {
		try {
			// Update user using prisma client
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { name: newName }
			});

			return updatedUser;
		} catch (error) {
			console.error('Error updating username:', error);
			throw error;
		}
	}


	static async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
		try {
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
