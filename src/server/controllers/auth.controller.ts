import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/users.service'
import { ResponseUtils as Send } from '../utils/response.utils'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth.config'
import { AuthService } from '../services/auth.service'
import OAuth2, { OAuthNamespace } from "@fastify/oauth2";

export class AuthController {
	static async signup(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, password } = request.body as { email: string, password: string }

			// Check if user already exists
			const existingUser = await UserService.getUserByEmail(email)
			if (existingUser) {
				return Send.conflict(reply, 'Account already exists')
			}


			// Create new user
			const user = await AuthService.createUser(email, password)

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
				secure: process.env.NODE_ENV === 'production', // Changed from secure: true
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			})

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Changed from secure: true
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			})

			const userData = {
				id: user.id,
				email: user.email,
				created_at: user.created_at
			}

			return Send.created(reply, userData, `Account created for: ${email}`)

		} catch (error) {
			console.error('Signup error:', error)
			return Send.internalError(reply, 'Failed to create account')
		}
	}

	static async login(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, password, twoFACode } = request.body as { email: string, password: string, twoFACode: string }

			const user = await AuthService.verifyUser(email, password)

			if (!user) {
				return Send.unauthorized(reply, 'Invalid email or password')
			}

			if (user.twoFAEnabled) {
				// if (!twoFACode) {
				// 	return Send.unauthorized(reply, '2FA Code is missing');
				// }
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
				secure: process.env.NODE_ENV === 'production', // Changed from secure: true
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			})

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Changed from secure: true
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			})

			const userData = {
				id: user.id,
				email: user.email,
				created_at: user.created_at
			}

			return Send.success(reply, userData, `Successful login for: ${email}`)

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

			// Clear the JWT cookies by setting them with past expiration
			reply.setCookie('accessToken', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 0 // This clears the cookie
			})

			reply.setCookie('refreshToken', '', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 0 // This clears the cookie
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

			// Rotate refresh token
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
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			})

			reply.setCookie('refreshToken', newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			})

			return Send.success(reply, null, 'Token refreshed successfully');

		} catch (error) {
			console.error('Token refresh error:', error);
			return Send.unauthorized(reply, 'Invalid or expired refresh token');
		}
	}

	// Setup 2FA: generate secret and QR code for user

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

	// Verify 2FA code and enable 2FA for user
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


	// Disable 2FA For current user.
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

	// "Google Callback" gere l'appel a GoogleOAuth2 verifie les tokens d'env obtenu sur Google Console
	// Verifie que les interactions de redirections sont en lien avec ce qui a ete declarer sur Google Console
	// Log l'user et genere un token si le callback a reussi
	// Si l'user n'existe pas on le cree en lui donnant son email comme username (A changer)

	static async googleCallback(request: FastifyRequest, reply: FastifyReply) {
		try {
			console.log('🔍 Google OAuth callback received');
			// console.log('🔍 Request URL:', request.url);
			// console.log('🔍 Request query:', request.query);

			const token = await (request.server as any).GoogleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
			// console.log('🔍 Token received:', token ? '***EXISTS***' : 'MISSING');

			// // 🚨 CRITICAL DEBUG: Log the actual token structure
			// console.log('🔍 Raw token object:', token);
			// console.log('🔍 Token type:', typeof token);
			// console.log('🔍 Token keys:', token ? Object.keys(token) : 'NO KEYS');

			// Try all possible access token locations
			const possibleTokens = {
				'token.access_token': token?.access_token,
				'token.accessToken': token?.accessToken,
				'token.token': token?.token,
				'token.token.access_token': token?.token?.access_token,
				'entire token as string': typeof token === 'string' ? token : null
			};

			// console.log('🔍 Possible token locations:', possibleTokens);

			// Find the actual access token (apparemment google renvoie des trucs differents parfois donc c'est bizarre)
			const googleAccessToken = token?.access_token ||
				token?.accessToken ||
				token?.token?.access_token ||
				(typeof token === 'string' ? token : null);

			// console.log('🔍 Google access token found:', !!googleAccessToken);
			// console.log('🔍 Google access token preview:', googleAccessToken ? googleAccessToken.substring(0, 20) + '...' : 'NONE');

			if (!googleAccessToken) {
				console.error('❌ No Google access token found in token object');
				console.log('🔍 Full token dump:', JSON.stringify(token, null, 2));
				return reply.redirect('http://localhost:5173/auth?error=no_google_token');
			}

			// Test the Google token by fetching user info
			console.log('🔍 Fetching Google user info...');
			const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: {
					'Authorization': `Bearer ${googleAccessToken}`
				}
			});

			if (!response.ok) {
				console.error('❌ Failed to fetch Google user info:', response.status, await response.text());
				return reply.redirect('http://localhost:5173/auth?error=invalid_google_token');
			}

			const googleUser = await response.json();
			console.log('✅ Google user data received:', { email: googleUser.email });

			// Check if user exists or create new one
			let user = await UserService.getUserByEmail(googleUser.email);

			if (!user) {
				console.log('🔍 Creating new user for:', googleUser.email);
				user = await AuthService.createGoogleUser(googleUser.email, googleUser.email);
				// MODAL POUR NAME SELECTION
				console.log('✅ Created new user:', user.id);
			} else {
				console.log('✅ Found existing user:', user.id);
			}

			// 2FA pour le signin on cree un token d'access temporaire pour ensuite acceder a la page OAuth2FA (ou on recupere en fait les infos de l'utilisateur avec un premier login)
			// Comme pour le login local.
			// L'idee de faire comme ca c'est de pas permettre a qqn sans 2FA d'acceder a l'api, mais a voir si il y a pas une faille de secu ici
			// Vu que le token temporaire est valable 1min.

			if (user.twoFAEnabled) {
				console.log('🔐 User has 2FA enabled, creating temporary session');

				// Create a temporary token for 2FA verification
				const tempToken = jwt.sign(
					{ userId: user.id, purpose: '2fa_pending_oauth' },
					authConfig.secret,
					{ expiresIn: '1m' } // 1 minutes to complete 2FA
				);

				// Set temporary cookie and redirect to 2FA verification page
				reply.setCookie('tempOAuthAuth', tempToken, {
					httpOnly: true,
					secure: false,
					sameSite: 'lax',
					path: '/',
					maxAge: 1 * 60 * 1000 // 1 minutes
				});

				console.log('🔐 Redirecting to OAuth 2FA page');
				return reply.redirect('http://localhost:5173/auth/oauth-2fa');
			}

			// Continue with normal JWT token generation if no 2FA...
			console.log('🔍 Generating JWT tokens...');
			// ...rest of existing code...
			const jwtAccessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			);

			const jwtRefreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			);

			console.log('🔍 JWT tokens generated successfully');
			console.log('🔍 JWT Access token preview:', jwtAccessToken.substring(0, 30) + '...');

			// Store refresh token in database
			await AuthService.updateRefreshToken(user.id, jwtRefreshToken);
			console.log('✅ Refresh token stored in database');

			// Set JWT cookies (these are your app's auth tokens)
			reply.setCookie('accessToken', jwtAccessToken, {
				httpOnly: true,
				secure: false, // localhost
				sameSite: 'lax',
				path: '/',
				maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', jwtRefreshToken, {
				httpOnly: true,
				secure: false, // localhost
				sameSite: 'lax',
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			});

			console.log('🍪 JWT cookies set successfully');
			console.log('🔄 Redirecting to frontend home page...');

			// Redirect to frontend
			return reply.redirect('http://localhost:5173/home');

		} catch (error) {
			console.error('❌ Google OAuth callback error:', error);
			return reply.redirect('http://localhost:5173/auth?error=oauth_failed');
		}
	}

	// Redirection vers la page de login google.

	static async googleSignin(request: FastifyRequest, reply: FastifyReply) {
		try {
			console.log('🔍 Initiating Google OAuth signin...');


			const oauth2 = (request.server as any).GoogleOAuth2;

			if (!oauth2) {
				console.error('❌ GoogleOAuth2 plugin not available');
				return reply.redirect('/auth?error=oauth_not_configured');
			}

			return oauth2.generateAuthorizationUri(request, reply);

		} catch (error) {
			console.error('❌ Google signin initiation error:', error);
			return reply.redirect('/auth?error=google_signin_failed');
		}
	}

	// Check le token JWT pendant le OAuth si le 2FA Est actif.
	static async checkOAuth2FAStatus(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { tempOAuthAuth } = request.cookies as { tempOAuthAuth: string };

			if (!tempOAuthAuth) {
				return Send.unauthorized(reply, 'No pending OAuth 2FA session');
			}

			// Verify temporary token is valid
			try {
				const decoded = jwt.verify(tempOAuthAuth, authConfig.secret) as { userId: number, purpose: string };

				if (decoded.purpose !== '2fa_pending_oauth') {
					return Send.unauthorized(reply, 'Invalid OAuth session');
				}

				return Send.success(reply, { userId: decoded.userId }, 'OAuth 2FA session active');
			} catch (jwtError) {
				return Send.unauthorized(reply, 'OAuth 2FA session expired');
			}

		} catch (error) {
			console.error('OAuth 2FA status check error:', error);
			return Send.internalError(reply, 'Failed to check OAuth 2FA status');
		}
	}

	//Verifie le 2FA Pour le Google OAuth
	static async verifyOAuth2FA(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { token } = request.body as { token: string };
			const { tempOAuthAuth } = request.cookies as { tempOAuthAuth: string };

			if (!tempOAuthAuth) {
				return Send.unauthorized(reply, '2FA verification session expired');
			}

			if (!token) {
				return Send.badRequest(reply, '2FA token required');
			}

			// Verify temporary token
			const decoded = jwt.verify(tempOAuthAuth, authConfig.secret) as { userId: number, purpose: string };

			if (decoded.purpose !== '2fa_pending_oauth') {
				return Send.unauthorized(reply, 'Invalid verification session');
			}

			// Verify 2FA code
			const isValid = await AuthService.verify2FACode(decoded.userId, token);
			if (!isValid) {
				return Send.unauthorized(reply, 'Invalid 2FA code');
			}

			// Get user data
			const user = await UserService.getUserById(decoded.userId);
			if (!user) {
				return Send.unauthorized(reply, 'User not found');
			}

			// Generate actual JWT tokens (same logic as in googleCallback)
			const accessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			);

			const refreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			);

			// Store refresh token and set cookies
			await AuthService.updateRefreshToken(user.id, refreshToken);

			reply.setCookie('accessToken', accessToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				path: '/',
				maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			});

			// Clear temporary auth cookie
			reply.setCookie('tempOAuthAuth', '', { maxAge: 0 });

			return Send.success(reply, { id: user.id, email: user.email }, 'OAuth 2FA verification successful');

		} catch (error) {
			console.error('OAuth 2FA verify error:', error);
			return Send.internalError(reply, 'Failed to verify 2FA');
		}
	}

	// DEPRECATED
	static async signupWithDisplayName(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { email, password, displayName } = request.body as {
				email: string;
				password: string;
				displayName: string;
			};

			// Check if user already exists
			const existingUser = await UserService.getUserByEmail(email);
			if (existingUser) {
				return Send.conflict(reply, 'Username already exists');
			}

			const isDisplayNameTaken = await UserService.isDisplayNameTaken(displayName);
			if (isDisplayNameTaken) {
				return Send.conflict(reply, 'Display name is already taken')
			}



			// Create user with display name - use the same pattern as regular signup
			const user = await AuthService.createUser(email, password)

			// Generate JWT tokens - use same pattern as regular signup
			const accessToken = jwt.sign(
				{ userId: user.id },
				authConfig.secret,
				{ expiresIn: authConfig.secret_expires_in }
			);

			const refreshToken = jwt.sign(
				{ userId: user.id },
				authConfig.refresh_secret,
				{ expiresIn: authConfig.refresh_secret_expires_in }
			);

			// Store refresh token in database
			await AuthService.updateRefreshToken(user.id, refreshToken);

			console.log('🍪 Setting cookies for new user with display name:', user.id);

			// Set HttpOnly cookies - use same pattern as regular signup
			reply.setCookie('accessToken', accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 15 * 60 * 1000
			});

			reply.setCookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				domain: undefined,
				path: '/',
				maxAge: 24 * 60 * 60 * 1000
			});

			const userData = {
				id: user.id,
				email: user.email,
				displayName: user.displayName,
				created_at: user.created_at
			};

			return Send.created(reply, userData, `Account created for: ${email}`);

		} catch (error) {
			console.error('Signup with display name error:', error);
			return Send.internalError(reply, 'Failed to create account');
		}
	}



}