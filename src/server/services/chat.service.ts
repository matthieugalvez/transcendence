import { prisma } from '../db'

export class ChatService {
	static async	createMessage(sender_id: number, reciever_id: number, content: string) {
		return await prisma.message.create({
			data: {
				sender_id,
				reciever_id,
				content
			}
		});
	}

	static async	editMessage(id: number, content: string) {
		return await prisma.message.update({
			where: { id },
			data: { content }
		})
	}

	static async	getSendMessages(sender_id: number) {
		return await prisma.message.findMany({
			where: { sender_id }
		})
	}

	static async	getRecievedMessages(reciever_id: number) {
		return await prisma.message.findMany({
			where: { reciever_id }
		})
	}
}
