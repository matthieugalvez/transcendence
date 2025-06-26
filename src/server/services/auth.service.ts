import { prisma } from '../db.js'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'


export class AuthService {
	static async createUser(email: string, password: string) {
		const password_hash = await bcrypt.hash(password, 10)

		const user = await prisma.user.create({
			data: {
				email: email.toLowerCase().trim(),
				displayName: '',
				password_hash
			}
		});

		await prisma.userStats.create({
			data: {
				userId: user.id,
				oneVOneWins: 0,
				oneVOneLosses: 0,
				tournamentWins: 0,
				tournamentLosses: 0,
			}
		});

		return user;
	}

	static async createGoogleUserPending(email: string, defaultName: string) {
		return await prisma.user.create({
			data: {
				email: email,
				displayName: null, // Will be set during setup
				password_hash: '', // No password for Google users
				provider: 'google'
			}
		});
	}

	/**
	 * Update refresh token for a user
	 */
	static async updateRefreshToken(userId: string, refreshToken: string | null) {
		return await prisma.user.update({
			where: { id: userId },
			data: { refreshToken }
		})
	}

	/**
	 * Verify user credentials and return user if valid
	 */
	static async verifyUser(email: string, password: string) {
		try {
			// Get the user by name
			const user = await prisma.user.findUnique({
				where: { email: email.toLocaleLowerCase().trim() }
			})

			// If user doesn't exist
			if (!user) {
				return null
			}

			// Compare passwords
			const isValidPassword = await bcrypt.compare(password, user.password_hash)

			if (isValidPassword) {
				return user
			} else {
				return null
			}

		} catch (error) {
			console.error('Error verifying user:', error)
			return null
		}
	}


	/**
	 * Invalidate all refresh tokens for a user (useful for security)
	 */
	static async invalidateAllTokens(userId: string) {
		return await prisma.user.update({
			where: { id: userId },
			data: { refreshToken: null }
		})
	}

	// 2FA

	//api/2fa/setup

	static async generate2FASecret(userId: string) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error('User not found');

		if (user.twoFAEnabled) {
			throw new Error('2FA is already enabled for this user');
		}

		const issuer = 'Transcendence';
		const label = `${issuer}:${user.displayName}`;
		const secret = speakeasy.generateSecret({
			name: label,
			issuer: issuer,
		});
		await prisma.user.update({
			where: { id: userId },
			data: { twoFASecret: secret.base32 }
		});
		const otpAuthUrl = secret.otpauth_url || '';
		const qrCodeDataURL = await qrcode.toDataURL(otpAuthUrl);
		console.log(otpAuthUrl);
		return { secret: secret.base32, otpAuthUrl: otpAuthUrl, qrCodeDataURL: qrCodeDataURL }
	}

	static async verify2FACode(userId: string, token: string) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user?.twoFASecret)
			return false;
		return speakeasy.totp.verify({
			secret: user.twoFASecret,
			encoding: 'base32',
			token,
			window: 1
		})
	}

	// /api/2fa/disable
	static async enable2FA(userId: string) {
		await prisma.user.update({
			where: { id: userId },
			data: { twoFAEnabled: true }
		});
	}

	static async disable2FA(userId: string) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error('User not found');
		if (!user.twoFAEnabled) {
			throw new Error('2FA is not enabled for this user');
		}
		await prisma.user.update({
			where: { id: userId },
			data: {
				twoFAEnabled: false,
				twoFASecret: null,
			}
		});
	}

	static async createGoogleUser(email: string, displayName: string) {
		// Create user without password since they login via Google
		const user = await prisma.user.create({
			data: {
				email: email.toLocaleLowerCase().trim(),
				displayName: '',
				password_hash: '',
				provider: 'google'
			}
		});
		await prisma.userStats.create({
			data: {
				userId: user.id,
				oneVOneWins: 0,
				oneVOneLosses: 0,
				tournamentWins: 0,
				tournamentLosses: 0,
			}
		});
		return user;
	}
}