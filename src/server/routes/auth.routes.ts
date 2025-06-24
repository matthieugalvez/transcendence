import { FastifyInstance } from 'fastify'
import { authSchema } from '../validations/auth.schema.js'
import ValidationMiddleware from '../middlewares/validation.middleware.js'
import { AuthController } from '../controllers/auth.controller.js'
import AuthMiddleware from '../middlewares/auth.middleware.js'
import OAuth2 from '@fastify/oauth2'
import { googleOAuth2Options } from '../config/google.config.js'


export default async function authRoutes(fastify: FastifyInstance) {

	await fastify.register(OAuth2, googleOAuth2Options);

	fastify.post('/login', {
		preHandler: ValidationMiddleware.validateBody(authSchema.login)
	}, AuthController.login)

	// Public but protected by Google OAuth2

	fastify.get('/oauth2/google', AuthController.googleSignin);
	fastify.get('/oauth2/google/callback', AuthController.googleCallback);
	fastify.get('/google/signin', AuthController.googleSignin);
	fastify.get('/oauth-2fa/status', AuthController.checkOAuth2FAStatus);
	fastify.post('/oauth-2fa/verify', AuthController.verifyOAuth2FA);

	fastify.post('/signup', {
		preHandler: ValidationMiddleware.validateBody(authSchema.signup),
	}, AuthController.signup)

	// PROTECTED ROUTES
	fastify.post('/logout', {
		preHandler: AuthMiddleware.authenticateUser
	}, AuthController.logout)

	// Refresh token route (uses refresh token validation)
	fastify.post('/refresh', {
		preHandler: AuthMiddleware.refreshTokenValidation
	}, AuthController.refreshToken)

	fastify.post('/2fa/setup', {
		preHandler: AuthMiddleware.authenticateUser
	}, AuthController.setup2FA);

	fastify.post('/2fa/verify', {
		preHandler: AuthMiddleware.authenticateUser
	}, AuthController.verify2FA);

	fastify.post('/2fa/disable', {
		preHandler: AuthMiddleware.authenticateUser
	}, AuthController.disable2FA);




}


