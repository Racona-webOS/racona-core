<!--
  UserMessage.svelte — Felhasználói üzenet komponens.
-->
<script lang="ts">
	import type { ChatMessage } from '../types/index.js';

	interface Props {
		message: ChatMessage;
		formatTime: (timestamp: number) => string;
	}

	let { message, formatTime }: Props = $props();
</script>

<div class="chat-bubble flex justify-end">
	<div class="max-w-[80%]">
		<div
			class="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm"
			style="white-space: pre-wrap;"
		>
			{message.content}
		</div>
		<p class="text-muted-foreground mt-0.5 text-right text-xs">
			{formatTime(message.timestamp)}
		</p>
	</div>
</div>

<style>
	.chat-bubble {
		animation: bubble-fade-in 0.3s ease;
	}

	@keyframes bubble-fade-in {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
