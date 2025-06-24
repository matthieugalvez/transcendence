import { prisma } from '../db.js'
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

	static async isDisplayNameTaken(displayName: string, excludeUserId?: string): Promise<boolean> {
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

	static async searchUsers(query: string, limit: number = 10) {
		return await prisma.user.findMany({
			where: {
				displayName: {
					contains: query
					// Remove mode: 'insensitive' since it's not supported for this field type
				}
			},
			select: {
				id: true,
				displayName: true,
				avatar: true
			},
			take: limit
		});
	}

}

// Online users management (outside the class)
export namespace UserOnline {
	const onlineUsers = new Map<string, WebSocket>();

	export function addOnlineUser(userId: string, ws: any) {
		onlineUsers.set(userId, ws);
		console.log(`User ${userId} added to online users. Total online: ${onlineUsers.size}`);
	}

	export function removeOnlineUser(userId: string) {
		const result = onlineUsers.delete(userId);
		console.log(`User ${userId} removed from online users: ${result}. Total online: ${onlineUsers.size}`);
	}

	export function isUserOnline(userId: string): boolean {
		return onlineUsers.has(userId);
	}

	export function getOnlineUsers(): string[] {
		return Array.from(onlineUsers.keys());
	}

	export function broadcastToAll(message: string) {
		console.log(`Broadcasting to ${onlineUsers.size} users`);
		let sentCount = 0;

		onlineUsers.forEach((ws, userId) => {
			try {
				// Fix: Check if ws exists and has readyState property
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(message);
					sentCount++;
				} else if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
					// Clean up closed connections
					onlineUsers.delete(userId);
				} else if (!ws) {
					// Clean up null/undefined WebSocket references
					console.log(`Removing null WebSocket for user ${userId}`);
					onlineUsers.delete(userId);
				}
			} catch (error) {
				console.error(`Error sending to user ${userId}:`, error);
				onlineUsers.delete(userId);
			}
		});

		console.log(`Successfully sent message to ${sentCount} users`);
	}
}