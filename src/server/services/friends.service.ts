import {prisma} from '../db'
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

  // Get user's friends
  static async getUserFriends(userId: number) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        status: FriendshipStatus.ACCEPTED
      },
      include: {
        sender: {
          select: { id: true, username: true, email: true }
        },
        receiver: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    return friendships.map(friendship =>
      friendship.senderId === userId ? friendship.receiver : friendship.sender
    );
  }

  // Get pending friend requests
  static async getPendingRequests(userId: number) {
    return await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING
      },
      include: {
        sender: {
          select: { id: true, username: true, email: true }
        }
      }
    });
  }

static async getFriendshipStatus(userId: string, otherUserId: string) {
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }
    });

    let status: 'friends' | 'pending' | 'incoming' | 'none' = 'none';
    let requestId: string | undefined = undefined;

    if (friendship) {
        if (friendship.status === 'ACCEPTED') {
            status = 'friends';
        } else if (friendship.status === 'PENDING') {
            if (friendship.senderId === userId) {
                status = 'pending'; // You sent the request
                requestId = friendship.id;
            } else if (friendship.receiverId === userId) {
                status = 'incoming'; // You received the request
                requestId = friendship.id;
            }
        }
    }

    return { status, requestId };
}
}