import { ApiClient } from '../utils/apiclient.utils';

export class	ChatService {
	static async	getAllMessages(): Promise<Array<{	id: number,
														sender_id: number,
														reciever_id: number,
														created_at: number,
														updated_at: number,
														content: string }>> {
		try {
			const	send_response = await ApiClient.authenticatedFetch('api/chat/:send-messages');
			const	send_data = await send_response.json();
			
			if (!send_data.success) {
				throw new Error(send_data.error || 'Failed to get send messages');
			}

			const	recieved_response = await ApiClient.authenticatedFetch('api/chat/:recieved-messages');
			const	recieved_data = await recieved_response.json();

			if (!recieved_data.success) {
				throw new Error(recieved_data.error || 'Failed to get recieved messages');
			}

			return send_data.data && recieved_data.data;
		}
		catch (error) {
			console.error('Error fetching messages:', error);
			throw new Error('Failed to fetch messages.');
		}
	}

	static async	postMessage(reciever_id: number, content: string): Promise<{	success: boolean,
																					error?: string,
																					details?: any[] }> {
		try {
			const	response = await ApiClient.authenticatedFetch('/api/chat/:post', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ reciever_id, content })
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
			const	response = await ApiClient.authenticatedFetch('/api/chat/:edit', {
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
}
