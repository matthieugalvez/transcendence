import { prisma } from '../db'
import bcrypt from 'bcrypt'
import { User } from '@prisma/client'

export class UserService {
	static async getUserByEmail(email: string) {
		return await prisma.user.findUnique({
			where: { email }
		})
	}

	static async getUserById(id: string) {
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

	static async updateUserName(userId: string, newDisplayName: string): Promise<User | null> {
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

	static async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
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

	static async isDisplayNameTaken(displayName: string, excludeUserId?: number): Promise<boolean> {
		try {
			const existingUser = await prisma.user.findFirst({
				where: {
					displayName: displayName.toLowerCase().trim(),
					// Exclude current user if updating their own display name
					...(excludeUserId && { id: { not: excludeUserId } })
				}
			});

			return !!existingUser;
		} catch (error) {
			console.error('Error checking display name:', error);
			throw error;
		}
	}

	/**
	 * Get user by display name
	 */
	static async getUserByDisplayName(displayName: string) {
		try {
			return await prisma.user.findFirst({
				where: {
					displayName: displayName.trim()
				}
			});
		} catch (error) {
			console.error('Error getting user by display name:', error);
			throw error;
		}
	}

	static async getUserAvatar(userId: string): Promise<string | null> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				avatar: true
			}
		});

		return user?.avatar || null;
	}

	static async updateUserAvatar(userId: string, avatarPath: string): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarPath }
        });
    } catch (error) {
        console.error('Error updating user avatar:', error);
        throw error;
    }
}
}