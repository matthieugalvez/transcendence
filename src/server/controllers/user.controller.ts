import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url);

export class UserController {
  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserService.getAllUsers()

      const userData = {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          created_at: user.created_at
        })),
        count: users.length
      }

      return Send.success(reply, userData, 'Users retrieved successfully')

    } catch (error) {
      console.error('Error fetching users:', error)
      return Send.internalError(reply, 'Failed to fetch users')
    }
  }

  static async checkUserExists(request: fastifyrequest, reply: fastifyreply) {
    try {
      const { name } = request.params as { name: string }

      const user = await UserService.getUserByName(decodeURIComponent(name))

      return Send.success(reply, { exists: !!user }, 'User check completed')

    } catch (error) {
      console.error('Error checking user existence:', error)
      return Send.internalError(reply, 'Failed to check user')
    }
  }

	static async	getLanguageFile(request: fastifyrequest, reply: fastifyreply) {
		try {
			const userId = (request as any).userId;
			const user = await UserService.getUserById(userId);
			const language = user.language;
			const fs = require(`../locales/${language}.json`);
			console.log("File data:", fs);

			return Send.success(reply, fs, 'Language file retrieved successfully');
		}
		catch (error) {
			console.error('Error retrieving language file:', error)
			return Send.internalError(reply, 'Failed to retrieve language file')
		}
	}

	static async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
	  try {
		// Get the user ID from the authentication middleware
		const userId = (request as any).userId;

		if (!userId) {
		  return Send.unauthorized(reply, 'Authentication required');
		}

		// Fix: Use getUserById instead of getUserByName
		const user = await UserService.getUserById(userId);

		if (!user) {
		  return Send.notFound(reply, 'User not found');
		}

		const userData = {
			id: user.id,
			name: user.name,
			language: user.language,
			created_at: user.created_at
		};

		return Send.success(reply, userData, 'Current user retrieved successfully');

	  } catch (error) {
		console.error('Get current user error:', error);
		return Send.internalError(reply, 'Failed to get current user');
	  }
	}

		static async	setUserLanguage(request: FastifyRequest, reply: FastifyReply) {
			const { language } = request.body as { language: string };
			const userId = (request as any).userId;
			try {
				if (userId) {
					await UserService.setUserLanguage(userId, language);
				}
				return Send.success(reply, `User language changed to ${language}`);
			}
			catch (error) {
				console.error(`Could not change language for ${userId.name}`, error);
				return Send.internalError(reply, 'Failed to change language');
			}
		}
}
