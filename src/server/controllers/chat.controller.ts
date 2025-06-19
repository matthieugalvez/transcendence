import { FastifyRequest, FastifyReply } from 'fastify'
import { ChatService } from '../services/chat.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class	ChatController {
	static async	getSendMessages(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;

			const	messages = await ChatService.getSendMessages(userId);
			
			const messagesData = {
				users: messages.map(message => ({
					id: message.id,
					sender_id: message.sender_id,
					receiver_id: message.receiver_id,
					created_at: message.created_at.toUTCString(),
					updated_at: message.updated_at.toUTCString(),
					content: message.content
				})),
				count: messages.length
			}

			return Send.success(reply, messagesData, 'Send Messages retrieved successfully');
		}
		catch (error) {
			console.error('Error fetching send messages:', error);
			return Send.internalError(reply, 'Failed to fetch send messages');
		}
	}

	static async	getReceivedMessages(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;

			const	messages = await ChatService.getReceivedMessages(userId);

			const messagesData = {
				users: messages.map(message => ({
					id: message.id,
					sender_id: message.sender_id,
					receiver_id: message.receiver_id,
					created_at: message.created_at.toUTCString(),
					updated_at: message.updated_at.toUTCString(),
					content: message.content
				})),
				count: messages.length
			}

			return Send.success(reply, messagesData, 'Received Messages retrieved successfully');
		}
		catch (error) {
			console.error('Error fetching received messages:', error);
			return Send.internalError(reply, 'Failed to fetch received messages');
		}
	}

	static async	postMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;
			const	{ receiver_id, content } = request.body as { receiver_id: number, content: string };

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
			const	{ message_id, content } = request.body as { message_id: number, content: string };

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
			const	{ message_id } = request.body as { message_id: number };

			const	Message = await ChatService.deleteMessage(message_id);

			return Send.success(reply, Message, 'Deleted message successfully');
		}
		catch (error) {
			console.error('Error deleting message:', error);
			return Send.internalError(reply, 'Failed to delete message');
		}
	}
}
