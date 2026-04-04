import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import type {
	ConversationWithLastMessage,
	MessageWithSender
} from '$lib/server/database/repositories/chatRepository';

export interface ChatUser {
	id: number;
	fullName: string;
	username: string | null;
	image: string | null;
	isOnline: boolean;
}

export interface ChatState {
	conversations: ConversationWithLastMessage[];
	activeConversationId: number | null;
	messages: MessageWithSender[];
	unreadCount: number;
	isConnected: boolean;
	onlineUsers: Set<number>;
	typingUsers: Map<number, boolean>; // conversationId -> isTyping
}

class ChatStore {
	private socket: Socket | null = null;
	private state = $state<ChatState>({
		conversations: [],
		activeConversationId: null,
		messages: [],
		unreadCount: 0,
		isConnected: false,
		onlineUsers: new Set(),
		typingUsers: new Map()
	});
	private pollingInterval: ReturnType<typeof setInterval> | null = null;

	get conversations() {
		return this.state.conversations;
	}

	get activeConversationId() {
		return this.state.activeConversationId;
	}

	get messages() {
		return this.state.messages;
	}

	get unreadCount() {
		return this.state.unreadCount;
	}

	get isConnected() {
		return this.state.isConnected;
	}

	get onlineUsers() {
		return this.state.onlineUsers;
	}

	get typingUsers() {
		return this.state.typingUsers;
	}

	/**
	 * Check if user is typing in a conversation.
	 */
	isUserTyping(conversationId: number): boolean {
		return this.state.typingUsers.get(conversationId) || false;
	}

	/**
	 * Check if a user is online
	 */
	isUserOnline(userId: number): boolean {
		return this.state.onlineUsers.has(userId);
	}

	/**
	 * Initialize Socket.IO connection
	 */
	async connect(userId: number) {
		if (!browser || this.socket?.connected) return;

		try {
			// Initialize socket connection
			this.socket = io({
				path: '/socket.io/',
				transports: ['websocket', 'polling'],
				reconnection: true,
				reconnectionAttempts: Infinity,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				timeout: 20000
			});

			this.socket.on('connect', () => {
				console.log('[ChatStore] Connected to Socket.IO');
				this.state.isConnected = true;

				// Register user
				this.socket?.emit('register', userId);
			});

			this.socket.on('disconnect', () => {
				console.log('[ChatStore] Disconnected from Socket.IO');
				this.state.isConnected = false;
			});

			// Listen for new messages
			this.socket.on(
				'chat:new-message',
				async (data: { message: MessageWithSender; conversationId: number }) => {
					console.log('[ChatStore] New message received:', data);

					// Add message to current conversation if active
					if (this.state.activeConversationId === data.conversationId) {
						this.state.messages = [...this.state.messages, data.message];
						// Mark as read immediately if we're viewing this conversation
						await this.markAsRead(data.conversationId);
					} else {
						// Increment unread count
						this.state.unreadCount++;

						// Show toast notification for new message if not in active conversation
						this.showToastNotification(data.message, data.conversationId);
					}

					// Update the conversation in the list
					const conversationIndex = this.state.conversations.findIndex(
						(c) => c.id === data.conversationId
					);

					if (conversationIndex !== -1) {
						// Update existing conversation
						const conversation = this.state.conversations[conversationIndex];
						conversation.lastMessage = data.message;
						conversation.lastMessageAt = data.message.sentAt;

						// Increment unread count if not active conversation
						if (this.state.activeConversationId !== data.conversationId) {
							conversation.unreadCount = (conversation.unreadCount || 0) + 1;
						}

						// Move to top
						this.state.conversations = [
							conversation,
							...this.state.conversations.filter((c) => c.id !== data.conversationId)
						];
					} else {
						// New conversation, reload all
						await this.loadConversations();
					}
				}
			);

			// Listen for user online/offline events
			this.socket.on('chat:user-online', (userId: number) => {
				console.log('[ChatStore] User online:', userId);
				this.state.onlineUsers.add(userId);
				this.state.onlineUsers = new Set(this.state.onlineUsers); // Trigger reactivity
			});

			this.socket.on('chat:user-offline', (userId: number) => {
				console.log('[ChatStore] User offline:', userId);
				this.state.onlineUsers.delete(userId);
				this.state.onlineUsers = new Set(this.state.onlineUsers); // Trigger reactivity
			});

			this.socket.on('chat:online-users', (userIds: number[]) => {
				console.log('[ChatStore] Online users received:', userIds);
				this.state.onlineUsers = new Set(userIds);
			});

			// Listen for typing indicators
			this.socket.on('chat:user-typing', (data: { conversationId: number; isTyping: boolean }) => {
				console.log('[ChatStore] User typing:', data);
				if (data.isTyping) {
					this.state.typingUsers.set(data.conversationId, true);
				} else {
					this.state.typingUsers.delete(data.conversationId);
				}
				// Trigger reactivity
				this.state.typingUsers = new Map(this.state.typingUsers);
			});

			// Load initial data
			await this.loadConversations();
			await this.loadUnreadCount();

			// Poll for updates if WebSocket is disconnected (dev mode fallback)
			this.startPolling();
		} catch (error) {
			console.error('[ChatStore] Connection error:', error);
			await this.loadConversations();
			// Start polling as fallback
			this.startPolling();
		}
	}

	/**
	 * Start polling for updates (fallback for dev mode).
	 */
	private startPolling() {
		if (this.pollingInterval) return;

		this.pollingInterval = setInterval(async () => {
			if (browser) {
				console.log('[ChatStore] Polling for updates (dev mode fallback)');

				// Only load online users if Socket.IO is not connected
				if (!this.state.isConnected) {
					await this.loadOnlineUsers();
				}

				await this.loadConversations();
				await this.loadUnreadCount();

				// Reload active conversation messages
				if (this.state.activeConversationId) {
					await this.loadMessages(this.state.activeConversationId);
				}
			}
		}, 10000); // Poll every 10 seconds
	}

	/**
	 * Stop polling
	 */
	private stopPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}
	}

	/**
	 * Disconnect from Socket.IO
	 */
	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.state.isConnected = false;
		}
		this.stopPolling();
	}

	/**
	 * Load conversations from API
	 */
	async loadConversations() {
		try {
			const { getConversations } = await import('../chat.remote');
			const result = await getConversations();

			if (result.success) {
				this.state.conversations = result.conversations;
			}
		} catch (error) {
			console.error('[ChatStore] Error loading conversations:', error);
		}
	}

	/**
	 * Load messages for a conversation
	 */
	async loadMessages(conversationId: number) {
		try {
			const { getMessages } = await import('../chat.remote');
			const result = await getMessages({ conversationId });

			if (result.success) {
				this.state.activeConversationId = conversationId;
				this.state.messages = result.messages;

				// Mark messages as read
				await this.markAsRead(conversationId);
			}
		} catch (error) {
			console.error('[ChatStore] Error loading messages:', error);
		}
	}

	/**
	 * Send a message
	 */
	async sendMessage(recipientId: number, content: string) {
		try {
			const { sendMessage } = await import('../chat.remote');
			const result = await sendMessage({ recipientId, content });

			if (result.success && result.message) {
				// Emit to socket for real-time delivery
				this.socket?.emit('chat:send-message', {
					recipientId,
					message: result.message,
					conversationId: result.conversationId
				});

				// Add to local messages if this is the active conversation
				if (this.state.activeConversationId === result.conversationId) {
					// Get current user info for the message
					const sender = (await this.getCurrentUser()) as { name?: string; image?: string } | null;
					const messageWithSender: MessageWithSender = {
						...result.message,
						senderName: sender?.name || 'You',
						senderImage: sender?.image || null
					};
					this.state.messages = [...this.state.messages, messageWithSender];
				}

				// Reload conversations to update last message
				await this.loadConversations();
			}

			return result;
		} catch (error) {
			console.error('[ChatStore] Error sending message:', error);
			return { success: false, error: 'Failed to send message' };
		}
	}

	/**
	 * Mark messages as read
	 */
	async markAsRead(conversationId: number) {
		try {
			const { markMessagesAsRead } = await import('../chat.remote');
			const result = await markMessagesAsRead({ conversationId });

			if (result.success) {
				// Emit to socket
				this.socket?.emit('chat:mark-read', conversationId);

				// Update local state
				await this.loadConversations();
				await this.loadUnreadCount();
			}
		} catch (error) {
			console.error('[ChatStore] Error marking messages as read:', error);
		}
	}

	/**
	 * Load unread count
	 */
	async loadUnreadCount() {
		try {
			const { getUnreadCount } = await import('../chat.remote');
			const result = await getUnreadCount();

			if (result.success) {
				this.state.unreadCount = result.count;
			}
		} catch (error) {
			console.error('[ChatStore] Error loading unread count:', error);
		}
	}

	/**
	 * Reload all data (manual refresh).
	 */
	async reload() {
		await this.loadConversations();
		await this.loadUnreadCount();

		// Only load online users if Socket.IO is not connected
		if (!this.state.isConnected) {
			await this.loadOnlineUsers();
		}

		// Reload active conversation messages
		if (this.state.activeConversationId) {
			await this.loadMessages(this.state.activeConversationId);
		}
	}

	/**
	 * Load online users (fallback for dev mode).
	 */
	async loadOnlineUsers() {
		try {
			const { getOnlineUsers } = await import('../chat.remote');
			const result = await getOnlineUsers();

			if (result.success) {
				console.log('[ChatStore] Loaded online users from API:', result.userIds);
				this.state.onlineUsers = new Set(result.userIds);
			}
		} catch (error) {
			console.error('[ChatStore] Error loading online users:', error);
		}
	}

	/**
	 * Set active conversation.
	 */
	setActiveConversation(conversationId: number | null) {
		this.state.activeConversationId = conversationId;
		if (conversationId === null) {
			this.state.messages = [];
		}
	}

	/**
	 * Send typing indicator.
	 */
	sendTypingIndicator(recipientId: number, conversationId: number, isTyping: boolean) {
		if (this.socket?.connected) {
			this.socket.emit('chat:typing', {
				recipientId,
				conversationId,
				isTyping
			});
		}
	}

	/**
	 * Get current user info.
	 */
	private async getCurrentUser() {
		try {
			// This would need to be implemented based on your auth system
			// For now, return null
			return null;
		} catch (error) {
			console.error('[ChatStore] Error getting current user:', error);
			return null;
		}
	}

	/**
	 * Show toast notification for new message.
	 */
	private showToastNotification(message: MessageWithSender, conversationId: number) {
		if (!browser) return;

		console.log('[ChatStore] Showing toast for message:', message);

		// Dynamically import toast to avoid SSR issues
		import('svelte-sonner')
			.then(({ toast }) => {
				// Get localized text
				const getLocalizedText = (content: any): string => {
					if (typeof content === 'string') return content;
					if (content && typeof content === 'object') {
						const locale = navigator.language.split('-')[0] || 'hu';
						return (
							content[locale] || content['hu'] || content['en'] || Object.values(content)[0] || ''
						);
					}
					return '';
				};

				const messageText = getLocalizedText(message.content);
				const preview =
					messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;

				const senderName = message.senderName || 'Ismeretlen';

				console.log('[ChatStore] Toast data:', { senderName, preview });

				toast.info(senderName, {
					description: preview,
					duration: 5000,
					action: {
						label: 'Megnyitás',
						onClick: () => this.openMessageInChat(conversationId)
					}
				});
			})
			.catch((error) => {
				console.error('[ChatStore] Failed to import toast:', error);
			});
	}

	/**
	 * Open message in chat app.
	 */
	private async openMessageInChat(conversationId: number) {
		try {
			// Dynamically import to avoid circular dependencies
			const { getWindowManager } = await import('$lib/stores');
			const { getAppByName } = await import('$lib/services/client/appRegistry');

			const windowManager = getWindowManager();
			const app = await getAppByName('chat');

			if (app && windowManager) {
				// Open chat app
				windowManager.openWindow('chat', app.title, app, {});

				// Load the conversation
				await this.loadMessages(conversationId);
			}
		} catch (error) {
			console.error('[ChatStore] Failed to open chat:', error);
		}
	}
}

// Singleton instance
let chatStore: ChatStore | null = null;

export function getChatStore(): ChatStore {
	if (!chatStore) {
		chatStore = new ChatStore();
	}
	return chatStore;
}
