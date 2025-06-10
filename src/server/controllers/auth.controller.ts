import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth.config'
import { AuthService } from '../services/auth.service'
import OAuth2 , { OAuthNamespace } from "@fastify/oauth2";

export class AuthController {
	static async signup(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { name, password } = request.body as { name: string, password: string }

			// Check if user already exists
			const existingUser = await UserService.getUserByName(name)
			if (existingUser) {
				return Send.conflict(reply, 'Username already exists')
			}


			// Create new user
			const user = await AuthService.createUser(name, password)

			// Create new user


			// Generate JWT tokens
			const accessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			)

			const refreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			)

			// Store refresh token in database
			await AuthService.updateRefreshToken(user.id, refreshToken)

			console.log('🍪 Setting cookies for new user:', user.id);
			console.log('🔑 AccessToken being set:', accessToken ? '***CREATED***' : 'FAILED');

			// Set HttpOnly cookies
			reply.setCookie('accessToken', accessToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			})

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			})

			const userData = {
				id: user.id,
				name: user.name,
				created_at: user.created_at
			}

			return Send.created(reply, userData, `Account created for: ${name}`)

		} catch (error) {
			console.error('Signup error:', error)
			return Send.internalError(reply, 'Failed to create account')
		}
	}

	static async login(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { name, password, twoFACode } = request.body as { name: string, password: string, twoFACode: string }

			const user = await AuthService.verifyUser(name, password)

			if (!user) {
				return Send.unauthorized(reply, 'Invalid username or password')
			}

			if (user.twoFAEnabled) {
				const is2FAValid = await AuthService.verify2FACode(user.id, twoFACode)
				if (!is2FAValid) {
					return Send.unauthorized(reply, 'Invalid 2FA Code');
				}
				// await AuthService.enable2FA(user.id);
				//Send.success(reply, null, '2FA enabled successfully');
			}

			// Generate JWT tokens
			const accessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			)

			const refreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			)

			// Store refresh token in database
			await AuthService.updateRefreshToken(user.id, refreshToken)

			console.log('🍪 Setting cookies for user:', user.id);
			console.log('🔑 AccessToken being set:', accessToken ? '***CREATED***' : 'FAILED');
			console.log('🔄 RefreshToken being set:', refreshToken ? '***CREATED***' : 'FAILED');

			// Set HttpOnly cookies
			reply.setCookie('accessToken', accessToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			})

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			})

			const userData = {
				id: user.id,
				name: user.name,
				created_at: user.created_at
			}

			return Send.success(reply, userData, `Successful login for: ${name}`)

		} catch (error) {
			console.error('Login error:', error)
			return Send.internalError(reply, 'Login failed')
		}
	}

	static async logout(request: FastifyRequest, reply: FastifyReply) {
		try {
			// Get user ID from auth middleware
			const userId = (request as any).userId;

			// Remove refresh token from database
			if (userId) {
				await AuthService.updateRefreshToken(userId, null)
			}

			// Clear the JWT cookies
			reply.setCookie('accessToken', '', {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 0
			})

			reply.setCookie('refreshToken', '', {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 0
			})

			console.log('🍪 Cookies cleared and refresh token removed from database for user:', userId);

			return Send.success(reply, null, 'Logged out successfully');

		} catch (error) {
			console.error('Logout error:', error);
			return Send.internalError(reply, 'Logout failed');
		}
	}

	/**
	 * Refresh access token using refresh token
	 */
	static async refreshToken(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { refreshToken } = request.cookies as { refreshToken: string };

			if (!refreshToken) {
				return Send.unauthorized(reply, 'No refresh token provided');
			}

			// Verify refresh token
			const decoded = jwt.verify(refreshToken, authConfig.refresh_secret) as { userId: number };

			// Check if refresh token exists in database
			const user = await UserService.getUserById(decoded.userId);
			if (!user || user.refreshToken !== refreshToken) {
				return Send.unauthorized(reply, 'Invalid refresh token');
			}

			// Generate new access token
			const newAccessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			);

			// Optionally rotate refresh token (recommended for security)
			const newRefreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			);

			// Update refresh token in database
			await AuthService.updateRefreshToken(user.id, newRefreshToken);

			// Set new cookies
			reply.setCookie('accessToken', newAccessToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', newRefreshToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			});

			return Send.success(reply, null, 'Token refreshed successfully');

		} catch (error) {
			console.error('Token refresh error:', error);
			return Send.unauthorized(reply, 'Invalid or expired refresh token');
		}
	}

	// ...existing code...

	/**
	 * Setup 2FA: generate secret and QR code for user
	 */
	static async setup2FA(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			if (!userId)
				return Send.unauthorized(reply, 'Authentication required');

			try {
				const { secret, otpAuthUrl, qrCodeDataURL } = await AuthService.generate2FASecret(userId);
				return Send.success(reply, { secret, otpAuthUrl, qrCodeDataURL }, '2FA setup initiated');
			} catch (err: any) {
				return Send.badRequest(reply, err.message || '2FA setup failed');
			}
		} catch (error) {
			console.error('2FA setup error:', error);
			return Send.internalError(reply, 'Failed to setup 2FA');
		}
	}

	/**
	 * Verify 2FA code and enable 2FA for user
	 */
	static async verify2FA(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { token } = request.body as { token: string };
			if (!userId) return Send.unauthorized(reply, 'Authentication required');
			if (!token) return Send.badRequest(reply, '2FA token required');

			const isValid = await AuthService.verify2FACode(userId, token);
			if (!isValid)
				return Send.unauthorized(reply, 'Invalid 2FA code');

			await AuthService.enable2FA(userId);
			return Send.success(reply, null, '2FA enabled successfully');
		} catch (error) {
			console.error('2FA verify error:', error);
			return Send.internalError(reply, 'Failed to verify 2FA');
		}
	}

	/**
	 * Disable 2FA for user
	 */
	static async disable2FA(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			if (!userId) return Send.unauthorized(reply, 'Authentication required');

			try {
				await AuthService.disable2FA(userId);
				return Send.success(reply, null, '2FA disabled successfully');
			} catch (err: any) {
				return Send.badRequest(reply, err.message || 'Failed to disable 2FA');
			}
		} catch (error) {
			console.error('2FA disable error:', error);
			return Send.internalError(reply, 'Failed to disable 2FA');
		}
	}


	// GOOGLE

	static async googleSignin(request: FastifyRequest, reply: FastifyReply) {
		return Send.success(reply, null, 'Google signin endpoint');
	}



}