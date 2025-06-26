import { FastifyRequest, FastifyReply } from 'fastify'
import { FriendService } from '../services/friends.service.js'
import { ResponseUtils as Send } from '../utils/response.utils.js'

export class FriendsController {
    static async getFriends(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).userId;
            console.log('🔍 Fetching ALL friendships for user:', userId);

            // Use the new method that returns ALL friendship objects
            const friendships = await FriendService.getAllUserFriendships(userId);

            console.log(`📊 Found ${friendships.length} total friendships:`, friendships.map(f => ({
                id: f.id,
                sender: f.sender.displayName,
                receiver: f.receiver.displayName,
                status: f.status
            })));

            return {
                success: true,
                message: 'Friends retrieved successfully',
                data: friendships, // Now returns friendship objects with status
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error fetching friends:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch friends',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

	static async sendFriendRequest(request: FastifyRequest, reply: FastifyReply) {
		try {
			const userId = (request as any).userId;
			const { recipientId } = request.body as { recipientId: string };

			if (!userId) {
				return Send.unauthorized(reply, 'Authentication required');
			}

			// Use string IDs directly
			const result = await FriendService.sendFriendRequest(userId, recipientId);
			return Send.created(reply, result, 'Friend request sent successfully');

		} catch (error) {
			console.error('Send friend request error:', error);
			if (error instanceof Error && error.message === 'Friend request already sent') {
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
		const { otherUserId } = request.params as { otherUserId: string };
		const { status, requestId } = await FriendService.getFriendshipStatus(userId, otherUserId);
		return Send.success(reply, { status, requestId });
	}

	static async removeFriend(request: FastifyRequest, reply: FastifyReply) {
		const userId = (request as any).userId;
		const { friendId } = request.params as { friendId: string };
		await FriendService.removeFriend(userId, friendId);
		return Send.success(reply, null, 'Friend removed');
	}

	    static async rejectFriendRequest(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).userId;
            const { requestId } = request.params as { requestId: string };

            if (!userId) {
                return Send.unauthorized(reply, 'Authentication required');
            }

            const result = await FriendService.rejectFriendRequest(requestId);
            return Send.success(reply, result, 'Friend request rejected');

        } catch (error) {
            console.error('Reject friend request error:', error);
            return Send.internalError(reply, 'Failed to reject friend request');
        }
    }


}