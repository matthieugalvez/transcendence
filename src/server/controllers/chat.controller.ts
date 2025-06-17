import { FastifyRequest, FastifyReply } from 'fastify'
import { ChatService } from '../services/chat.service'
import { ResponseUtils as Send } from '../utils/response.utils'

export class	ChatController {
	static async	getSendMessages(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;

			const	SendMessages = await ChatService.getSendMessages(userId);

			return Send.success(reply, SendMessages, 'Send Messages retrieved successfully');
		}
		catch (error) {
			console.error('Error fetching send messages:', error);
			return Send.internalError(reply, 'Failed to fetch send messages');
		}
	}

	static async	getRecievedMessages(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;

			const	RecievedMessages = await ChatService.getRecievedMessages(userId);

			return Send.success(reply, RecievedMessages, 'Recieved Messages retrieved successfully');
		}
		catch (error) {
			console.error('Error fetching recieved messages:', error);
			return Send.internalError(reply, 'Failed to fetch recieved messages');
		}
	}

	static async	postMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	userId = ( request as any ).userId;
			const	{ reciever_id, content } = request.body as { reciever_id: number, content: string };

			const	NewMessage = await ChatService.createMessage(userId, reciever_id, content);

			return Send.created(reply, NewMessage, 'Message created successfully');
		}
		catch (error) {
			console.error('Error creating message:', error);
			return Send.internalError(reply, 'Failed to create message');
		}
	}

	static async	editMessage(request: FastifyRequest, reply: FastifyReply) {
		try {
			const	messageId = ( request as any ).messageId;
			const	{ content } = request.body as { content: string };

			const	Message = await ChatService.editMessage(messageId, content);

			return Send.success(reply, Message, 'Edited message successfully');
		}
		catch (error) {
			console.error('Error editing message:', error);
			return Send.internalError(reply, 'Failed to edit message');
		}
	}
}
