import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService, UserOnline } from '../services/users.service.js'
import { ResponseUtils as Send } from '../utils/response.utils.js'
import { pipeline } from 'stream';
import { promisify } from 'util';
import path from 'path'; // Add this import
import fs from 'fs';

const pump = promisify(pipeline); // Add this line


export class UserController {
	static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
		try {
			const users = await UserService.getAllUsers()

			const userData = {
				users: users.map(user => ({
					id: user.id,
					name: user.displayName,
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

			const user = await UserService.getUserByDisplayName(decodeURIComponent(name))

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

			// Handle avatar URL - if it's just a filename, create the proper URL
			let avatarUrl = user.avatar;
			if (avatarUrl && !avatarUrl.startsWith('/avatars/')) {
				// If it's just a filename, prepend /avatars/
				avatarUrl = `/avatars/${avatarUrl}`;
			} else if (!avatarUrl) {
				// No avatar set, use default
				avatarUrl = `/avatars/default.svg`;
			}

			const userData = {
				id: user.id,
				name: user.displayName,
				displayName: user.displayName,
				avatar: avatarUrl,
				created_at: user.created_at,
				updated_at: user.updated_at
			};

			return Send.success(reply, userData, 'Current user retrieved successfully');

		} catch (error) {
			console.error('Error fetching current user:', error);
			return Send.internalError(reply, 'Failed to fetch user data');
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
				name: updatedUser.displayName,
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


static async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
        console.log('=== AVATAR UPLOAD DEBUG ===');

        const userId = (request as any).userId;
        if (!userId) {
            return Send.unauthorized(reply, 'Authentication required');
        }

        const data = await request.file();
        if (!data) {
            return Send.badRequest(reply, 'No file uploaded');
        }

        // Validate file type and size
        if (!data.mimetype.startsWith('image/')) {
            return Send.badRequest(reply, 'Only image files are allowed');
        }

        const fileSize = parseInt(request.headers['content-length'] || '0');
        if (fileSize > 5 * 1024 * 1024) {
            return Send.badRequest(reply, 'File size must be less than 5MB');
        }

        // Use the same directory as defined in environment variable
        const uploadDir = process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), 'src/server/db/users');
        console.log('📁 Using upload directory:', uploadDir);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
        }

        // Generate filename with proper extension
        const fileExtension = path.extname(data.filename || '');
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}${fileExtension || '.jpg'}`;
        const filePath = path.join(uploadDir, fileName);

        console.log('💾 Saving file:', {
            fileName,
            filePath,
            uploadDir,
            originalName: data.filename,
            mimetype: data.mimetype
        });

        // Save the file
        await pump(data.file, fs.createWriteStream(filePath, { mode: 0o666 }));

        // Verify file was saved
        if (!fs.existsSync(filePath)) {
            throw new Error('File was not saved successfully');
        }

        const stats = fs.statSync(filePath);
        console.log('✅ File saved successfully:', {
            size: stats.size,
            path: filePath
        });

        // Update database with just the filename (not full path)
        await UserService.updateUserAvatar(userId, fileName);

        console.log('✅ Database updated with avatar filename:', fileName);

        return Send.success(reply, {
            avatarUrl: `/avatars/${fileName}`,
            fileName: fileName,
            message: 'Avatar uploaded successfully'
        }, 'Avatar uploaded successfully');

    } catch (error) {
        console.error('❌ Avatar upload error:', error);
        return Send.internalError(reply, 'Failed to upload avatar');
    }
}




	static async getUserProfile(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { userId } = request.params as { userId: string };
			const requesterId = (request as any).userId;

			if (!requesterId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const user = await UserService.getUserById(userId);

			if (!user) {
				return Send.notFound(reply, 'User not found');
			}

			// Handle avatar URL
			let avatarUrl = user.avatar;
			if (avatarUrl && avatarUrl.startsWith('./db/users/')) {
				const filename = avatarUrl.replace('./db/users/', '');
				avatarUrl = `/avatars/${filename}`;
			}

			const userData = {
				id: user.id,
				displayName: user.displayName,
				avatar: avatarUrl,
				created_at: user.created_at,
				updated_at: user.updated_at
			};

			return Send.success(reply, userData, 'User profile retrieved successfully');

		} catch (error) {
			console.error('Get user profile error:', error);
			return Send.internalError(reply, 'Failed to get user profile');
		}
	}

	static async searchUsers(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { q: query, limit = 10 } = request.query as { q: string; limit?: number };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			if (!query || query.trim().length < 2) {
				return Send.badRequest(reply, 'Search query must be at least 2 characters');
			}

			const users = await UserService.searchUsers(query.trim(), Math.min(limit, 20));

			const userData = users.map(user => ({
				id: user.id,
				displayName: user.displayName,
				avatar: user.avatar?.startsWith('./db/users/')
					? `/avatars/${user.avatar.replace('./db/users/', '')}`
					: user.avatar
			}));

			return Send.success(reply, userData, 'Users search completed');

		} catch (error) {
			console.error('Search users error:', error);
			return Send.internalError(reply, 'Failed to search users');
		}
	}


	static async getUserProfileByDisplayName(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { displayName } = request.params as { displayName: string };
			const requesterId = (request as any).userId;

			if (!requesterId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			// Decode the displayName in case it has special characters
			const decodedDisplayName = decodeURIComponent(displayName);

			const user = await UserService.getUserByDisplayName(decodedDisplayName);

			if (!user) {
				return Send.notFound(reply, 'User not found');
			}

			let avatarUrl = user.avatar;
			if (avatarUrl && avatarUrl.startsWith('./db/users/')) {
				const filename = avatarUrl.replace('./db/users/', '');
				avatarUrl = `/avatars/${filename}`;
			}

			const userData = {
				id: user.id,
				displayName: user.displayName,
				avatar: avatarUrl,
				created_at: user.created_at,
				updated_at: user.updated_at
			};

			return Send.success(reply, userData, 'User profile retrieved successfully');

		} catch (error) {
			console.error('Get user profile by displayName error:', error);
			return Send.internalError(reply, 'Failed to get user profile');
		}
	}

	static async getOnlineStatus(request: FastifyRequest, reply: FastifyReply) {
		const { userId } = request.params as { userId: string };
		const online = UserOnline.isUserOnline(userId);
		return reply.send({ success: true, online });
	}


}
