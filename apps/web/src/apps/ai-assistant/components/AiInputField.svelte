<!--
  AiInputField.svelte — Input mező az AI fej bal oldalán.

  Széles input mező nyíl gombbal, csak akkor látható, ha a panel aktív.

  Requirements: Design document - Input Field section
-->
<script lang="ts">
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';
	import MessageInputBar from './MessageInputBar.svelte';

	interface Props {
		isVisible: boolean;
		onSend: (text: string) => void;
		disabled: boolean;
	}

	let { isVisible, onSend, disabled }: Props = $props();

	const aiStore = getAiAssistantStore();

	/** Beszélgetés törlése */
	function handleClearHistory() {
		//if (confirm('Biztosan törölni szeretnéd a beszélgetést?')) {
		aiStore.clearHistory();
		//}
	}
</script>

{#if isVisible}
	<div class="ai-input-field">
		<MessageInputBar {onSend} {disabled} maxLength={500} />

		<!-- Beszélgetés törlése gomb helye (mindig foglalt, de csak akkor látható ha van üzenet) -->
		<div class="clear-button-container">
			{#if aiStore.hasMessages}
				<button class="clear-button" onclick={handleClearHistory} type="button">
					Beszélgetés törlése
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.ai-input-field {
		display: flex;
		position: fixed;
		right: 300px;
		bottom: 5.5rem;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 9997;
		animation: input-slide-in 0.3s ease;
		width: 400px;
		max-width: calc(100vw - 320px);
	}

	.clear-button-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 1.25rem; /* Mindig foglalt hely (0.75rem font + padding) */
	}

	.clear-button {
		transition: color 0.2s ease;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		text-align: center;
	}

	.clear-button:hover {
		color: var(--foreground);
	}

	@keyframes input-slide-in {
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
