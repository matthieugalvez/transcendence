import { prisma } from '../db'
import { User } from '@prisma/client'
import { ChatSession } from '@prisma/client'

export class ChatService {

	static async	createChat(u1_id: number, u2_id: number) {
		return await prisma.user.create({
			data: {
				u1_id,
				u2_id
			}
		})
	}

	static async	getChatbyId(id: number) {
		return await prisma.chatsession.findUnique({
			where: { id }
		})
	}
}
