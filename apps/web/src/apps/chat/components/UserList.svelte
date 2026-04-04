<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, User, ChevronDown, ChevronRight } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getChatStore } from '../stores/chatStore.svelte';
	import { getChatUsers } from '../chat.remote';
	import type { ChatUser } from '../stores/chatStore.svelte';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();

	const chatStore = getChatStore();

	let users = $state<any[]>([]);
	let searchQuery = $state('');
	let loading = $state(true);
	let onlineExpanded = $state(true);
	let offlineExpanded = $state(false);

	const filteredUsers = $derived(
		users.filter(
			(user) =>
				user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.username?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const onlineUsers = $derived(filteredUsers.filter((user) => chatStore.isUserOnline(user.id)));

	const offlineUsers = $derived(filteredUsers.filter((user) => !chatStore.isUserOnline(user.id)));

	onMount(async () => {
		const result = await getChatUsers();
		if (result.success) {
			users = result.users;
		}
		loading = false;
	});

	async function handleUserClick(userId: number) {
		// Create or get conversation with this user
		try {
			const { getOrCreateConversation } = await import('../chat.remote');
			const result = await getOrCreateConversation({ otherUserId: userId });

			if (result.success && result.conversationId) {
				// Load conversations to show the new one
				await chatStore.loadConversations();
				// Open the conversation
				await chatStore.loadMessages(result.conversationId);
			}
		} catch (error) {
			console.error('[UserList] Error creating conversation:', error);
		}
	}
</script>

<div class="user-list">
	<div class="user-list-header">
		<h3>{t('chat.userList.title')}</h3>
		<div class="search-box">
			<span class="search-icon-wrapper">
				<Search size={16} />
			</span>
			<Input
				type="text"
				placeholder={t('common.buttons.search')}
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
	</div>

	<div class="user-list-content custom-scrollbar">
		{#if loading}
			<div class="loading">{t('chat.userList.loading')}</div>
		{:else if filteredUsers.length === 0}
			<div class="empty">{t('chat.userList.noResults')}</div>
		{:else}
			<!-- Online Users -->
			{#if onlineUsers.length > 0}
				<div class="user-group">
					<button class="group-header" onclick={() => (onlineExpanded = !onlineExpanded)}>
						{#if onlineExpanded}
							<ChevronDown size={16} />
						{:else}
							<ChevronRight size={16} />
						{/if}
						<span>{t('chat.userList.online', { count: String(onlineUsers.length) })}</span>
					</button>
					{#if onlineExpanded}
						<div class="group-content">
							{#each onlineUsers as user (user.id)}
								<button class="user-item" onclick={() => handleUserClick(user.id)}>
									<div class="user-avatar-wrapper">
										<Avatar.Root class="h-10 w-10">
											<Avatar.Image
												src={user.image || ''}
												alt={user.fullName}
												referrerpolicy="no-referrer"
												crossorigin="anonymous"
											/>
											<Avatar.Fallback>
												<User size={20} />
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="status-indicator online"></span>
									</div>
									<div class="user-info">
										<div class="user-name">{user.fullName}</div>
										{#if user.username}
											<div class="user-username">@{user.username}</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Offline Users -->
			{#if offlineUsers.length > 0}
				<div class="user-group">
					<button class="group-header" onclick={() => (offlineExpanded = !offlineExpanded)}>
						{#if offlineExpanded}
							<ChevronDown size={16} />
						{:else}
							<ChevronRight size={16} />
						{/if}
						<span>{t('chat.userList.offline', { count: String(offlineUsers.length) })}</span>
					</button>
					{#if offlineExpanded}
						<div class="group-content">
							{#each offlineUsers as user (user.id)}
								<button class="user-item" onclick={() => handleUserClick(user.id)}>
									<div class="user-avatar-wrapper">
										<Avatar.Root class="h-10 w-10">
											<Avatar.Image
												src={user.image || ''}
												alt={user.fullName}
												referrerpolicy="no-referrer"
												crossorigin="anonymous"
											/>
											<Avatar.Fallback>
												<User size={20} />
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="status-indicator offline"></span>
									</div>
									<div class="user-info">
										<div class="user-name">{user.fullName}</div>
										{#if user.username}
											<div class="user-username">@{user.username}</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.user-list {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.user-list-header {
		margin-bottom: 1rem;
	}

	.user-list-header h3 {
		margin: 0 0 0.75rem 0;
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 1rem;
	}

	.search-box {
		position: relative;
	}

	.search-icon-wrapper {
		display: flex;
		position: absolute;
		top: 50%;
		left: 0.75rem;
		align-items: center;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-muted-foreground);
	}

	:global(.search-input) {
		padding-left: 2.5rem !important;
	}

	.user-list-content {
		flex: 1;
		overflow-y: auto;
	}

	.user-group {
		margin-bottom: 0.5rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background-color 0.2s;
		cursor: pointer;
		border: none;
		border-radius: 6px;
		background: transparent;
		padding: 0.5rem;
		width: 100%;
		color: var(--color-muted-foreground);
		font-weight: 600;
		font-size: 0.8125rem;
		text-align: left;
	}

	.group-header:hover {
		background: var(--color-accent);
		color: var(--color-foreground);
	}

	.group-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: background-color 0.2s;
		cursor: pointer;
		border: none;
		border-radius: 6px;
		background: transparent;
		padding: 0.625rem;
		width: 100%;
		text-align: left;
	}

	.user-item:hover {
		background: var(--color-accent);
	}

	.user-avatar-wrapper {
		position: relative;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
	}

	.status-indicator {
		position: absolute;
		right: -2px;
		bottom: -2px;
		z-index: 10;
		border: 2px solid var(--color-background);
		border-radius: 50%;
		width: 12px;
		height: 12px;
	}

	.status-indicator.online {
		background: #22c55e;
	}

	.status-indicator.offline {
		background: #94a3b8;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		overflow: hidden;
		color: var(--color-foreground);
		font-weight: 500;
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-username {
		overflow: hidden;
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.loading,
	.empty {
		padding: 2rem 1rem;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		text-align: center;
	}
</style>
