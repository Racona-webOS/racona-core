<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';
	import { getChatStore } from '$apps/chat/stores/chatStore.svelte';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();
	const chatStore = getChatStore();
	const windowManager = getWindowManager();

	const unreadCount = $derived(chatStore.unreadCount);

	async function handleClick() {
		try {
			const app = await getAppByName('chat');
			if (app) {
				windowManager.openWindow('chat', app.title, app);
			}
		} catch (error) {
			console.error('Failed to open chat app:', error);
		}
	}
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<button onclick={handleClick} class="taskbar-function-icon relative">
				<MessageCircle class="h-5 w-5" />
				{#if unreadCount > 0}
					<span
						class="absolute top-1 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg"
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				{/if}
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content>{t('desktop.taskbar.messages')}</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
