import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class UserController {
	static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
		try {
			const users = await UserService.getAllUsers()

			const userData = {
				users: users.map(user => ({
					id: user.id,
					name: user.email,
					displayName: user.displayName,
					created_at: user.created_at,
					updated_at: user.updated_at
				})),
				count: users.length
			}

			return Send.success(reply, userData, 'Users retrieved successfully')

		} catch (error) {
			console.error('Error fetching users:', error)
			return Send.internalError(reply, 'Failed to fetch users')
		}
	}

	static async checkUserExists(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { name } = request.params as { name: string }

			const user = await UserService.getUserByName(decodeURIComponent(name))

			return Send.success(reply, { exists: !!user }, 'User check completed')

		} catch (error) {
			console.error('Error checking user existence:', error)
			return Send.internalError(reply, 'Failed to check user')
		}
	}

	static async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const user = await UserService.getUserById(userId);

			if (!user) {
				return Send.notFound(reply, 'User not found');
			}

			const userData = {
				id: user.id,
				name: user.email,
				displayName: user.displayName,
				avatar: user.avatar,
				created_at: user.created_at,
				updated_at: user.updated_at // Fix: was update_at
			};

			return Send.success(reply, userData, 'Current user retrieved successfully');

		} catch (error) {
			console.error('Get current user error:', error);
			return Send.internalError(reply, 'Failed to get current user');
		}
	}

	static async changeUserName(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { displayName } = request.body as { displayName: string };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const isDisplayNameTaken = await UserService.isDisplayNameTaken(displayName);
			if (isDisplayNameTaken) {
				return Send.conflict(reply, 'Display name is already taken')
			}

			// Validation is now handled by middleware, so we can skip manual checks
			// Update the display name
			const updatedUser = await UserService.updateUserName(userId, displayName.trim());

			if (!updatedUser) {
				return Send.notFound(reply, 'User not found');
			}

			const userData = {
				id: updatedUser.id,
				name: updatedUser.email,
				displayName: updatedUser.displayName,
				created_at: updatedUser.created_at,
				updated_at: updatedUser.updated_at
			};

			return Send.success(reply, userData, 'Display name updated successfully');

		} catch (error) {
			console.error('Change display name error:', error);
			return Send.internalError(reply, 'Failed to change display name');
		}
	}

	static async changeUserPassword(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { password } = request.body as { password: string };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			// Validation is now handled by middleware, so we can skip manual checks
			// Update the password
			const success = await UserService.updateUserPassword(userId, password);

			if (!success) {
				return Send.notFound(reply, 'User not found');
			}

			return Send.success(reply, {}, 'Password updated successfully');

		} catch (error) {
			console.error('Change password error:', error);
			return Send.internalError(reply, 'Failed to change password');
		}
	}

	static async checkDisplayNameAvailability(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { displayName } = request.query as { displayName: string };

			if (!displayName || displayName.trim() === '') {
				return Send.badRequest(reply, 'Display name is required');
			}

			// Check if display name is taken, excluding current user
			const isDisplayNameTaken = await UserService.isDisplayNameTaken(displayName.trim(), userId);

			// Make sure you're using Send.success with the correct structure
			return Send.success(reply, {
				available: !isDisplayNameTaken,
				message: isDisplayNameTaken ? 'Display name is already taken' : 'Display name is available'
			}, 'Display name check completed');

		} catch (error) {
			console.error('Error checking display name availability:', error);
			return Send.internalError(reply, 'Failed to check display name availability');
		}
	}

	static async getAvatar(request: FastifyRequest, reply: FastifyReply) {
		const userId = (request as any).userId;

		const avatarLink = await UserService.getUserAvatar(userId);

		return Send.success(reply, {}, 'Avatar link succes');
	}
}
