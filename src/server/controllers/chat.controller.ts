import { FastifyRequest, FastifyReply } from 'fastify'
import { ChatService } from '../services/chat.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class	ChatController {
	static async	getMessages(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;
			const	{ otheruser_id, last_fetch } = request.body as { otheruser_id: string, last_fetch?: Date };

			const	messages = await ChatService.getMessages(userId, otheruser_id, last_fetch);
			
			const messagesData = {
				users: messages.map(message => ({
					id: message.id,
					sender_id: message.sender_id,
					receiver_id: message.receiver_id,
					created_at: message.created_at,
					updated_at: message.updated_at,
					content: message.content
				})),
				count: messages.length
			}

			return Send.success(reply, messagesData, 'Messages retrieved successfully');
		}
		catch (error) {
			console.error('Error fetching messages:', error);
			return Send.internalError(reply, 'Failed to fetch messages');
		}
	}

	static async	postMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;
			const	{ receiver_id, content } = request.body as { receiver_id: string, content: string };

			const	NewMessage = await ChatService.createMessage(userId, receiver_id, content);

			return Send.created(reply, NewMessage, 'Message created successfully');
		}
		catch (error) {
			console.error('Error creating message:', error);
			return Send.internalError(reply, 'Failed to create message');
		}
	}

	static async	editMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	{ message_id, content } = request.body as { message_id: string, content: string };

			const	Message = await ChatService.editMessage(message_id, content);

			return Send.success(reply, Message, 'Edited message successfully');
		}
		catch (error) {
			console.error('Error editing message:', error);
			return Send.internalError(reply, 'Failed to edit message');
		}
	}

	static async	deleteMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	{ message_id } = request.body as { message_id: string };

			const	Message = await ChatService.deleteMessage(message_id);

			return Send.success(reply, Message, 'Deleted message successfully');
		}
		catch (error) {
			console.error('Error deleting message:', error);
			return Send.internalError(reply, 'Failed to delete message');
		}
	}
}
