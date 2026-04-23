<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { ButtonSave, IconButton } from '$lib/components/shared/buttons';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { TestTube } from 'lucide-svelte/icons';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import {
		getAIAssistantConfig,
		updateAIAssistantConfig,
		testTTSProviderConnection,
		isAIAgentEnabled
	} from '../admin-config.remote';

	const { t } = useI18n();
	const actionBar = getActionBar();

	// State
	let isLoading = $state(false);
	let isTesting = $state(false);
	let isSaving = $state(false);
	let isLoadingVoices = $state(false);
	let testSuccess = $state(false);
	let testError = $state('');
	let aiAgentEnabled = $state(false);
	let aiAgentConfigured = $state(false);

	// Form state
	let enabled = $state(false); // TTS Provider globális engedélyezése
	let provider = $state('browser');
	let apiKey = $state('');
	let voiceId = $state('');
	let language = $state('en');
	let availableVoices = $state<Array<{ id: string; name: string }>>([]);

	// Active config indicator
	let hasActiveConfig = $state(false);

	// Current AI Agent config (needed for save)
	let currentAIAgentConfig = $state<any>(null);

	const providers = [
		{ value: 'browser', label: 'Browser Web Speech API' },
		{ value: 'elevenlabs', label: 'ElevenLabs' }
	];

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'hu', label: 'Hungarian' },
		{ value: 'de', label: 'German' },
		{ value: 'fr', label: 'French' },
		{ value: 'es', label: 'Spanish' }
	];

	onMount(async () => {
		// Először ellenőrizzük, hogy az AI Agent engedélyezve van-e
		const status = await isAIAgentEnabled({});
		aiAgentEnabled = status.enabled;
		aiAgentConfigured = status.configured;

		if (aiAgentEnabled) {
			await loadConfig();
		}

		// Set initial action bar
		actionBar.set(configActions);
	});

	// Action bar frissítése az enabled állapot alapján
	$effect(() => {
		if (enabled) {
			actionBar.set(configActions);
		} else {
			actionBar.clear();
		}
	});

	// Automatikus mentés, ha kikapcsolják a TTS Provider-t
	async function handleEnabledChange(newValue: boolean) {
		if (!newValue) {
			// Ha kikapcsolják, automatikusan mentjük
			isSaving = true;
			try {
				if (!currentAIAgentConfig) {
					toast.error(t('settings.admin.ttsProvider.aiAgentConfigMissing'));
					enabled = true;
					return;
				}

				const result = await updateAIAssistantConfig({
					enabled: true, // AI Agent enabled marad
					aiAgent: {
						provider: currentAIAgentConfig.provider,
						apiKey: currentAIAgentConfig.apiKeyEncrypted,
						model: currentAIAgentConfig.model,
						baseUrl: currentAIAgentConfig.baseUrl,
						advancedParams: currentAIAgentConfig.advancedParams
					},
					ttsProvider: {
						enabled: false,
						provider: provider || 'browser',
						apiKey: apiKey || undefined,
						voiceId: voiceId || undefined,
						language: language || 'en'
					}
				});

				if (result.success) {
					toast.success(t('settings.admin.ttsProvider.disabled'));

					// Értesítjük a rendszert
					if (typeof window !== 'undefined') {
						window.dispatchEvent(new CustomEvent('tts-provider-config-changed'));
					}
				} else {
					enabled = true;
					toast.error(result.error || t('settings.admin.ttsProvider.saveFailed'));
				}
			} catch {
				enabled = true;
				toast.error(t('settings.admin.ttsProvider.saveFailed'));
			} finally {
				isSaving = false;
			}
		}
	}

	async function loadConfig() {
		isLoading = true;
		try {
			const result = await getAIAssistantConfig({});

			if (result.success && result.config) {
				const config = result.config;
				currentAIAgentConfig = config.aiAgent;
				enabled = config.ttsProvider.enabled ?? true;
				provider = config.ttsProvider.provider;
				apiKey = config.ttsProvider.apiKeyEncrypted || '';
				voiceId = config.ttsProvider.voiceId || '';
				language = config.ttsProvider.language || 'en';
				hasActiveConfig = true;

				// Ha ElevenLabs van kiválasztva és van API kulcs, akkor automatikusan betöltjük a hangokat
				if (provider === 'elevenlabs' && apiKey) {
					await handleLoadVoices();
				}
			}
		} catch (error) {
			console.error('Error loading TTS Provider config:', error);
			toast.error(t('settings.admin.ttsProvider.loadFailed'));
		} finally {
			isLoading = false;
		}
	}

	async function handleLoadVoices() {
		if (provider === 'browser') {
			toast.info(t('settings.admin.ttsProvider.browserVoicesInfo'));
			return;
		}

		if (provider === 'elevenlabs' && !apiKey) {
			toast.error(t('settings.admin.ttsProvider.validation.apiKeyRequired'));
			return;
		}

		isLoadingVoices = true;
		try {
			// Ha a kulcs maszkolt, akkor a backend endpoint-ot használjuk
			if (apiKey.includes('*')) {
				const { loadElevenLabsVoices } = await import('../admin-config.remote');
				const result = await loadElevenLabsVoices({});

				if (result.success && result.voices) {
					availableVoices = result.voices;
					toast.success(
						t('settings.admin.ttsProvider.voicesLoaded', { count: availableVoices.length })
					);
				} else {
					throw new Error(result.error || 'Failed to load voices');
				}
			} else {
				// Ha a kulcs nem maszkolt, akkor közvetlenül hívjuk az API-t
				const response = await fetch('https://api.elevenlabs.io/v1/voices', {
					method: 'GET',
					headers: {
						'xi-api-key': apiKey
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch voices');
				}

				const data = await response.json();
				// Csak a premade és generated hangokat, library hangok fizetősek az API-n
				availableVoices = data.voices
					.filter((v: any) => v.category === 'premade' || v.category === 'generated')
					.map((v: any) => ({
						id: v.voice_id,
						name: v.name
					}));

				toast.success(
					t('settings.admin.ttsProvider.voicesLoaded', { count: availableVoices.length })
				);
			}
		} catch (error) {
			console.error('Error loading voices:', error);
			toast.error(t('settings.admin.ttsProvider.voicesLoadFailed'));
		} finally {
			isLoadingVoices = false;
		}
	}

	async function handleTestVoice() {
		if (provider === 'elevenlabs' && (!apiKey || !voiceId)) {
			toast.error(t('settings.admin.ttsProvider.validation.required'));
			return;
		}

		isTesting = true;
		testSuccess = false;
		testError = '';

		try {
			const result = await testTTSProviderConnection({
				provider,
				apiKey: provider === 'elevenlabs' ? apiKey : undefined,
				voiceId: provider === 'elevenlabs' ? voiceId : undefined
			});

			if (result.success) {
				testSuccess = true;
				toast.success(result.message || t('settings.admin.ttsProvider.testSuccess'));

				// Play test audio
				if (provider === 'browser') {
					const utterance = new SpeechSynthesisUtterance('Test voice');
					utterance.lang = language;
					window.speechSynthesis.speak(utterance);
				} else if (provider === 'elevenlabs') {
					// ElevenLabs teszt hang lejátszása
					try {
						let audioUrl: string;

						// Ha a kulcs maszkolt, akkor a backend endpoint-ot használjuk
						if (apiKey.includes('*')) {
							const { testElevenLabsVoice } = await import('../admin-config.remote');
							const result = await testElevenLabsVoice({
								voiceId,
								text: 'This is a test voice.'
							});

							if (!result.success || !result.audioUrl) {
								throw new Error(result.error || 'Failed to generate test audio');
							}

							audioUrl = result.audioUrl;
						} else {
							// Ha a kulcs nem maszkolt, akkor közvetlenül hívjuk az API-t
							const response = await fetch(
								`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
								{
									method: 'POST',
									headers: {
										Accept: 'audio/mpeg',
										'Content-Type': 'application/json',
										'xi-api-key': apiKey
									},
									body: JSON.stringify({
										text: 'This is a test voice.',
										model_id: 'eleven_multilingual_v2',
										voice_settings: {
											stability: 0.5,
											similarity_boost: 0.75,
											style: 0.0,
											use_speaker_boost: true
										}
									})
								}
							);

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${await response.text()}`);
							}

							const audioBlob = await response.blob();
							audioUrl = URL.createObjectURL(audioBlob);
						}

						// Audio elem létrehozása és lejátszása
						const audio = new Audio(audioUrl);
						audio.onended = () => {
							// Csak akkor szabadítjuk fel, ha blob URL
							if (audioUrl.startsWith('blob:')) {
								URL.revokeObjectURL(audioUrl);
							}
						};
						audio.play();
					} catch (error) {
						console.error('[TTSProviderConfigPanel] ElevenLabs teszt hiba:', error);
						toast.error('Failed to play test audio');
					}
				}
			} else {
				testError = result.error || t('settings.admin.ttsProvider.testFailed');
				toast.error(testError);
			}
		} catch (error) {
			testError = t('settings.admin.ttsProvider.testFailed');
			toast.error(testError);
		} finally {
			isTesting = false;
		}
	}

	async function handleSave() {
		if (provider === 'elevenlabs' && !apiKey) {
			toast.error(t('settings.admin.ttsProvider.validation.apiKeyRequired'));
			return;
		}

		if (!currentAIAgentConfig) {
			toast.error(t('settings.admin.ttsProvider.aiAgentConfigMissing'));
			return;
		}

		isSaving = true;
		try {
			const result = await updateAIAssistantConfig({
				enabled: true, // AI Agent enabled marad
				aiAgent: {
					provider: currentAIAgentConfig.provider,
					apiKey: currentAIAgentConfig.apiKeyEncrypted, // A maszkolt kulcs
					model: currentAIAgentConfig.model,
					baseUrl: currentAIAgentConfig.baseUrl,
					advancedParams: currentAIAgentConfig.advancedParams
				},
				ttsProvider: {
					enabled,
					provider,
					apiKey: provider === 'elevenlabs' ? apiKey : undefined,
					voiceId: provider === 'elevenlabs' ? voiceId : undefined,
					language
				}
			});

			if (result.success) {
				toast.success(t('settings.admin.ttsProvider.saveSuccess'));
				hasActiveConfig = true;
				await loadConfig(); // Reload to get masked API key

				// Értesítjük a rendszert
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('tts-provider-config-changed'));
				}
			} else {
				toast.error(result.error || t('settings.admin.ttsProvider.saveFailed'));
			}
		} catch (error) {
			console.error('Error saving TTS Provider config:', error);
			toast.error(t('settings.admin.ttsProvider.saveFailed'));
		} finally {
			isSaving = false;
		}
	}
</script>

{#snippet configActions()}
	{#if enabled}
		<IconButton
			variant="outline"
			text={isTesting ? t('common.testing') : t('settings.admin.ttsProvider.testVoice')}
			onclick={handleTestVoice}
		>
			{#snippet icon()}<TestTube />{/snippet}
		</IconButton>
	{/if}
	<ButtonSave
		text={isSaving ? t('common.saving') : t('common.buttons.save')}
		onclick={handleSave}
	/>
{/snippet}

{#if !aiAgentEnabled}
	<ContentSection
		title={t('settings.admin.ttsProvider.title')}
		description={t('settings.admin.ttsProvider.description')}
		contentPosition="bottom"
	>
		<div
			class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950"
		>
			<p class="text-sm font-medium text-yellow-900 dark:text-yellow-100">
				{t('settings.admin.ttsProvider.enableAIAgentFirst')}
			</p>
		</div>
	</ContentSection>
{:else}
	<!-- TTS Provider Enable/Disable Switch -->
	{#if !enabled}
		<ContentSection
			title={t('settings.admin.ttsProvider.enableTitle')}
			description={t('settings.admin.ttsProvider.enableDescription')}
			contentPosition="right"
		>
			{#snippet info()}
				{t('settings.admin.ttsProvider.enableInfo')}
			{/snippet}

			<Switch bind:checked={enabled} onCheckedChange={(checked) => handleEnabledChange(checked)} />
		</ContentSection>
	{:else}
		<ContentSection
			title={t('settings.admin.ttsProvider.enableTitle')}
			description={t('settings.admin.ttsProvider.enableDescription')}
			contentPosition="right"
		>
			<Switch bind:checked={enabled} onCheckedChange={(checked) => handleEnabledChange(checked)} />
		</ContentSection>
	{/if}

	{#if enabled}
		<ContentSection
			title={t('settings.admin.ttsProvider.title')}
			description={t('settings.admin.ttsProvider.description')}
			contentPosition="bottom"
		>
			{#snippet info()}
				{t('settings.admin.ttsProvider.info')}
			{/snippet}

			{#if hasActiveConfig}
				<span class="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
							clip-rule="evenodd"
						/>
					</svg>
					{t('settings.admin.ttsProvider.active')}
				</span>
			{:else}
				<span class="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
							clip-rule="evenodd"
						/>
					</svg>
					{t('settings.admin.ttsProvider.inactive')}
				</span>
			{/if}

			{#if isLoading}
				<div class="mt-4 flex items-center justify-center py-4">
					<p class="text-muted-foreground text-sm">{t('common.loading')}</p>
				</div>
			{:else}
				<div class="mt-4 space-y-4">
					<!-- Provider Selection -->
					<div class="grid gap-2">
						<Label for="tts-provider">{t('settings.admin.ttsProvider.provider')}</Label>
						<select
							id="tts-provider"
							bind:value={provider}
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each providers as p}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</div>

					<!-- API Key (only for ElevenLabs) -->
					{#if provider === 'elevenlabs'}
						<div class="grid gap-2">
							<Label for="tts-api-key">{t('settings.admin.ttsProvider.apiKey')}</Label>
							<Input
								id="tts-api-key"
								type="password"
								bind:value={apiKey}
								placeholder={t('settings.admin.ttsProvider.apiKeyPlaceholder')}
							/>
						</div>

						<!-- Load Voices Button -->
						<div>
							<Button
								onclick={handleLoadVoices}
								disabled={isLoadingVoices}
								variant="outline"
								size="sm"
							>
								{isLoadingVoices ? t('common.loading') : t('settings.admin.ttsProvider.loadVoices')}
							</Button>
						</div>

						<!-- Voice Selection -->
						{#if availableVoices.length > 0}
							<div class="grid gap-2">
								<Label for="voice-id">{t('settings.admin.ttsProvider.voice')}</Label>
								<select
									id="voice-id"
									bind:value={voiceId}
									class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="">{t('settings.admin.ttsProvider.selectVoice')}</option>
									{#each availableVoices as voice}
										<option value={voice.id}>{voice.name}</option>
									{/each}
								</select>
							</div>
						{/if}
					{/if}

					<!-- Language Selection -->
					<div class="grid gap-2">
						<Label for="language">{t('settings.admin.ttsProvider.language')}</Label>
						<select
							id="language"
							bind:value={language}
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each languages as lang}
								<option value={lang.value}>{lang.label}</option>
							{/each}
						</select>
					</div>

					<!-- Test Connection Result -->
					{#if testSuccess}
						<div
							class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
						>
							<p class="text-sm font-medium text-green-900 dark:text-green-100">
								{t('settings.admin.ttsProvider.testSuccess')}
							</p>
						</div>
					{/if}

					{#if testError}
						<div
							class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
						>
							<p class="text-sm font-medium text-red-900 dark:text-red-100">{testError}</p>
						</div>
					{/if}
				</div>
			{/if}
		</ContentSection>
	{/if}
{/if}
