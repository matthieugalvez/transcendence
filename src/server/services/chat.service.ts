import { prisma } from '../db'

export class ChatService {
	static async	createMessage(sender_id: number, receiver_id: number, content: string) {
		return await prisma.message.create({
			data: {
				sender_id,
				receiver_id,
				content
			}
		});
	}

	static async	editMessage(id: number, content: string) {
		return await prisma.message.update({
			where: { id },
			data: { content },
		})
	}

	static async	deleteMessage(id: number) {
		return await prisma.message.delete({
			where: { id }
		})
	}

	static async	getMessages(userId: number, otheruserId: number) {
		return await prisma.message.findMany({
			where: {
				OR: [
					{
						sender_id: userId,
						receiver_id: otheruserId
					},
					{
						sender_id: otheruserId,
						receiver_id: userId
					}
				]
			}
		})
	}
}
