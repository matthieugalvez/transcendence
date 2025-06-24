import { ApiClient } from '../utils/apiclient.utils';

export class FriendService {
    static async sendFriendRequest(userId: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await ApiClient.authenticatedFetch('/api/friends/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipientId: userId }) // Changed from userId to recipientId
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, message: 'Failed to send friend request' };
        }
    }

    static async getFriendRequests(): Promise<any[]> {
        try {
            const response = await ApiClient.authenticatedFetch('/api/friends');
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            return [];
        }
    }

    static async acceptFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await ApiClient.authenticatedFetch(`/api/friends/request/${requestId}/accept`, {
                method: 'PUT' // Changed from POST to PUT to match your routes
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, message: 'Failed to accept friend request' };
        }
    }

    static async rejectFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await ApiClient.authenticatedFetch(`/api/friends/request/${requestId}/reject`, {
                method: 'DELETE' // Changed from POST to DELETE to match your routes
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            return { success: false, message: 'Failed to reject friend request' };
        }
    }
}