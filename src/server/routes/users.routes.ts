import { FastifyInstance } from 'fastify'
import { userSchema } from '../validations/auth.schema'
import ValidationMiddleware from '../middlewares/validation.middleware'
import { UserController } from '../controllers/user.controller'
import AuthMiddleware from '../middlewares/auth.middleware'
import { pipeline } from 'stream';
import { promisify } from 'util';
import { UserOnline } from '../services/users.service'
import jsonwebtoken from 'jsonwebtoken';
import authConfig from '../config/auth.config';
const pump = promisify(pipeline);


export async function registerUserStatusWebSocket(fastify: FastifyInstance) {
  fastify.get('/ws/status', {
    websocket: true
  }, async (connection, req) => {
    let userId;

    try {
      // Extract authentication from cookies
      const token = req.cookies?.accessToken;

      if (token) {
        try {
          // Use your existing jwt verification with the secret from authConfig
          const decoded = jsonwebtoken.verify(token, authConfig.secret) as { userId: string };
          userId = decoded.userId;
          console.log('WebSocket authenticated user:', userId);
        } catch (jwtError) {
          console.error('Invalid JWT token in cookie:', jwtError);
        }
      } else {
        console.log('No access token in cookies');
      }
    } catch (error) {
      console.error('Error authenticating WebSocket connection:', error);
    }

    // Fix: Check for userId and connection
    if (!userId || !connection) {
      console.log('WebSocket connection rejected: Missing authentication or invalid connection');
      if (connection && connection.socket) {
        connection.socket.close(1008, 'Unauthorized');
      }
      return;
    }

    console.log(`User ${userId} connected to online status WebSocket`);

    // Fix: Use connection.socket instead of connection directly
    UserOnline.addOnlineUser(userId, connection.socket);

    // Broadcast online status
    try {
      UserOnline.broadcastToAll(JSON.stringify({
        type: 'status',
        userId: userId,
        online: true
      }));
    } catch (error) {
      console.error('Error broadcasting online status:', error);
    }

    // Handle disconnect - Fix: Use connection.socket.on
    connection.on('close', () => {
      console.log(`User ${userId} disconnected from online status WebSocket`);
      UserOnline.removeOnlineUser(userId);

      // Broadcast offline status
      try {
        UserOnline.broadcastToAll(JSON.stringify({
          type: 'status',
          userId: userId,
          online: false
        }));
      } catch (error) {
        console.error('Error broadcasting offline status:', error);
      }
    });

    // Handle errors
    connection.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      UserOnline.removeOnlineUser(userId);
    });
  });
}

export default async function userRoutes(fastify: FastifyInstance) {

	await fastify.register(import('@fastify/multipart'));
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

	fastify.post('/me/avatar', {
		preHandler:
			[AuthMiddleware.authenticateUser]
	}, UserController.uploadAvatar);

	fastify.get('/check-display-name', {
		preHandler: AuthMiddleware.authenticateUser
	}, UserController.checkDisplayNameAvailability);

	// fastify.get('/users/profile/:userId', {
	// 	preHandler: [AuthMiddleware.authenticateUser]
	// }, UserController.getUserProfile);

	fastify.get('/users/profile/:displayName', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getUserProfileByDisplayName);

	fastify.get('/users/search', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.searchUsers);

	fastify.get('/users/:userId/online', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, UserController.getOnlineStatus);
}
