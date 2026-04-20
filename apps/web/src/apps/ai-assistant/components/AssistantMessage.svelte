<!--
  AssistantMessage.svelte — Asszisztens üzenet komponens.
-->
<script lang="ts">
	import type { ChatMessage } from '../types/index.js';
	import { ExternalLink } from 'lucide-svelte';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';

	interface Props {
		message: ChatMessage;
		formatTime: (timestamp: number) => string;
	}

	let { message, formatTime }: Props = $props();

	const windowManager = getWindowManager();

	async function handleOpenApp() {
		if (!message.suggestedApp) return;

		try {
			const app = await getAppByName(message.suggestedApp.appName);
			if (app) {
				const options = message.suggestedApp.section
					? { section: message.suggestedApp.section }
					: undefined;
				windowManager.openWindow(message.suggestedApp.appName, app.title, app, options);
			}
		} catch (error) {
			console.error('Failed to open suggested app:', error);
		}
	}
</script>

<div class="chat-bubble flex justify-start">
	<div class="max-w-[80%]">
		<div
			class="rounded-2xl rounded-tl-sm px-3 py-2 text-sm"
			style="background-color: {message.isError
				? '#fef2f2'
				: 'var(--muted)'}; color: {message.isError
				? '#b91c1c'
				: 'inherit'}; border: {message.isError
				? '1px solid #fecaca'
				: 'none'}; white-space: pre-wrap;"
		>
			{message.content}
		</div>
		{#if message.suggestedApp}
			<button
				onclick={handleOpenApp}
				class="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
			>
				<ExternalLink class="h-3.5 w-3.5" />
				Megnyitás
			</button>
		{/if}
		<p class="text-muted-foreground mt-0.5 text-xs">
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
