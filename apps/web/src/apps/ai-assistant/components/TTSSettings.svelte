<!--
  TTSSettings — Text-to-Speech beállítások

  User felülbírálások: autoPlay, rate, pitch, volume, voice override
  Admin beállítások (provider, API key, default voice) a Settings appban
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { getAiAssistantStore } from '../stores/aiAssistantStore.svelte.js';
	import { getTTSSettings, saveTTSSettings } from '../tts-settings.remote.js';
	import { Play } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const aiStore = getAiAssistantStore();
	const tts = aiStore.tts;

	let loading = $state(true);
	let saving = $state(false);

	// Teszt szöveg
	const testText = 'Üdvözöllek! Ez egy teszt üzenet a felolvasás kipróbálásához.';

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;
		try {
			const result = await getTTSSettings();
			if (result.success && result.settings) {
				tts.loadUserSettings(result.settings);
			}
		} catch (err) {
			console.error('[TTSSettings] Betöltési hiba:', err);
			toast.error('Beállítások betöltése sikertelen');
		} finally {
			loading = false;
		}
	}

	function handleTest() {
		if (!tts.isSupported) {
			if (tts.provider === 'elevenlabs') {
				toast.error('ElevenLabs API kulcs hiányzik (admin beállítás)');
			} else {
				toast.error('A böngésző nem támogatja a felolvasást');
			}
			return;
		}

		tts.speakTest(testText);
	}

	async function handleSave() {
		saving = true;
		try {
			const settings = tts.getUserSettings();
			const result = await saveTTSSettings(settings);

			if (result.success) {
				toast.success('Beállítások mentve');
			} else {
				toast.error(result.error || 'Mentés sikertelen');
			}
		} catch (err) {
			console.error('[TTSSettings] Mentési hiba:', err);
			toast.error('Mentés sikertelen');
		} finally {
			saving = false;
		}
	}

	// Automatikus mentés változáskor (debounced)
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// Figyeljük a változásokat
		void tts.autoPlay;
		void tts.rate;
		void tts.pitch;
		void tts.volume;
		void tts.selectedVoiceOverride;

		// Skip initial load
		if (loading) return;

		// Debounce: 1 másodperc után mentés
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			handleSave();
		}, 1000);
	});
</script>

<div class="tts-settings">
	{#if loading}
		<div class="tts-settings__loading">
			<span class="tts-settings__spinner"></span>
			<span>Betöltés...</span>
		</div>
	{:else if !tts.isGloballyEnabled}
		<div class="tts-settings__disabled">
			<div class="tts-settings__disabled-icon">🔇</div>
			<h3>TTS szolgáltatás letiltva</h3>
			<p>
				A felolvasás funkció jelenleg le van tiltva. Kérj meg egy adminisztrátort, hogy engedélyezze
				a Settings appban.
			</p>
		</div>
	{:else}
		<div class="tts-settings__content">
			<!-- Provider info (read-only) -->
			<div class="tts-settings__info">
				<div class="tts-settings__info-item">
					<span class="tts-settings__info-label">Szolgáltató:</span>
					<span class="tts-settings__info-value">
						{#if tts.provider === 'browser'}
							Böngésző (Web Speech API)
						{:else}
							ElevenLabs
						{/if}
					</span>
				</div>
				<p class="tts-settings__hint">
					A szolgáltatót és az API kulcsot az adminisztrátor állítja be a Settings appban.
				</p>
			</div>

			<!-- Hang kiválasztása (opcionális felülbírálás) -->
			{#if tts.provider === 'browser'}
				<div class="tts-settings__field">
					<Label for="tts-voice">Hang (opcionális felülbírálás)</Label>
					<select
						id="tts-voice"
						bind:value={tts.selectedVoiceOverride}
						class="tts-settings__select"
					>
						<option value={null}>Alapértelmezett (admin beállítás)</option>
						{#each tts.availableVoices as voice (voice.name)}
							<option value={voice.name}>
								{voice.name} ({voice.lang})
								{#if voice.default}(alapértelmezett){/if}
							</option>
						{/each}
					</select>
					<p class="tts-settings__hint">
						Ha nem választasz hangot, az admin által beállított alapértelmezett hang lesz használva.
					</p>
				</div>

				<!-- Sebesség -->
				<div class="tts-settings__field">
					<Label for="tts-rate">Sebesség: {tts.rate.toFixed(1)}x</Label>
					<Slider id="tts-rate" type="single" min={0.5} max={2} step={0.1} bind:value={tts.rate} />
					<p class="tts-settings__hint">Felolvasás sebessége (0.5x = lassú, 2x = gyors)</p>
				</div>

				<!-- Hangmagasság -->
				<div class="tts-settings__field">
					<Label for="tts-pitch">Hangmagasság: {tts.pitch.toFixed(1)}</Label>
					<Slider
						id="tts-pitch"
						type="single"
						min={0.5}
						max={2}
						step={0.1}
						bind:value={tts.pitch}
					/>
					<p class="tts-settings__hint">Hang magassága (0.5 = mély, 2 = magas)</p>
				</div>
			{:else if tts.provider === 'elevenlabs'}
				<!-- ElevenLabs hang felülbírálás -->
				{#if tts.elevenLabsVoices.length > 0}
					<div class="tts-settings__field">
						<Label for="elevenlabs-voice">Hang (opcionális felülbírálás)</Label>
						<select
							id="elevenlabs-voice"
							bind:value={tts.selectedVoiceOverride}
							class="tts-settings__select"
						>
							<option value={null}>Alapértelmezett (admin beállítás)</option>
							{#each tts.elevenLabsVoices as voice (voice.voice_id)}
								<option value={voice.voice_id}>
									{voice.name} ({voice.category})
								</option>
							{/each}
						</select>
						<p class="tts-settings__hint">
							Ha nem választasz hangot, az admin által beállított alapértelmezett hang lesz
							használva.
						</p>
					</div>
				{/if}
			{/if}

			<!-- Hangerő (mindkét provider-nél) -->
			<div class="tts-settings__field">
				<Label for="tts-volume">Hangerő: {Math.round(tts.volume * 100)}%</Label>
				<Slider id="tts-volume" type="single" min={0} max={1} step={0.1} bind:value={tts.volume} />
				<p class="tts-settings__hint">Felolvasás hangereje</p>
			</div>

			<!-- Automatikus felolvasás -->
			<div class="tts-settings__field">
				<div class="flex items-center justify-between">
					<Label for="tts-autoplay">Automatikus felolvasás</Label>
					<label class="tts-settings__switch">
						<input id="tts-autoplay" type="checkbox" bind:checked={tts.autoPlay} />
						<span class="tts-settings__slider"></span>
					</label>
				</div>
				<p class="tts-settings__hint">Automatikusan felolvassa az új asszisztens válaszokat</p>
			</div>

			<!-- Teszt gomb -->
			<div class="tts-settings__actions">
				<Button variant="outline" onclick={handleTest} disabled={saving}>
					<Play class="mr-2 h-4 w-4" />
					Teszt felolvasás
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.tts-settings {
		display: flex;
		flex-direction: column;
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

	.tts-settings__disabled {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 3rem 1.5rem;
		color: var(--color-neutral-600);
		text-align: center;
	}

	.tts-settings__disabled-icon {
		opacity: 0.5;
		font-size: 4rem;
	}

	.tts-settings__disabled h3 {
		margin: 0;
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 1.25rem;
	}

	:global(.dark) .tts-settings__disabled h3 {
		color: var(--color-neutral-100);
	}

	.tts-settings__disabled p {
		margin: 0;
		max-width: 400px;
		font-size: 0.875rem;
	}

	.tts-settings__content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		max-width: 600px;
	}

	.tts-settings__info {
		border: 1px solid var(--color-primary-200);
		border-radius: 0.5rem;
		background: var(--color-primary-50);
		padding: 1rem;
	}

	:global(.dark) .tts-settings__info {
		border-color: var(--color-primary-800);
		background: rgba(var(--color-primary-900-rgb), 0.2);
	}

	.tts-settings__info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.tts-settings__info-label {
		color: var(--color-neutral-700);
		font-weight: 500;
	}

	:global(.dark) .tts-settings__info-label {
		color: var(--color-neutral-300);
	}

	.tts-settings__info-value {
		color: var(--color-primary-700);
		font-weight: 600;
	}

	:global(.dark) .tts-settings__info-value {
		color: var(--color-primary-400);
	}

	.tts-settings__field {
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

	.tts-settings__actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	/* Toggle Switch */
	.tts-settings__switch {
		display: inline-block;
		position: relative;
		width: 44px;
		height: 24px;
	}

	.tts-settings__switch input {
		display: none;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.tts-settings__slider {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		transition: 0.3s;
		cursor: pointer;
		border-radius: 24px;
		background-color: var(--color-neutral-300);
	}

	.tts-settings__slider:before {
		position: absolute;
		bottom: 3px;
		left: 3px;
		transition: 0.3s;
		border-radius: 50%;
		background-color: white;
		width: 18px;
		height: 18px;
		content: '';
	}

	input:checked + .tts-settings__slider {
		background-color: var(--color-primary-500);
	}

	input:checked + .tts-settings__slider:before {
		transform: translateX(20px);
	}

	:global(.dark) .tts-settings__slider {
		background-color: var(--color-neutral-600);
	}

	:global(.dark) input:checked + .tts-settings__slider {
		background-color: var(--color-primary-600);
	}
</style>
