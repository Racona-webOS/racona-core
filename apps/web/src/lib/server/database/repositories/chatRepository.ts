import db from '$lib/server/database';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { conversations, messages } from '@racona/database/schemas';
import type { Conversation, Message } from '@racona/database/schemas';

export interface ConversationWithLastMessage extends Conversation {
	lastMessage?: Message;
	unreadCount: number;
	otherUserId: number;
	otherUserName: string;
	otherUserImage: string | null;
}

export interface MessageWithSender extends Message {
	senderName: string;
	senderImage: string | null;
}

export class ChatRepository {
	/**
	 * Get or create conversation between two users
	 */
	async getOrCreateConversation(userId1: number, userId2: number): Promise<Conversation> {
		// Check if conversation already exists (in either direction)
		const existing = await db.query.conversations.findFirst({
			where: or(
				and(eq(conversations.participant1Id, userId1), eq(conversations.participant2Id, userId2)),
				and(eq(conversations.participant1Id, userId2), eq(conversations.participant2Id, userId1))
			)
		});

		if (existing) {
			return existing;
		}

		// Create new conversation
		const [newConversation] = await db
			.insert(conversations)
			.values({
				participant1Id: userId1,
				participant2Id: userId2
			})
			.returning();

		return newConversation;
	}

	/**
	 * Get all conversations for a user with last message and unread count
	 */
	async getUserConversations(userId: number): Promise<ConversationWithLastMessage[]> {
		const userConversations = await db.query.conversations.findMany({
			where: or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
			orderBy: [desc(conversations.lastMessageAt)]
		});

		const result: ConversationWithLastMessage[] = [];

		for (const conv of userConversations) {
			const otherUserId =
				conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

			// Get other user info
			const otherUser = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, otherUserId),
				columns: {
					id: true,
					name: true,
					image: true
				}
			});

			// Get last message
			const lastMessage = await db.query.messages.findFirst({
				where: eq(messages.conversationId, conv.id),
				orderBy: [desc(messages.sentAt)]
			});

			// Count unread messages
			const unreadResult = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(messages)
				.where(
					and(
						eq(messages.conversationId, conv.id),
						eq(messages.isRead, false),
						eq(messages.senderId, otherUserId)
					)
				);

			result.push({
				...conv,
				lastMessage,
				unreadCount: unreadResult[0]?.count || 0,
				otherUserId,
				otherUserName: otherUser?.name || 'Unknown',
				otherUserImage: otherUser?.image || null
			});
		}

		return result;
	}

	/**
	 * Get messages for a conversation
	 */
	async getConversationMessages(
		conversationId: number,
		limit: number = 50,
		offset: number = 0
	): Promise<MessageWithSender[]> {
		const msgs = await db.query.messages.findMany({
			where: eq(messages.conversationId, conversationId),
			orderBy: [desc(messages.sentAt)],
			limit,
			offset
		});

		const result: MessageWithSender[] = [];

		for (const msg of msgs) {
			const sender = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, msg.senderId),
				columns: {
					name: true,
					image: true
				}
			});

			result.push({
				...msg,
				senderName: sender?.name || 'Unknown',
				senderImage: sender?.image || null
			});
		}

		return result.reverse(); // Return in chronological order
	}

	/**
	 * Send a message
	 */
	async sendMessage(conversationId: number, senderId: number, content: string): Promise<Message> {
		const [message] = await db
			.insert(messages)
			.values({
				conversationId,
				senderId,
				content
			})
			.returning();

		// Update conversation's last message timestamp
		await db
			.update(conversations)
			.set({ lastMessageAt: message.sentAt })
			.where(eq(conversations.id, conversationId));

		return message;
	}

	/**
	 * Mark messages as read
	 */
	async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
		await db
			.update(messages)
			.set({
				isRead: true,
				readAt: new Date()
			})
			.where(
				and(
					eq(messages.conversationId, conversationId),
					eq(messages.isRead, false),
					sql`${messages.senderId} != ${userId}`
				)
			);
	}

	/**
	 * Get total unread message count for a user
	 */
	async getUserUnreadCount(userId: number): Promise<number> {
		// Get all user's conversations
		const userConversations = await db.query.conversations.findMany({
			where: or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
			columns: {
				id: true,
				participant1Id: true,
				participant2Id: true
			}
		});

		let totalUnread = 0;

		for (const conv of userConversations) {
			const otherUserId =
				conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

			const unreadResult = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(messages)
				.where(
					and(
						eq(messages.conversationId, conv.id),
						eq(messages.isRead, false),
						eq(messages.senderId, otherUserId)
					)
				);

			totalUnread += unreadResult[0]?.count || 0;
		}

		return totalUnread;
	}

	/**
	 * Get conversation by ID
	 */
	async getConversationById(conversationId: number): Promise<Conversation | undefined> {
		return await db.query.conversations.findFirst({
			where: eq(conversations.id, conversationId)
		});
	}
}

export const chatRepository = new ChatRepository();
