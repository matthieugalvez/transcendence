import { prisma } from '../db.js'

export class ChatService {
	static async	createMessage(sender_id: string, receiver_id: string, content: string) {
		return await prisma.message.create({
			data: {
				sender_id,
				receiver_id,
				content
			}
		});
	}

	static async	editMessage(id: string, content: string) {
		return await prisma.message.update({
			where: { id },
			data: { content },
		});
	}

	static async	deleteMessage(id: string) {
		const	msg = await prisma.message.findFirst({
			where: { id },
		});

		if (!msg) {
			return;
		}
		return await prisma.message.update({
			where: { id },
			data: { deleted: !msg.deleted },
		});
	}

	static async	getMessages(userId: string, otheruserId: string, last_fetch: Date) {
		if (!last_fetch) {
			last_fetch = new Date(0);
		}
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
				],
				AND: [
					{
					OR: [
						{
							created_at: {
								gte: last_fetch,
							},
						},
						{
							updated_at: {
								gte: last_fetch,
							}
						},
						],
					},
				]
			}
		});
	}
}
