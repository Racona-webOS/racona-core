<script lang="ts">
	import { User, RefreshCw } from 'lucide-svelte';
	import { getChatStore } from '../stores/chatStore.svelte';
	import { formatDistanceToNow } from '$lib/utils/date';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	const chatStore = getChatStore();

	const conversations = $derived(chatStore.conversations);
	const activeConversationId = $derived(chatStore.activeConversationId);

	function handleConversationClick(conversationId: number) {
		chatStore.loadMessages(conversationId);
	}

	function handleReload() {
		chatStore.reload();
	}

	function getLocalizedText(content: any): string {
		if (typeof content === 'string') return content;
		if (content && typeof content === 'object') {
			const locale = 'hu'; // or get from i18n
			return content[locale] || content['en'] || Object.values(content)[0] || '';
		}
		return '';
	}
</script>

<div class="conversation-list">
	<div class="conversation-list-header">
		<h3>{t('chat.conversationList.title')}</h3>
		<button class="reload-button" onclick={handleReload} title="Frissítés">
			<RefreshCw size={16} />
		</button>
	</div>

	<div class="conversation-list-content custom-scrollbar">
		{#if conversations.length === 0}
			<div class="empty">
				<p>{t('chat.conversationList.empty')}</p>
				<p class="hint">{t('chat.conversationList.hint')}</p>
			</div>
		{:else}
			{#each conversations as conversation (conversation.id)}
				<button
					class="conversation-item"
					class:active={conversation.id === activeConversationId}
					onclick={() => handleConversationClick(conversation.id)}
				>
					<div class="conversation-avatar">
						{#if conversation.otherUserImage}
							<img
								src={conversation.otherUserImage}
								alt={conversation.otherUserName}
								referrerpolicy="no-referrer"
								crossorigin="anonymous"
							/>
						{:else}
							<User size={20} />
						{/if}
					</div>
					<div class="conversation-info">
						<div class="conversation-header">
							<div class="conversation-name">{conversation.otherUserName}</div>
							{#if conversation.lastMessageAt}
								<div class="conversation-time">
									{formatDistanceToNow(conversation.lastMessageAt)}
								</div>
							{/if}
						</div>
						{#if conversation.lastMessage}
							<div class="conversation-preview">
								{getLocalizedText(conversation.lastMessage.content).substring(0, 50)}
								{#if getLocalizedText(conversation.lastMessage.content).length > 50}...{/if}
							</div>
						{/if}
					</div>
					{#if conversation.unreadCount > 0}
						<div class="unread-badge">
							{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
						</div>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.conversation-list {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		height: 100%;
	}

	.conversation-list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.conversation-list-header h3 {
		margin: 0;
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 1rem;
	}

	.reload-button {
		display: flex;
		justify-content: center;
		align-items: center;
		transition: background-color 0.2s;
		cursor: pointer;
		border: none;
		border-radius: 4px;
		background: transparent;
		padding: 0.5rem;
		color: var(--color-muted-foreground);
	}

	.reload-button:hover {
		background: var(--color-accent);
		color: var(--color-foreground);
	}

	.reload-button:active {
		transform: scale(0.95);
	}

	.conversation-list-content {
		flex: 1;
		padding-right: 0.5rem;
		overflow-y: auto;
	}

	.conversation-item {
		display: flex;
		position: relative;
		align-items: center;
		gap: 0.75rem;
		transition: background-color 0.2s;
		cursor: pointer;
		margin-bottom: 0.25rem;
		border: none;
		border-radius: 8px;
		background: transparent;
		padding: 0.75rem;
		width: 100%;
		text-align: left;
	}

	.conversation-item:hover {
		background: var(--color-accent);
	}

	.conversation-item.active {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.conversation-item.active .conversation-name,
	.conversation-item.active .conversation-time,
	.conversation-item.active .conversation-preview {
		color: var(--color-primary-foreground);
	}

	.conversation-avatar {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background: var(--color-muted);
		width: 48px;
		height: 48px;
		overflow: hidden;
	}

	.conversation-item.active .conversation-avatar {
		background: rgba(255, 255, 255, 0.2);
	}

	.conversation-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.conversation-info {
		flex: 1;
		min-width: 0;
	}

	.conversation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.conversation-name {
		overflow: hidden;
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conversation-time {
		flex-shrink: 0;
		margin-left: 0.5rem;
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
	}

	.conversation-preview {
		overflow: hidden;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.unread-badge {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: 10px;
		background: var(--color-primary);
		padding: 0 6px;
		min-width: 20px;
		height: 20px;
		color: var(--color-primary-foreground);
		font-weight: 600;
		font-size: 0.75rem;
	}

	.conversation-item.active .unread-badge {
		background: rgba(255, 255, 255, 0.3);
	}

	.empty {
		padding: 3rem 1.5rem;
		color: var(--color-muted-foreground);
		text-align: center;
	}

	.empty p {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
	}

	.empty .hint {
		opacity: 0.7;
		font-size: 0.75rem;
	}
</style>
