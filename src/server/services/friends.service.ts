import { prisma } from '../db.js'
import { FriendshipStatus } from '@prisma/client'


export class FriendService {
	// Send friend request
	static async sendFriendRequest(senderId: string, receiverId: string) {
		if (senderId === receiverId) {
			throw new Error("Cannot send friend request to yourself");
		}

		return await prisma.friendship.create({
			data: {
				senderId,
				receiverId,
				status: FriendshipStatus.PENDING
			}
		});
	}

	// Accept friend request
	static async acceptFriendRequest(friendshipId: string) {
		return await prisma.friendship.update({
			where: { id: friendshipId },
			data: { status: FriendshipStatus.ACCEPTED }
		});
	}

	static async removeFriend(userId: string, friendId: string) {
		// First find the friendship between these users
		const friendship = await prisma.friendship.findFirst({
			where: {
				OR: [
					{ senderId: userId, receiverId: friendId },
					{ senderId: friendId, receiverId: userId }
				],
				status: FriendshipStatus.ACCEPTED
			}
		});

		if (!friendship) {
			throw new Error("Friendship not found");
		}

		// Delete the friendship
		return await prisma.friendship.delete({
			where: { id: friendship.id }
		});
	}

	static async rejectFriendRequest(requestId: string) {
    const deletedFriendship = await prisma.friendship.delete({
        where: {
            id: requestId
        }
    });

    return deletedFriendship;
}

	static async getAllUserFriendships(userId: string) {
    return await prisma.friendship.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: {
            sender: {
                select: {
                    id: true,
                    displayName: true,
                    avatar: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    displayName: true,
                    avatar: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

	// Get user's friends
	static async getUserFriends(userId: string) {
		const friendships = await prisma.friendship.findMany({
			where: {
				OR: [
					{ senderId: userId },
					{ receiverId: userId },
				]
			},
			include: {
				sender: {
					select: { id: true, displayName: true, email: true }
				},
				receiver: {
					select: { id: true, displayName: true, email: true }
				}
			}
		});

		return friendships.map(friendship =>
			friendship.senderId === userId ? friendship.receiver : friendship.sender
		);
	}

	// Get pending friend requests
	static async getPendingRequests(userId: string) {
		return await prisma.friendship.findMany({
			where: {
				receiverId: userId,
				status: FriendshipStatus.PENDING
			},
			include: {
				sender: {
					select: { id: true, displayName: true, email: true }
				}
			}
		});
	}

	static async unblockUser(userId: string, otherUserId: string) {
		const	friendship = await prisma.friendship.findFirst ({
			where: {
				senderId: userId,
				receiverId: otherUserId,
//				status: FriendshipStatus.BLOCKED
			}
		});

		if (!friendship) {
			return;
		};
		return await prisma.friendship.delete ({
			where: { id: friendship.id }
		});
	}

	static async blockUser(userId: string, otherUserId: string) {
		const	friendship = await prisma.friendship.findFirst ({
			where: {
				senderId: userId,
				receiverId: otherUserId,
			},
		});

		if (!friendship) {
			return await prisma.friendship.create({
				data: {
					senderId: userId,
					receiverId: otherUserId,
					status: FriendshipStatus.BLOCKED,
				},
			});
		} else {
			return await prisma.friendship.update({
				where: {
					id: friendship.id,
				},
				data: { status: FriendshipStatus.BLOCKED },
			});
		};
	}

	static async getFriendshipStatus(userId: string, otherUserId: string) {
		const friendship = await prisma.friendship.findFirst({
			where: {
//				OR: [
					 senderId: userId, receiverId: otherUserId,
//					{ senderId: otherUserId, receiverId: userId }
//				]
			}
		});

		let status: 'friends' | 'pending' | 'incoming' | 'blocked' | 'none' = 'none';
		let requestId: string | undefined = undefined;

		if (friendship) {
			if (friendship.status === 'BLOCKED') {
				status = 'blocked';
			} else if (friendship.status === 'ACCEPTED') {
				status = 'friends';
			} else if (friendship.status === 'PENDING') {
				if (friendship.senderId === userId) {
					status = 'pending';
					requestId = friendship.id;
				} else if (friendship.receiverId === userId) {
					status = 'incoming';
					requestId = friendship.id;
				}
			}
		}

		return { status, requestId };
	}
}
