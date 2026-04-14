import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { chatRepository } from '$lib/server/database/repositories/chatRepository';
import db from '$lib/server/database';
import { ne } from 'drizzle-orm';
import { users } from '@racona/database/schemas';

const emptySchema = v.object({});

// Get all users for chat (excluding current user)
export const getChatUsers = command(emptySchema, async () => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', users: [] };
	}

	const userId = parseInt(locals.user.id);

	try {
		const allUsers = await db.query.users.findMany({
			where: ne(users.id, userId),
			columns: {
				id: true,
				name: true,
				username: true,
				image: true
			},
			orderBy: (users, { asc }) => [asc(users.name)]
		});

		// Map to expected format
		const mappedUsers = allUsers.map((user) => ({
			id: user.id,
			fullName: user.name,
			username: user.username,
			image: user.image
		}));

		return { success: true, users: mappedUsers };
	} catch (error) {
		console.error('Error fetching chat users:', error);
		return { success: false, error: 'Failed to fetch users', users: [] };
	}
});

// Get user's conversations
export const getConversations = command(emptySchema, async () => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', conversations: [] };
	}

	const userId = parseInt(locals.user.id);

	try {
		const conversations = await chatRepository.getUserConversations(userId);
		return { success: true, conversations };
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return { success: false, error: 'Failed to fetch conversations', conversations: [] };
	}
});

// Get messages for a conversation
const getMessagesSchema = v.object({
	conversationId: v.pipe(v.number(), v.minValue(1)),
	limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
	offset: v.optional(v.pipe(v.number(), v.minValue(0)))
});

export const getMessages = command(getMessagesSchema, async ({ conversationId, limit, offset }) => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', messages: [] };
	}

	const userId = parseInt(locals.user.id);

	try {
		// Verify user is part of the conversation
		const conversation = await chatRepository.getConversationById(conversationId);
		if (
			!conversation ||
			(conversation.participant1Id !== userId && conversation.participant2Id !== userId)
		) {
			return { success: false, error: 'Unauthorized', messages: [] };
		}

		const messages = await chatRepository.getConversationMessages(
			conversationId,
			limit || 50,
			offset || 0
		);

		return { success: true, messages };
	} catch (error) {
		console.error('Error fetching messages:', error);
		return { success: false, error: 'Failed to fetch messages', messages: [] };
	}
});

// Send a message
const sendMessageSchema = v.object({
	recipientId: v.pipe(v.number(), v.minValue(1)),
	content: v.pipe(v.string(), v.minLength(1), v.maxLength(5000))
});

export const sendMessage = command(sendMessageSchema, async ({ recipientId, content }) => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated' };
	}

	const userId = parseInt(locals.user.id);

	try {
		// Get or create conversation
		const conversation = await chatRepository.getOrCreateConversation(userId, recipientId);

		// Send message
		const message = await chatRepository.sendMessage(conversation.id, userId, content);

		// Get sender info for the message
		const sender = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, userId),
			columns: {
				name: true,
				image: true
			}
		});

		// Create message with sender info
		const messageWithSender = {
			...message,
			senderName: sender?.name || 'Unknown',
			senderImage: sender?.image || null
		};

		return { success: true, message: messageWithSender, conversationId: conversation.id };
	} catch (error) {
		console.error('Error sending message:', error);
		return { success: false, error: 'Failed to send message' };
	}
});

// Mark messages as read
const markAsReadSchema = v.object({
	conversationId: v.pipe(v.number(), v.minValue(1))
});

export const markMessagesAsRead = command(markAsReadSchema, async ({ conversationId }) => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated' };
	}

	const userId = parseInt(locals.user.id);

	try {
		// Verify user is part of the conversation
		const conversation = await chatRepository.getConversationById(conversationId);
		if (
			!conversation ||
			(conversation.participant1Id !== userId && conversation.participant2Id !== userId)
		) {
			return { success: false, error: 'Unauthorized' };
		}

		await chatRepository.markMessagesAsRead(conversationId, userId);
		return { success: true };
	} catch (error) {
		console.error('Error marking messages as read:', error);
		return { success: false, error: 'Failed to mark messages as read' };
	}
});

// Get unread count
export const getUnreadCount = command(emptySchema, async () => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', count: 0 };
	}

	const userId = parseInt(locals.user.id);

	try {
		const count = await chatRepository.getUserUnreadCount(userId);
		return { success: true, count };
	} catch (error) {
		console.error('Error fetching unread count:', error);
		return { success: false, error: 'Failed to fetch unread count', count: 0 };
	}
});

// Get online users (from Socket.IO in production)
export const getOnlineUsers = command(emptySchema, async () => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', userIds: [] };
	}

	try {
		// In production with Socket.IO, get online users from global.io
		if (global.io) {
			// Access the onlineUsers Set from server.js
			// We need to expose this through a global variable or module
			// For now, return empty array and rely on Socket.IO events
			return { success: true, userIds: [] };
		}

		// Fallback for dev mode without Socket.IO
		return { success: true, userIds: [] };
	} catch (error) {
		console.error('Error fetching online users:', error);
		return { success: false, error: 'Failed to fetch online users', userIds: [] };
	}
});

// Get current user ID
export const getCurrentUserId = command(emptySchema, async () => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated', userId: null };
	}

	return { success: true, userId: parseInt(locals.user.id) };
});

// Get or create conversation with a user
const getOrCreateConversationSchema = v.object({
	otherUserId: v.pipe(v.number(), v.minValue(1))
});

export const getOrCreateConversation = command(
	getOrCreateConversationSchema,
	async ({ otherUserId }) => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'User not authenticated' };
		}

		const userId = parseInt(locals.user.id);

		try {
			const conversation = await chatRepository.getOrCreateConversation(userId, otherUserId);
			return { success: true, conversationId: conversation.id };
		} catch (error) {
			console.error('Error getting or creating conversation:', error);
			return { success: false, error: 'Failed to get or create conversation' };
		}
	}
);
