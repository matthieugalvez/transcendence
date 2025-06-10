import { FastifyInstance } from 'fastify'
import authSchema from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { AuthController } from '../controllers/auth.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

export default async function authRoutes(fastify: FastifyInstance) {
	// Register cookie plugin

	// PUBLIC ROUTES
	fastify.post('/signup', {
		preHandler: [
			ValidationMiddleware.validateBody(authSchema.signup),
		]
	}, AuthController.signup)

	fastify.post('/login', {
		preHandler: ValidationMiddleware.validateBody(authSchema.login)
	}, AuthController.login)

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

	fastify.post('/google', {
        preHandler: AuthMiddleware.authenticateUser
    }, AuthController.googleSignin);

}


// export async function googleRoutes(fastify: FastifyInstance) {
// fastify.get('/oauth2/google/callback', async (request, reply) => {
//     const token = await fastify.googleOAuth2Options.getAccessTokenFromAuthorizationCodeFlow(request);
//     // ...handle user info, session, etc.
// });
// }

