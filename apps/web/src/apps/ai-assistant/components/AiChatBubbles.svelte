<!--
  AiChatBubbles.svelte — Chat buborékok az AI fej bal oldalán.

  Beszélgetési előzmények megjelenítése, csak akkor látható, ha van aktív beszélgetés
  és a panel nyitva van.

  Requirements: Design document - Chat Bubbles section
-->
<script lang="ts">
	import { useI18n } from '$lib/i18n/hooks';
	import type { ChatMessage } from '../types/index.js';
	import UserMessage from './UserMessage.svelte';
	import AssistantMessage from './AssistantMessage.svelte';

	interface Props {
		messages: ChatMessage[];
		loading: boolean;
		isVisible: boolean;
	}

	let { messages, loading, isVisible }: Props = $props();

	const { t } = useI18n();

	let messagesEndRef: HTMLDivElement | undefined = $state();

	/** Időbélyeg formázása */
	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString('hu-HU', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/** Görgetés az utolsó üzenethez */
	function scrollToBottom() {
		messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
	}

	// Görgetés új üzenet esetén
	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

{#if isVisible}
	<div
		class="ai-chat-bubbles"
		role="log"
		aria-label={t('ai-assistant.history.label') ?? 'Beszélgetési előzmények'}
		aria-live="polite"
		aria-relevant="additions"
	>
		<div class="flex flex-col gap-3">
			{#each messages as message (message.id)}
				{#if message.role === 'user'}
					<UserMessage {message} {formatTime} />
				{:else}
					<AssistantMessage {message} {formatTime} />
				{/if}
			{/each}

			<!-- Loading indikátor -->
			{#if loading}
				<div
					class="flex justify-start"
					aria-label={t('ai-assistant.loading') ?? 'Válasz betöltése...'}
				>
					<div class="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
						<div class="flex gap-1" aria-hidden="true">
							<span
								class="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]"
							></span>
							<span
								class="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]"
							></span>
							<span
								class="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]"
							></span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Görgetési referencia pont -->
		<div bind:this={messagesEndRef}></div>
	</div>
{/if}

<style>
	.ai-chat-bubbles {
		display: flex;
		position: fixed;
		right: 300px;
		bottom: 12rem;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 9997;
		animation: bubble-fade-in 0.3s ease;
		padding: 1rem;
		padding-bottom: 0.5rem;
		width: 400px;
		max-width: calc(100vw - 320px);
		max-height: 50vh;
		overflow-y: auto;
		/* Scrollbar elrejtése */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE és Edge */
	}

	/* Scrollbar elrejtése Webkit böngészőkben (Chrome, Safari) */
	.ai-chat-bubbles::-webkit-scrollbar {
		display: none;
	}

	@keyframes bubble-fade-in {
		from {
			transform: translateX(20px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
