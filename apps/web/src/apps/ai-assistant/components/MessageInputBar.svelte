<!--
  MessageInputBar.svelte — Üzenet beviteli sáv az AI asszisztenshez.

  Új design: Széles, teljesen lekerekített input mező nyíl gombbal.

  Requirements: 2.2, 2.4, 2.5, 8.3, 12.1
-->
<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';

	const { t } = useI18n();
	const aiStore = getAiAssistantStore();

	interface Props {
		/** Küldés callback — meghívódik érvényes üzenet esetén */
		onSend: (text: string) => void;
		/** Ha true, a beviteli mező és a send gomb le van tiltva */
		disabled?: boolean;
		/** Maximális karakter szám (alapértelmezett: 500) */
		maxLength?: number;
	}

	let { onSend, disabled = false, maxLength = 500 }: Props = $props();

	let inputValue = $state('');
	let validationError = $state<string | null>(null);
	let textareaRef: HTMLTextAreaElement | undefined = $state();

	/** Az aktuális karakter szám */
	const charCount = $derived(inputValue.length);
	/** Igaz, ha a szöveg meghaladja a maximumot */
	const isTooLong = $derived(charCount > maxLength);
	/** Igaz, ha a szöveg üres vagy csak whitespace */
	const isEmpty = $derived(inputValue.trim().length === 0);
	/** A send gomb aktív-e */
	const canSubmit = $derived(!disabled && !isEmpty && !isTooLong);

	// Focus visszaállítása amikor a disabled false-ra vált
	$effect(() => {
		if (!disabled && textareaRef) {
			textareaRef.focus();
		}
	});

	/** Validálja a bevitelt és frissíti a hibaüzenetet */
	function validate(): boolean {
		if (isEmpty) {
			validationError = null;
			return false;
		}
		if (isTooLong) {
			validationError =
				t('ai-assistant.input.tooLong', { max: String(maxLength) }) ??
				`A kérdés túl hosszú (maximum ${maxLength} karakter).`;
			return false;
		}
		validationError = null;
		return true;
	}

	/** Elküldi az üzenetet, ha érvényes */
	function handleSend() {
		if (!validate()) return;
		const text = inputValue.trim();
		aiStore.stopTyping(); // Gépelés leállítása
		onSend(text);
		inputValue = '';
		validationError = null;
	}

	/** Enter billentyű kezelése (Shift+Enter = sortörés, Enter = küldés) */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	/** Input változáskor validálás és gépelés jelzése */
	function handleInput() {
		// Gépelés jelzése - mindig hívjuk, még ha üres is
		// (így ha törlünk mindent, akkor is elindul a 3mp timeout)
		aiStore.startTyping();

		// Ha üres, akkor azonnal állítsuk le a typing flag-et
		// de a timeout továbbra is fut (3mp után breathing)
		if (inputValue.length === 0) {
			aiStore.isTyping = false;
		}

		// Validálás
		if (isTooLong) {
			validationError =
				t('ai-assistant.input.tooLong', { max: String(maxLength) }) ??
				`A kérdés túl hosszú (maximum ${maxLength} karakter).`;
		} else {
			validationError = null;
		}
	}
</script>

<div class="input-wrapper-container">
	<!-- Validációs hibaüzenet -->
	{#if validationError}
		<p class="text-destructive mb-2 text-center text-xs" role="alert" aria-live="polite">
			{validationError}
		</p>
	{/if}

	<div class="input-wrapper">
		<!-- Szövegbeviteli mező -->
		<textarea
			bind:this={textareaRef}
			bind:value={inputValue}
			onkeydown={handleKeydown}
			oninput={handleInput}
			{disabled}
			rows={1}
			class="input-field"
			placeholder={t('ai-assistant.input.placeholder') ?? 'Mi a helyzet?'}
			aria-label={t('ai-assistant.input.label') ?? 'Kérdés beviteli mező'}
			aria-describedby={validationError ? 'input-error' : undefined}
			aria-invalid={isTooLong}
		></textarea>

		<!-- Send gomb -->
		<button
			onclick={handleSend}
			disabled={!canSubmit}
			aria-label={t('ai-assistant.input.send') ?? 'Küldés'}
			class="send-button"
		>
			<ArrowRight class="h-5 w-5" />
		</button>
	</div>
</div>

<style>
	.input-wrapper-container {
		width: 100%;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--border);
		border-radius: 9999px;
		background: var(--background);
		padding: 0.5rem 1rem;
	}

	.input-field {
		flex: 1;
		outline: none;
		border: none;
		background: transparent;
		padding-top: 0.375rem; /* Placeholder vizuálisan középre igazítása */
		min-height: 36px;
		max-height: 120px;
		resize: none;
		color: var(--foreground);
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	.input-field::placeholder {
		color: var(--muted-foreground);
	}

	.input-field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-button {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		transition: background-color 0.2s ease;
		border-radius: 50%;
		background: var(--primary);
		width: 36px;
		height: 36px;
		color: var(--primary-foreground);
	}

	.send-button:hover:not(:disabled) {
		opacity: 0.9;
		background: var(--primary);
	}

	.send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
