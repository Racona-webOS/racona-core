<!--
  AiChatPanel.svelte — Az AI asszisztens fő panel komponense.

  Layout:
  - AiAvatarCanvas (felül, 3D animált avatar)
  - Érzelem-választó lista (demo/tesztelési célra)
  - Üzenet előzmények
  - MessageInputBar (alul)

  Requirements: 2.1, 2.2, 2.5, 2.6, 10.1, 10.2, 13.4, 13.5, 13.6
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { mode } from 'mode-watcher';
	import { Bot, ExternalLink } from 'lucide-svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';
	import { getWindowManager } from '$lib/stores';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import AiAvatarCanvas from './AiAvatarCanvas.svelte';
	import MessageInputBar from './MessageInputBar.svelte';
	import type { EmotionState } from '../types/index.js';

	const { t } = useI18n();
	const aiStore = getAiAssistantStore();
	const windowManager = getWindowManager();

	/** Aktuális téma a mode-watcher alapján */
	const theme = $derived<'light' | 'dark'>(mode.current === 'dark' ? 'dark' : 'light');

	/** Az 5 érzelem-állapot a választóhoz */
	const EMOTIONS: { value: EmotionState; label: string; emoji: string }[] = [
		{ value: 'neutral', label: 'Semleges', emoji: '😐' },
		{ value: 'happy', label: 'Boldog', emoji: '😊' },
		{ value: 'thinking', label: 'Gondolkodó', emoji: '🤔' },
		{ value: 'confused', label: 'Tanácstalan', emoji: '😕' },
		{ value: 'surprised', label: 'Meglepett', emoji: '😮' }
	];

	/** Random szövegek a speech bubble-höz */
	const SPEECH_TEXTS = [
		'Szia!',
		'Miben segíthetek?',
		'Van kérdésed?',
		'Gondolkodom...',
		'Érdekes!',
		'Hmm...',
		'Figyelek!',
		'Készen állok!',
		'Mondd csak!',
		'Hallgatlak...',
		'Mi jár a fejedben?',
		'Segíthetek valamiben?',
		'Kíváncsi vagyok!',
		'Mesélj!',
		'Várom a kérdésed',
		'Itt vagyok neked'
	];

	let messagesEndRef: HTMLDivElement | undefined = $state();
	let panelRef: HTMLDivElement | undefined = $state();
	let currentSpeechText = $state('');
	let showSpeech = $state(false);
	let isFadingOut = $state(false);

	/** Görgetés az utolsó üzenethez */
	function scrollToBottom() {
		messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
	}

	/** Escape billentyű bezárja a panelt (Requirements: 2.5) */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			aiStore.close();
		}
	}

	/** Érzelem kiválasztása a listából */
	function selectEmotion(emotion: EmotionState) {
		aiStore.currentEmotion = emotion;
	}

	/** Üzenet küldése */
	async function handleSend(text: string) {
		await aiStore.sendMessage(text);
	}

	/** Időbélyeg formázása */
	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString('hu-HU', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Görgetés új üzenet esetén
	$effect(() => {
		if (aiStore.messages.length > 0) {
			scrollToBottom();
		}
	});

	// localStorage betöltése megnyitáskor
	onMount(() => {
		aiStore.loadFromStorage();

		// Random speech bubble megjelenítés 8-15 mp-enként
		function scheduleNextSpeech() {
			const delay = Math.random() * 7000 + 8000; // 8000-15000 ms (8-15 sec)
			setTimeout(() => {
				// Random szöveg kiválasztása
				currentSpeechText = SPEECH_TEXTS[Math.floor(Math.random() * SPEECH_TEXTS.length)];
				showSpeech = true;
				isFadingOut = false;

				// 3.6 másodperc múlva kezd el fade-out-olni
				setTimeout(() => {
					isFadingOut = true;
					// 0.4 másodperc múlva teljesen eltűnik (fade-out animáció ideje)
					setTimeout(() => {
						showSpeech = false;
					}, 400);
				}, 3600);

				scheduleNextSpeech();
			}, delay);
		}

		scheduleNextSpeech();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={panelRef}
	role="dialog"
	tabindex="-1"
	aria-label={t('ai-assistant.panel.title') ?? 'AI Asszisztens'}
	aria-modal="false"
	onkeydown={handleKeydown}
	class="flex flex-col"
>
	<!-- Avatar + érzelem-választó -->
	<div class="relative flex flex-col items-center gap-3 p-4">
		<!-- Speech Bubble (képregény stílusú beszédbuborék) - fej felett középen -->
		{#if showSpeech}
			<div
				class="speech-bubble-container absolute top-0 left-1/2 -translate-x-1/2 {isFadingOut
					? 'fade-out'
					: ''}"
			>
				<div
					class="speech-bubble bg-background relative rounded-2xl border px-2.5 py-1.5 text-xs font-medium shadow-md"
				>
					{currentSpeechText}
					<!-- Kis háromszög a buborék alján középen (csőr) -->
					<div
						class="bg-background absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b"
					></div>
				</div>
			</div>
		{/if}

		<!-- 3D Avatar - sötét elmosódott korong háttérrel (Requirements: 2.1, 13.1) -->
		<div class="relative h-60 w-60 shrink-0">
			<!-- Sötét elmosódott korong a fej körül -->
			<div
				class="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-950/95 blur-3xl"
			></div>
			<!-- Avatar -->
			<div class="relative z-10 h-full w-full">
				<AiAvatarCanvas
					emotionState={aiStore.currentEmotion}
					{theme}
					{panelRef}
					enableMouseTracking={false}
				/>
			</div>
		</div>

		<!-- Érzelem-választó lista (Requirements: 13.4, 13.5, 13.6) -->
		<div
			class="hidden flex-wrap justify-center gap-1"
			role="group"
			aria-label={t('ai-assistant.emotion.label') ?? 'Érzelem választó'}
		>
			{#each EMOTIONS as emotion (emotion.value)}
				<button
					onclick={() => selectEmotion(emotion.value)}
					aria-pressed={aiStore.currentEmotion === emotion.value}
					aria-label={emotion.label}
					title={emotion.label}
					class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors
						{aiStore.currentEmotion === emotion.value
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				>
					<span aria-hidden="true">{emotion.emoji}</span>
					<span>{emotion.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Üzenet előzmények (Requirements: 2.3, 2.6) -->
	<div
		class="flex-1 overflow-y-auto px-4 py-3"
		role="log"
		aria-label={t('ai-assistant.history.label') ?? 'Beszélgetési előzmények'}
		aria-live="polite"
		aria-relevant="additions"
	>
		{#if !aiStore.hasMessages}
			<div
				class="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center"
			>
				<Bot class="h-10 w-10 opacity-20" />
				<p class="text-sm">
					{t('ai-assistant.history.empty') ?? 'Tedd fel az első kérdésedet!'}
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each aiStore.messages as message (message.id)}
					{#if message.role === 'user'}
						<!-- Felhasználói üzenet -->
						<div class="flex justify-end">
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
					{:else}
						<!-- Asszisztens üzenet -->
						<div class="flex justify-start">
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
									{#if message.isError}
										<small style="color: blue; font-weight: bold;">[ERROR]</small>
									{/if}
									{message.content}
								</div>
								{#if message.suggestedApp}
									<button
										onclick={async () => {
											if (!message.suggestedApp) return;
											try {
												const app = await getAppByName(message.suggestedApp.appName);
												if (app) {
													const options = message.suggestedApp.section
														? { section: message.suggestedApp.section }
														: undefined;
													windowManager.openWindow(
														message.suggestedApp.appName,
														app.title,
														app,
														options
													);
												}
											} catch (error) {
												console.error('Failed to open suggested app:', error);
											}
										}}
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
					{/if}
				{/each}

				<!-- Loading indikátor (Requirements: 2.7) -->
				{#if aiStore.loading}
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
		{/if}

		<!-- Görgetési referencia pont -->
		<div bind:this={messagesEndRef}></div>
	</div>

	<!-- Hibaüzenet -->
	{#if aiStore.error}
		<div
			class="bg-destructive/10 text-destructive mx-4 mb-2 rounded-md px-3 py-2 text-xs"
			role="alert"
			aria-live="assertive"
		>
			{aiStore.error}
		</div>
	{/if}

	<!-- Üzenet beviteli sáv (Requirements: 2.2, 2.4, 2.5) -->
	<div class="px-4 pb-4">
		<MessageInputBar onSend={handleSend} disabled={!aiStore.canSend} maxLength={500} />
	</div>
</div>

<style>
	@keyframes fadeInUp {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes fadeOutDown {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(10px);
			opacity: 0;
		}
	}

	.speech-bubble-container {
		animation: fadeInUp 0.4s ease-out;
	}

	.speech-bubble-container.fade-out {
		animation: fadeOutDown 0.4s ease-out;
	}

	.speech-bubble {
		position: relative;
	}
</style>
