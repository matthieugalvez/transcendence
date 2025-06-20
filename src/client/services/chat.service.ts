import { ApiClient } from '../utils/apiclient.utils';

export class	ChatService {
	static async	getAllMessages(): Promise<Array<{	id: number,
														sender_id: number,
														receiver_id: number,
														created_at: number,
														updated_at: number,
														content: string }>> {
		try {
			const	send_response = await ApiClient.authenticatedFetch('/api/chat/send-messages');
			const	send_data = await send_response.json();
			
			if (!send_data.success) {
				throw new Error(send_data.error || 'Failed to get send messages');
			}

			const	received_response = await ApiClient.authenticatedFetch('/api/chat/received-messages');
			const	received_data = await received_response.json();

			if (!received_data.success) {
				throw new Error(received_data.error || 'Failed to get received messages');
			}

			return send_data.data.users.concat(received_data.data.users);
		}
		catch (error) {
			console.error('Error fetching messages:', error);
			throw new Error('Failed to fetch messages.');
		}
	}

	static async	postMessage(receiver_id: number, content: string): Promise<{	success: boolean,
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

	static async	deleteMessage(message_id: number): Promise<{	success: boolean,
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
