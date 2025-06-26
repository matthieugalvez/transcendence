import { ApiClient } from '../utils/apiclient.utils';

export class	ChatService {
	static async	getMessages(otheruser_id: string, last_fetch?: Date): Promise<Array<{	id: string,
																							sender_id: string,
																							receiver_id: string,
																							created_at: string,
																							updated_at: string,
																							content: string }>> {
		try {
			if (last_fetch === undefined) {
				last_fetch = new Date(0);
			};
			const	response = await ApiClient.authenticatedFetch(
				`/api/chat/messages?otheruser_id=${otheruser_id}&last_fetch=${last_fetch.toISOString()}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const	data = await response.json();
			
			if (!data.success) {
				throw new Error(data.error || 'Failed to get messages');
			}

			return data.data.users.sort((a, b) => a.created_at.localeCompare(b.created_at));
		}
		catch (error) {
			console.error('Error fetching messages:', error);
			throw new Error('Failed to fetch messages.');
		}
	}

	static async	postMessage(receiver_id: string, content: string): Promise<{	success: boolean,
																					error?: string,
																					details?: any[] }> {
		try {
			const	response = await ApiClient.authenticatedFetch('/api/chat/post', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ receiver_id, content })
			});
			const	data = await response.json();

			if (!data.success) {
				return {
					success: false,
					error: data.error || 'failed to post message',
					details: data.details || []
				};
			}

			return { success: true };
		}
		catch (error) {
			console.error('Error posting message:', error);
			return {
				success: false,
				error: 'Failed to post message'
			};
		}
	}

	static async	editMessage(message_id: number, content: string): Promise<{	success: boolean,
																				error?: string,
																				details?: any[] }> {
		try {
			const	response = await ApiClient.authenticatedFetch('/api/chat/edit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message_id, content })
			});
			const	data = await response.json();

			if (!data.success) {
				return {
					success: false,
					error: data.error || 'failed to edit message',
					details: data.details || []
				};
			}

			return { success: true };
		}
		catch (error) {
			console.error('Error editing message:', error);
			return {
				success: false,
				error: 'Failed to edit message'
			};
		}
	}

	static async	deleteMessage(message_id: string): Promise<{	success: boolean,
																	error?: string,
																	details?: any[] }> {
		try {
			const	response = await ApiClient.authenticatedFetch('/api/chat/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message_id })
			});
			const	data = await response.json();

			if (!data.success) {
				return {
					success: false,
					error: data.error || 'failed to delete message',
					details: data.details || []
				};
			}

			return { success: true };
		}
		catch (error) {
			console.error('Error deleting message:', error);
			return {
				success: false,
				error: 'Failed to delete message'
			};
		}
	}
}
