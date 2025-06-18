import { FastifyRequest, FastifyReply } from 'fastify'
import { FriendService } from '../services/friends.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class FriendsController {
	static async getFriends(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const friends = await FriendService.getUserFriends(userId);
			return Send.success(reply, friends, 'Friends retrieved successfully');

		} catch (error) {
			console.error('Get friends error:', error);
			return Send.internalError(reply, 'Failed to get friends');
		}
	}

	static async sendFriendRequest(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { recipientId } = request.body as { recipientId: string };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const result = await FriendService.sendFriendRequest(Number(userId), Number(recipientId));
			return Send.created(reply, result, 'Friend request sent successfully');

		} catch (error) {
			console.error('Send friend request error:', error);
			if (error.message === 'Friend request already sent') {
				return Send.conflict(reply, error.message);
			}
			return Send.internalError(reply, 'Failed to send friend request');
		}
	}

	static async acceptFriendRequest(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { requestId } = request.params as { requestId: string };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			const result = await FriendService.acceptFriendRequest(requestId);
			return Send.success(reply, result, 'Friend request accepted');

		} catch (error) {
			console.error('Accept friend request error:', error);
			return Send.internalError(reply, 'Failed to accept friend request');
		}
	}

	static async getFriendshipStatus(request: FastifyRequest, reply: FastifyReply) {
		const userId = (request as any).userId;
		const { otherUserId } = request.params as { otherUserId : string};
		const status = await FriendService.getFriendshipStatus(userId, otherUserId);
		return Send.success(reply, { status });
	}

	static async removeFriend(request: FastifyRequest, reply: FastifyReply)  {
		const userId = (request as any).userId;
		const { friendId } = request.params as { friendId: string };
		await FriendService.removeFriend(userId, friendId);
		return Send.success(reply, null, 'Friend removed');
	}


}