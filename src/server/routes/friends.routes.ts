import { FastifyInstance } from 'fastify'
import { FriendsController } from '../controllers/friends.controller.js'
import AuthMiddleware from '../middlewares/auth.middleware.js'

export default async function friendsRoutes(fastify: FastifyInstance) {
	// Get user's friends (protected)
	fastify.get('/friends', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.getFriends);

	// Send friend request (protected)
	fastify.post('/friends/request', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.sendFriendRequest);

	fastify.post('/friends/block/:otherUserId', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.blockUser);

	// Accept friend request (protected)
	fastify.put('/friends/request/:requestId/accept', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.acceptFriendRequest);

	fastify.delete('/friends/request/:requestId/reject', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.rejectFriendRequest);

	fastify.get('/friends/status/:otherUserId', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.getFriendshipStatus);

	// Remove friend endpoint:
	fastify.delete('/friends/:friendId', {
		preHandler: [AuthMiddleware.authenticateUser]
	}, FriendsController.removeFriend);

	// - GET /friends/requests (get pending requests)
	// - DELETE /friends/:friendId (remove friend)
	// - PUT /friends/request/:requestId/reject (reject request)
}
