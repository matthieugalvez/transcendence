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
      const token = req.cookies?.accessToken;

      if (token) {
        try {
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

    if (!userId || !connection) {
      console.log('WebSocket connection rejected: Missing authentication or invalid connection');
      return;
    }

    console.log(`User ${userId} connected to online status WebSocket`);

    // Add user to online list
    UserOnline.addOnlineUser(userId, connection);

    // Send welcome message
    try {
      if (typeof connection.send === 'function') {
        connection.send(JSON.stringify({
          type: 'welcome',
          message: 'Connected successfully',
          userId: userId
        }));
        console.log('Welcome message sent successfully');
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }

    // Send current online users list to the newly connected user
    try {
      const onlineUsers = UserOnline.getOnlineUsers();
      for (const onlineUserId of onlineUsers) {
        connection.send(JSON.stringify({
          type: 'status',
          userId: onlineUserId,
          online: true
        }));
      }
      console.log(`Sent ${onlineUsers.length} online users to ${userId}`);
    } catch (error) {
      console.error('Error sending online users list:', error);
    }

    // Broadcast that this user is now online to all other users
    try {
      UserOnline.broadcastToAll(JSON.stringify({
        type: 'status',
        userId: userId,
        online: true
      }));
    } catch (error) {
      console.error('Error broadcasting online status:', error);
    }

    // Handle disconnect
    connection.on('close', () => {
      console.log(`User ${userId} disconnected from online status WebSocket`);
      UserOnline.removeOnlineUser(userId);

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
