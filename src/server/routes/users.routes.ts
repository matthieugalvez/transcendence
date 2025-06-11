import { FastifyInstance } from 'fastify'
import { userSchema } from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { UserController } from '../controllers/user.controller'
import AuthMiddleware from '../middlewares/auth.middleware'

export default async function userRoutes(fastify: FastifyInstance) {
    // Get all users (protected)
    fastify.get('/users', {
        preHandler: [AuthMiddleware.authenticateUser]
    }, UserController.getAllUsers);

    // Get current user (protected)
    fastify.get('/users/me', {
        preHandler: [AuthMiddleware.authenticateUser]
    }, UserController.getCurrentUser);

    // Check if user exists
    fastify.get('/users/check/:name', UserController.checkUserExists);

    // Update display name (protected + validated)
    fastify.put('/me/display-name', {
        preHandler: [
            AuthMiddleware.authenticateUser,
            ValidationMiddleware.validateBody(userSchema.updateDisplayName)
        ]
    }, UserController.changeUserName);

    // Update password (protected + validated)
    fastify.put('/me/password', {
        preHandler: [
            AuthMiddleware.authenticateUser,
            ValidationMiddleware.validateBody(userSchema.updatePassword)
        ]
    }, UserController.changeUserPassword);
}