<!--
  TTSSettings — Text-to-Speech beállítások

  User felülbírálások: autoPlay, rate, pitch, volume, voice override
  Admin beállítások (provider, API key, default voice) a Settings appban
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';
	import { getTTSSettings, saveTTSSettings } from '../tts-settings.remote.js';
	import { toast } from 'svelte-sonner';

	const { t } = useI18n();
	const aiStore = getAiAssistantStore();
	const tts = aiStore.tts;

	let loading = $state(true);
	let saving = $state(false);

	// Teszt szöveg
	const testText = $derived(t('ai-assistant.tts.testText'));

	// Eredeti beállítások (a visszavonáshoz)
	let originalSettings = $state<{
		enabled: boolean;
		autoPlay: boolean;
		rate: number;
		pitch: number;
		volume: number;
		selectedVoiceOverride: string | null;
	}>({
		enabled: true,
		autoPlay: false,
		rate: 1,
		pitch: 1,
		volume: 1,
		selectedVoiceOverride: null
	});

	// Exportált API a szülő komponens számára
	export const api = {
		get saving() {
			return saving;
		},
		get hasChanges() {
			return (
				tts.userEnabled !== originalSettings.enabled ||
				tts.autoPlay !== originalSettings.autoPlay ||
				tts.rate !== originalSettings.rate ||
				tts.pitch !== originalSettings.pitch ||
				tts.volume !== originalSettings.volume ||
				tts.selectedVoiceOverride !== originalSettings.selectedVoiceOverride
			);
		},
		async handleSave() {
			saving = true;
			try {
				const settings = tts.getUserSettings();
				const result = await saveTTSSettings(settings);

				if (result.success) {
					// Frissítjük az eredeti beállításokat
					originalSettings = {
						enabled: tts.userEnabled,
						autoPlay: tts.autoPlay,
						rate: tts.rate,
						pitch: tts.pitch,
						volume: tts.volume,
						selectedVoiceOverride: tts.selectedVoiceOverride
					};
					return { success: true };
				} else {
					return { success: false, error: result.error || t('ai-assistant.tts.errors.saveFailed') };
				}
			} catch (err) {
				console.error('[TTSSettings] Mentési hiba:', err);
				return { success: false, error: t('ai-assistant.tts.errors.saveFailed') };
			} finally {
				saving = false;
			}
		},
		handleCancel() {
			// Visszaállítjuk az eredeti értékeket
			tts.userEnabled = originalSettings.enabled;
			tts.autoPlay = originalSettings.autoPlay;
			tts.rate = originalSettings.rate;
			tts.pitch = originalSettings.pitch;
			tts.volume = originalSettings.volume;
			tts.selectedVoiceOverride = originalSettings.selectedVoiceOverride;
		},
		handleTest() {
			if (!tts.isSupported) {
				if (tts.provider === 'elevenlabs') {
					toast.error(t('ai-assistant.tts.errors.elevenLabsKeyMissing'));
				} else {
					toast.error(t('ai-assistant.tts.errors.notSupported'));
				}
				return;
			}

			tts.speakTest(testText);
		}
	};

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;
		try {
			const result = await getTTSSettings({});
			if (result.success && result.settings) {
				tts.loadUserSettings(result.settings);
				// Frissítjük az eredeti beállításokat a betöltés után
				originalSettings = {
					enabled: tts.userEnabled,
					autoPlay: tts.autoPlay,
					rate: tts.rate,
					pitch: tts.pitch,
					volume: tts.volume,
					selectedVoiceOverride: tts.selectedVoiceOverride
				};
			}
		} catch (err) {
			console.error('[TTSSettings] Betöltési hiba:', err);
			toast.error(t('ai-assistant.tts.errors.loadFailed'));
		} finally {
			loading = false;
		}
	}
</script>

<div class="tts-settings">
	{#if loading}
		<div class="tts-settings__loading">
			<span class="tts-settings__spinner"></span>
			<span>{t('ai-assistant.tts.loading')}</span>
		</div>
	{:else if !tts.isGloballyEnabled}
		<div class="tts-settings__disabled-info">
			<div class="tts-settings__disabled-header">
				<span class="tts-settings__disabled-label">{t('ai-assistant.tts.disabled.title')}</span>
			</div>
			<p class="tts-settings__disabled-message">
				{t('ai-assistant.tts.disabled.message')}
			</p>
		</div>
	{:else}
		<div class="tts-settings__content">
			<!-- User-level TTS engedélyezés -->
			<div class="tts-settings__field">
				<div class="flex items-center justify-between">
					<Label for="tts-user-enabled">{t('ai-assistant.tts.userEnabled.label')}</Label>
					<Switch id="tts-user-enabled" bind:checked={tts.userEnabled} />
				</div>
				<p class="tts-settings__hint">{t('ai-assistant.tts.userEnabled.hint')}</p>
			</div>

			{#if tts.userEnabled}
				<!-- Provider info (read-only) -->
				<div class="tts-settings__provider-info">
					<div class="tts-settings__provider-header">
						<span class="tts-settings__provider-label">{t('ai-assistant.tts.provider.label')}</span>
					</div>
					<div class="tts-settings__provider-value">
						{#if tts.provider === 'browser'}
							{t('ai-assistant.tts.provider.browser')}
						{:else}
							{t('ai-assistant.tts.provider.elevenlabs')}
						{/if}
					</div>
					<p class="tts-settings__provider-note">
						{t('ai-assistant.tts.provider.note')}
					</p>
				</div>

				<!-- Hang kiválasztása (opcionális felülbírálás) -->
				{#if tts.provider === 'browser'}
					<div class="tts-settings__field">
						<Label for="tts-voice">{t('ai-assistant.tts.voice.label')}</Label>
						<select
							id="tts-voice"
							bind:value={tts.selectedVoiceOverride}
							class="tts-settings__select"
						>
							<option value={null}>{t('ai-assistant.tts.voice.default')}</option>
							{#each tts.availableVoices as voice (voice.name)}
								<option value={voice.name}>
									{voice.name} ({voice.lang})
									{#if voice.default}({t('ai-assistant.tts.voice.defaultMarker')}){/if}
								</option>
							{/each}
						</select>
						<p class="tts-settings__hint">
							{t('ai-assistant.tts.voice.hint')}
						</p>
					</div>

					<!-- Csúszkák egymás mellett -->
					<div class="tts-settings__sliders">
						<!-- Sebesség -->
						<div class="tts-settings__slider-field">
							<Label for="tts-rate"
								>{t('ai-assistant.tts.rate.label')}: {tts.rate.toFixed(1)}x</Label
							>
							<Slider
								id="tts-rate"
								type="single"
								min={0.5}
								max={2}
								step={0.1}
								bind:value={tts.rate}
							/>
							<p class="tts-settings__hint">{t('ai-assistant.tts.rate.range')}</p>
						</div>

						<!-- Hangmagasság -->
						<div class="tts-settings__slider-field">
							<Label for="tts-pitch"
								>{t('ai-assistant.tts.pitch.label')}: {tts.pitch.toFixed(1)}</Label
							>
							<Slider
								id="tts-pitch"
								type="single"
								min={0.5}
								max={2}
								step={0.1}
								bind:value={tts.pitch}
							/>
							<p class="tts-settings__hint">{t('ai-assistant.tts.pitch.range')}</p>
						</div>

						<!-- Hangerő -->
						<div class="tts-settings__slider-field">
							<Label for="tts-volume"
								>{t('ai-assistant.tts.volume.label')}: {Math.round(tts.volume * 100)}%</Label
							>
							<Slider
								id="tts-volume"
								type="single"
								min={0}
								max={1}
								step={0.1}
								bind:value={tts.volume}
							/>
							<p class="tts-settings__hint">{t('ai-assistant.tts.volume.range')}</p>
						</div>
					</div>
				{:else if tts.provider === 'elevenlabs'}
					<!-- ElevenLabs hang felülbírálás -->
					{#if tts.elevenLabsVoices.length > 0}
						<div class="tts-settings__field">
							<Label for="elevenlabs-voice">{t('ai-assistant.tts.voice.label')}</Label>
							<select
								id="elevenlabs-voice"
								bind:value={tts.selectedVoiceOverride}
								class="tts-settings__select"
							>
								<option value={null}>{t('ai-assistant.tts.voice.default')}</option>
								{#each tts.elevenLabsVoices as voice (voice.voice_id)}
									<option value={voice.voice_id}>
										{voice.name} ({voice.category})
									</option>
								{/each}
							</select>
							<p class="tts-settings__hint">
								{t('ai-assistant.tts.voice.hint')}
							</p>
						</div>
					{/if}

					<!-- Hangerő (ElevenLabs esetén csak ez) -->
					<div class="tts-settings__field">
						<Label for="tts-volume"
							>{t('ai-assistant.tts.volume.label')}: {Math.round(tts.volume * 100)}%</Label
						>
						<Slider
							id="tts-volume"
							type="single"
							min={0}
							max={1}
							step={0.1}
							bind:value={tts.volume}
						/>
						<p class="tts-settings__hint">{t('ai-assistant.tts.volume.hint')}</p>
					</div>
				{/if}

				<!-- Automatikus felolvasás -->
				<div class="tts-settings__field">
					<div class="flex items-center justify-between">
						<Label for="tts-autoplay">{t('ai-assistant.tts.autoPlay.label')}</Label>
						<Switch id="tts-autoplay" bind:checked={tts.autoPlay} />
					</div>
					<p class="tts-settings__hint">{t('ai-assistant.tts.autoPlay.hint')}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tts-settings {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow-y: auto;
	}

	.tts-settings__loading {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.tts-settings__spinner {
		display: inline-block;
		animation: spin 0.7s linear infinite;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		width: 1rem;
		height: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.tts-settings__disabled-info {
		margin: 1.5rem;
		border: 1px solid var(--color-amber-300);
		border-radius: 0.5rem;
		background: var(--color-amber-50);
		padding: 1rem;
	}

	:global(.dark) .tts-settings__disabled-info {
		border-color: var(--color-amber-700);
		background: rgba(251, 191, 36, 0.1);
	}

	.tts-settings__disabled-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.tts-settings__disabled-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.tts-settings__disabled-label {
		color: var(--color-amber-800);
		font-weight: 600;
		font-size: 0.875rem;
	}

	:global(.dark) .tts-settings__disabled-label {
		color: var(--color-amber-400);
	}

	.tts-settings__disabled-message {
		margin: 0;
		color: var(--color-amber-700);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	:global(.dark) .tts-settings__disabled-message {
		color: var(--color-amber-300);
	}

	.tts-settings__content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.tts-settings__provider-info {
		margin-bottom: 0.5rem;
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		background: var(--color-neutral-50);
		padding: 1rem;
	}

	:global(.dark) .tts-settings__provider-info {
		border-color: var(--color-neutral-700);
		background: var(--color-neutral-800);
	}

	.tts-settings__provider-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.tts-settings__provider-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.tts-settings__provider-label {
		color: var(--color-neutral-600);
		font-weight: 500;
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	:global(.dark) .tts-settings__provider-label {
		color: var(--color-neutral-400);
	}

	.tts-settings__provider-value {
		margin-bottom: 0.5rem;
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 1rem;
	}

	:global(.dark) .tts-settings__provider-value {
		color: var(--color-neutral-100);
	}

	.tts-settings__provider-note {
		margin: 0;
		color: var(--color-neutral-500);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	:global(.dark) .tts-settings__provider-note {
		color: var(--color-neutral-500);
	}

	.tts-settings__field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tts-settings__sliders {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.tts-settings__slider-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tts-settings__select {
		display: flex;
		align-items: center;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		outline: none;
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.375rem;
		background: transparent;
		padding: 0.5rem 0.75rem;
		width: 100%;
		height: 2.25rem;
		color: var(--color-neutral-900);
		font-size: 0.875rem;
	}

	.tts-settings__select:focus {
		box-shadow: 0 0 0 3px rgba(var(--color-primary-500-rgb), 0.1);
		border-color: var(--color-primary-500);
	}

	:global(.dark) .tts-settings__select {
		border-color: var(--color-neutral-700);
		background: rgba(var(--color-neutral-800-rgb), 0.3);
		color: var(--color-neutral-100);
	}

	:global(.dark) .tts-settings__select:hover {
		background: rgba(var(--color-neutral-800-rgb), 0.5);
	}

	:global(.dark) .tts-settings__select:focus {
		border-color: var(--color-primary-500);
	}

	.tts-settings__hint {
		margin: 0;
		color: var(--color-neutral-500);
		font-size: 0.8125rem;
	}
</style>
