<script lang="ts">
	import { tick } from 'svelte';
	import { Send, User } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getChatStore } from '../stores/chatStore.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	let { currentUserId = null }: { currentUserId: number | null } = $props();

	const chatStore = getChatStore();

	const activeConversationId = $derived(chatStore.activeConversationId);
	const messages = $derived(chatStore.messages);
	const conversations = $derived(chatStore.conversations);

	const activeConversation = $derived(conversations.find((c) => c.id === activeConversationId));
	const isOtherUserTyping = $derived(
		activeConversationId ? chatStore.isUserTyping(activeConversationId) : false
	);

	let messageInput = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	let typingTimeout: ReturnType<typeof setTimeout> | null = null;
	let isTyping = $state(false);
	let currentUserImage = $state<string | null>(null);
	let currentUserName = $state<string>('You');
	let profileLoaded = $state(false);

	// Load current user data
	$effect(() => {
		if (currentUserId && !profileLoaded) {
			loadCurrentUserData();
		}
	});

	async function loadCurrentUserData() {
		try {
			const { getProfile } = await import('$apps/settings/profile.remote');
			const result = await getProfile({});
			console.log('[ChatWindow] Current user profile:', result);
			if (result.success && result.profile) {
				currentUserImage = result.profile.image;
				currentUserName = result.profile.name;
				profileLoaded = true;
				console.log('[ChatWindow] Current user image:', currentUserImage);
				console.log('[ChatWindow] Current user name:', currentUserName);
			}
		} catch (error) {
			console.error('[ChatWindow] Error loading current user data:', error);
		}
	}

	// Auto-scroll to bottom when messages change
	$effect(() => {
		if (messages.length > 0 || isOtherUserTyping) {
			tick().then(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			});
		}
	});

	async function handleSendMessage() {
		if (!messageInput.trim() || !activeConversation) return;

		const content = messageInput.trim();
		messageInput = '';

		// Stop typing indicator
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			typingTimeout = null;
		}
		if (isTyping) {
			isTyping = false;
			chatStore.sendTypingIndicator(activeConversation.otherUserId, activeConversation.id, false);
		}

		await chatStore.sendMessage(activeConversation.otherUserId, content);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	function handleInput() {
		if (!activeConversation) return;

		// Send typing indicator only if not already typing
		if (!isTyping) {
			isTyping = true;
			chatStore.sendTypingIndicator(activeConversation.otherUserId, activeConversation.id, true);
		}

		// Clear existing timeout
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}

		// Stop typing after 3 seconds of inactivity
		typingTimeout = setTimeout(() => {
			if (activeConversation) {
				isTyping = false;
				chatStore.sendTypingIndicator(activeConversation.otherUserId, activeConversation.id, false);
			}
		}, 3000);
	}

	function getLocalizedText(content: any): string {
		if (typeof content === 'string') return content;
		if (content && typeof content === 'object') {
			const locale = 'hu';
			return content[locale] || content['en'] || Object.values(content)[0] || '';
		}
		return '';
	}

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString('hu-HU', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="chat-window">
	{#if !activeConversation}
		<div class="empty-state">
			<p>{t('chat.chatWindow.selectConversation')}</p>
		</div>
	{:else}
		<div class="chat-header">
			<div class="chat-header-avatar">
				{#if activeConversation.otherUserImage}
					<img
						src={activeConversation.otherUserImage}
						alt={activeConversation.otherUserName}
						referrerpolicy="no-referrer"
						crossorigin="anonymous"
					/>
				{:else}
					<User size={24} />
				{/if}
			</div>
			<div class="chat-header-info">
				<h3>{activeConversation.otherUserName}</h3>
			</div>
		</div>

		<div class="chat-messages custom-scrollbar" bind:this={messagesContainer}>
			{#if messages.length === 0}
				<div class="no-messages">
					<p>{t('chat.chatWindow.noMessages')}</p>
				</div>
			{:else}
				{#each messages as message, index (message.id)}
					{@const isOwn = message.senderId === currentUserId}
					{@const prevMessage = index > 0 ? messages[index - 1] : null}
					{@const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId}
					{@const isGrouped = prevMessage && prevMessage.senderId === message.senderId}

					<div class="message-row" class:grouped={isGrouped}>
						<div class="message-avatar">
							{#if showAvatar}
								{#if isOwn}
									{#if currentUserImage}
										<Avatar.Root class="h-10 w-10">
											<Avatar.Image
												src={currentUserImage}
												alt={currentUserName}
												referrerpolicy="no-referrer"
												crossorigin="anonymous"
											/>
											<Avatar.Fallback>
												<User size={16} />
											</Avatar.Fallback>
										</Avatar.Root>
									{:else}
										<Avatar.Root class="h-10 w-10">
											<Avatar.Fallback>
												<User size={16} />
											</Avatar.Fallback>
										</Avatar.Root>
									{/if}
								{:else}
									<Avatar.Root class="h-10 w-10">
										<Avatar.Image
											src={activeConversation.otherUserImage || ''}
											alt={message.senderName}
											referrerpolicy="no-referrer"
											crossorigin="anonymous"
										/>
										<Avatar.Fallback>
											<User size={16} />
										</Avatar.Fallback>
									</Avatar.Root>
								{/if}
							{/if}
						</div>
						<div class="message-content-wrapper">
							{#if showAvatar}
								<div class="message-header">
									<span class="message-sender">{message.senderName}</span>
									<span class="message-time">{formatTime(message.sentAt)}</span>
								</div>
							{/if}
							<div class="message-text">
								{getLocalizedText(message.content)}
							</div>
						</div>
					</div>
				{/each}
			{/if}

			{#if isOtherUserTyping}
				<div class="typing-indicator">
					<div class="typing-avatar">
						<Avatar.Root class="h-10 w-10">
							<Avatar.Image
								src={activeConversation?.otherUserImage || ''}
								alt={activeConversation?.otherUserName || ''}
								referrerpolicy="no-referrer"
								crossorigin="anonymous"
							/>
							<Avatar.Fallback>
								<User size={16} />
							</Avatar.Fallback>
						</Avatar.Root>
					</div>
					<div class="typing-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{/if}
		</div>

		<div class="chat-input">
			<Input
				bind:value={messageInput}
				placeholder="Írj egy üzenetet..."
				onkeydown={handleKeyDown}
				oninput={handleInput}
				class="message-input"
			/>
			<Button onclick={handleSendMessage} disabled={!messageInput.trim()} size="icon">
				<Send size={20} />
			</Button>
		</div>
	{/if}
</div>

<style>
	.chat-window {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		height: 100%;
	}

	.empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		padding-bottom: 1rem;
	}

	:global(.dark) .chat-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.chat-header-avatar {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background: var(--color-muted);
		width: 40px;
		height: 40px;
		overflow: hidden;
	}

	.chat-header-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chat-header-info h3 {
		margin: 0;
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 1rem;
	}

	.chat-messages {
		display: flex;
		flex: 1;
		flex-direction: column;
		margin-bottom: 1rem;
		padding-right: 0.75rem;
		overflow-y: auto;
	}

	.no-messages {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
	}

	.message-row {
		display: flex;
		gap: 0.75rem;
		transition: background-color 0.1s;
		margin: 0 -0.5rem;
		padding: 0.25rem 0.5rem;
	}

	.message-row:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	:global(.dark) .message-row:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.message-row.grouped {
		margin-top: 0.125rem;
	}

	.message-avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	}

	.message-content-wrapper {
		flex: 1;
		min-width: 0;
	}

	.message-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.message-sender {
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.message-time {
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
	}

	.message-text {
		color: var(--color-foreground);
		font-size: 0.9375rem;
		line-height: 1.5;
		word-wrap: break-word;
		display: inline-block;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.03);
		padding: 0.375rem 0.75rem;
		max-width: 100%;
		white-space: pre-wrap;
	}

	:global(.dark) .message-text {
		background: rgba(255, 255, 255, 0.03);
	}

	.typing-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 -0.5rem;
		padding: 0.25rem 0.5rem;
	}

	.typing-avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	}

	.typing-dots {
		display: flex;
		gap: 0.25rem;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.03);
		padding: 0.5rem 0.75rem;
	}

	:global(.dark) .typing-dots {
		background: rgba(255, 255, 255, 0.03);
	}

	.typing-dots span {
		animation: typing 1.4s infinite;
		border-radius: 50%;
		background: var(--color-muted-foreground);
		width: 8px;
		height: 8px;
	}

	.typing-dots span:nth-child(1) {
		animation-delay: 0s;
	}

	.typing-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.3;
		}
		30% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}

	.chat-input {
		display: flex;
		gap: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 1rem;
	}

	:global(.dark) .chat-input {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	:global(.message-input) {
		flex: 1;
	}
</style>
