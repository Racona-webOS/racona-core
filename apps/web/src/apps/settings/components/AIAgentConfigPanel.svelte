<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { ButtonSave, IconButton } from '$lib/components/shared/buttons';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { TestTube, CircleHelp, ArrowLeft } from 'lucide-svelte/icons';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import {
		getAIAssistantConfig,
		updateAIAssistantConfig,
		testAIAgentConnection
	} from '../admin-config.remote';

	interface Props {
		onBack?: () => void;
	}

	let { onBack }: Props = $props();

	const { t } = useI18n();
	const actionBar = getActionBar();

	// State
	let isLoading = $state(false);
	let isTesting = $state(false);
	let isSaving = $state(false);
	let testSuccess = $state(false);
	let testError = $state('');

	// Form state
	let enabled = $state(false); // AI Agent globális engedélyezése - alapértelmezetten ki van kapcsolva
	let provider = $state('openai');
	let apiKey = $state('');
	let model = $state('gpt-4');
	let baseUrl = $state('');
	let maxTokens = $state(2000);
	let temperature = $state(0.7);
	let topP = $state(0.9);

	// Active config indicator
	let hasActiveConfig = $state(false);

	const providers = [
		{ value: 'openai', label: 'OpenAI' },
		{ value: 'anthropic', label: 'Anthropic (Claude)' },
		{ value: 'gemini', label: 'Google Gemini' }
	];

	onMount(async () => {
		await loadConfig();
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

	// Automatikus mentés, ha kikapcsolják az AI Agent-et
	async function handleEnabledChange(newValue: boolean) {
		if (!newValue) {
			// Ha kikapcsolják, automatikusan mentjük (akár van konfiguráció, akár nincs)
			isSaving = true;
			try {
				const result = await updateAIAssistantConfig({
					enabled: false,
					aiAgent: {
						provider: provider || 'openai',
						apiKey: apiKey || 'placeholder', // Placeholder, mert a backend elvárja
						model: model || 'gpt-4',
						baseUrl: baseUrl || undefined,
						advancedParams: {
							maxTokens: maxTokens || 2000,
							temperature: temperature || 0.7,
							topP: topP || 0.9
						}
					},
					ttsProvider: {
						provider: 'browser'
					}
				});

				if (result.success) {
					toast.success(t('settings.admin.aiAgent.disabled'));

					// Értesítjük a rendszert
					if (typeof window !== 'undefined') {
						window.dispatchEvent(new CustomEvent('ai-agent-config-changed'));
					}
				} else {
					// Ha sikertelen, visszaállítjuk a kapcsolót
					enabled = true;
					toast.error(result.error || t('settings.admin.aiAgent.saveFailed'));
				}
			} catch {
				enabled = true;
				toast.error(t('settings.admin.aiAgent.saveFailed'));
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
				enabled = config.enabled ?? true;
				provider = config.aiAgent.provider;
				apiKey = config.aiAgent.apiKeyEncrypted; // Masked
				model = config.aiAgent.model;
				baseUrl = config.aiAgent.baseUrl || '';
				maxTokens = config.aiAgent.advancedParams.maxTokens;
				temperature = config.aiAgent.advancedParams.temperature;
				topP = config.aiAgent.advancedParams.topP || 0.9;
				hasActiveConfig = true;
			} else {
				// Ha nincs konfiguráció, akkor alapértelmezetten ki van kapcsolva
				enabled = false;
			}
		} catch (error) {
			console.error('Error loading AI Agent config:', error);
			toast.error(t('settings.admin.aiAgent.loadFailed'));
		} finally {
			isLoading = false;
		}
	}

	async function handleTestConnection() {
		if (!apiKey || !model) {
			toast.error(t('settings.admin.aiAgent.validation.required'));
			return;
		}

		if (isTesting || isSaving) return; // Prevent multiple calls

		isTesting = true;
		testSuccess = false;
		testError = '';

		try {
			const result = await testAIAgentConnection({
				provider,
				apiKey,
				model,
				baseUrl: baseUrl || undefined
			});

			if (result.success) {
				testSuccess = true;
				toast.success(result.message || t('settings.admin.aiAgent.testSuccess'));
			} else {
				testError = result.error || t('settings.admin.aiAgent.testFailed');
				toast.error(testError);
			}
		} catch {
			testError = t('settings.admin.aiAgent.testFailed');
			toast.error(testError);
		} finally {
			isTesting = false;
		}
	}

	async function handleSave() {
		if (!apiKey || !model) {
			toast.error(t('settings.admin.aiAgent.validation.required'));
			return;
		}

		if (maxTokens < 1 || maxTokens > 100000) {
			toast.error(t('settings.admin.aiAgent.validation.maxTokensRange'));
			return;
		}

		if (temperature < 0 || temperature > 2) {
			toast.error(t('settings.admin.aiAgent.validation.temperatureRange'));
			return;
		}

		if (topP < 0 || topP > 1) {
			toast.error(t('settings.admin.aiAgent.validation.topPRange'));
			return;
		}

		if (isSaving || isTesting) return; // Prevent multiple calls

		isSaving = true;
		try {
			const result = await updateAIAssistantConfig({
				enabled,
				aiAgent: {
					provider,
					apiKey,
					model,
					baseUrl: baseUrl || undefined,
					advancedParams: {
						maxTokens,
						temperature,
						topP
					}
				},
				ttsProvider: {
					provider: 'browser' // Default, will be updated in TTS panel
				}
			});

			if (result.success) {
				toast.success(t('settings.admin.aiAgent.saveSuccess'));
				hasActiveConfig = true;
				await loadConfig(); // Reload to get masked API key

				// Értesítjük a rendszert, hogy az AI Agent konfiguráció megváltozott
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('ai-agent-config-changed'));
				}
			} else {
				toast.error(result.error || t('settings.admin.aiAgent.saveFailed'));
			}
		} catch {
			console.error('Error saving AI Agent config');
			toast.error(t('settings.admin.aiAgent.saveFailed'));
		} finally {
			isSaving = false;
		}
	}

	function handleBack() {
		onBack?.();
	}
</script>

{#snippet configActions()}
	{#if enabled}
		<IconButton
			variant="outline"
			text={isTesting ? t('common.testing') : t('settings.admin.aiAgent.testConnection')}
			onclick={handleTestConnection}
		>
			{#snippet icon()}<TestTube />{/snippet}
		</IconButton>
	{/if}
	<ButtonSave
		text={isSaving ? t('common.saving') : t('common.buttons.save')}
		onclick={handleSave}
	/>
{/snippet}

<div class="title-block">
	<div class="flex items-center gap-2">
		{#if onBack}
			<Button variant="ghost" size="icon" class="size-8" onclick={handleBack}>
				<ArrowLeft class="size-4" />
				<span class="sr-only">{t('common.buttons.back')}</span>
			</Button>
		{/if}
		<h2>{t('settings.admin.aiAgent.title')}</h2>
	</div>
</div>

<!-- AI Agent Enable/Disable Switch -->
{#if !enabled}
	<ContentSection
		title={t('settings.admin.aiAgent.enableTitle')}
		description={t('settings.admin.aiAgent.enableDescription')}
		contentPosition="right"
	>
		{#snippet info()}
			{t('settings.admin.aiAgent.enableInfo')}
		{/snippet}

		<Switch bind:checked={enabled} onCheckedChange={(checked) => handleEnabledChange(checked)} />
	</ContentSection>
{:else}
	<ContentSection
		title={t('settings.admin.aiAgent.enableTitle')}
		description={t('settings.admin.aiAgent.enableDescription')}
		contentPosition="right"
	>
		<Switch bind:checked={enabled} onCheckedChange={(checked) => handleEnabledChange(checked)} />
	</ContentSection>
{/if}

{#if enabled}
	<ContentSection title={t('settings.admin.aiAgent.description')} contentPosition="bottom">
		{#snippet info()}
			{t('settings.admin.aiAgent.info')}
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
				{t('settings.admin.aiAgent.active')}
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
				{t('settings.admin.aiAgent.inactive')}
			</span>
		{/if}

		{#if isLoading}
			<div class="mt-4 flex items-center justify-center py-4">
				<p class="text-muted-foreground text-sm">{t('common.loading')}</p>
			</div>
		{:else}
			<div class="mt-4 space-y-4">
				<!-- Provider és Model egymás mellett -->
				<div class="grid grid-cols-2 gap-4">
					<!-- Provider Selection -->
					<div class="grid gap-2">
						<Label for="provider">{t('settings.admin.aiAgent.provider')}</Label>
						<select
							id="provider"
							bind:value={provider}
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each providers as p (p.value)}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</div>

					<!-- Model Name -->
					<div class="grid gap-2">
						<Label for="model">{t('settings.admin.aiAgent.model')}</Label>
						<Input
							id="model"
							type="text"
							bind:value={model}
							placeholder={t('settings.admin.aiAgent.modelPlaceholder')}
						/>
					</div>
				</div>

				<!-- API Key teljes szélességben -->
				<div class="grid gap-2">
					<Label for="api-key">{t('settings.admin.aiAgent.apiKey')}</Label>
					<Input
						id="api-key"
						type="password"
						bind:value={apiKey}
						placeholder={t('settings.admin.aiAgent.apiKeyPlaceholder')}
					/>
				</div>

				<!-- Base URL (Optional) teljes szélességben -->
				<div class="grid gap-2">
					<Label for="base-url">{t('settings.admin.aiAgent.baseUrl')}</Label>
					<Input
						id="base-url"
						type="text"
						bind:value={baseUrl}
						placeholder={t('settings.admin.aiAgent.baseUrlPlaceholder')}
					/>
				</div>

				<!-- Test Connection Result -->
				{#if testSuccess}
					<div
						class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
					>
						<p class="text-sm font-medium text-green-900 dark:text-green-100">
							{t('settings.admin.aiAgent.testSuccess')}
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

	<!-- Advanced Parameters Section -->
	<ContentSection
		title={t('settings.admin.aiAgent.advancedParams')}
		description={t('settings.admin.aiAgent.advancedParamsDescription')}
		contentPosition="bottom"
	>
		{#snippet info()}
			{t('settings.admin.aiAgent.advancedParamsInfo')}
		{/snippet}

		{#if !isLoading}
			<div class="mt-4 w-full">
				<Tooltip.Provider delayDuration={200}>
					<div class="grid grid-cols-[1fr_1fr_1fr] gap-6">
						<!-- Max Tokens -->
						<div class="grid gap-2">
							<div class="flex items-center gap-2">
								<Label for="max-tokens">
									{t('settings.admin.aiAgent.maxTokens')}: {maxTokens.toLocaleString()}
								</Label>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<CircleHelp class="text-muted-foreground h-4 w-4" />
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p class="max-w-xs text-sm">
											{t('settings.admin.aiAgent.maxTokensTooltip')}
										</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<Slider
								id="max-tokens"
								type="single"
								min={100}
								max={100000}
								step={100}
								bind:value={maxTokens}
								class="w-full"
							/>
							<div class="text-muted-foreground flex justify-between text-xs">
								<span>100</span>
								<span>100k</span>
							</div>
						</div>

						<!-- Temperature -->
						<div class="grid gap-2">
							<div class="flex items-center gap-2">
								<Label for="temperature">
									{t('settings.admin.aiAgent.temperature')}: {temperature.toFixed(2)}
								</Label>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<CircleHelp class="text-muted-foreground h-4 w-4" />
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p class="max-w-xs text-sm">
											{t('settings.admin.aiAgent.temperatureTooltip')}
										</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<Slider
								id="temperature"
								type="single"
								min={0}
								max={2}
								step={0.01}
								bind:value={temperature}
								class="w-full"
							/>
							<div class="text-muted-foreground flex justify-between text-xs">
								<span>0.0</span>
								<span>2.0</span>
							</div>
						</div>

						<!-- Top P -->
						<div class="grid gap-2">
							<div class="flex items-center gap-2">
								<Label for="top-p">
									{t('settings.admin.aiAgent.topP')}: {topP.toFixed(2)}
								</Label>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<CircleHelp class="text-muted-foreground h-4 w-4" />
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p class="max-w-xs text-sm">
											{t('settings.admin.aiAgent.topPTooltip')}
										</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
							<Slider
								id="top-p"
								type="single"
								min={0}
								max={1}
								step={0.01}
								bind:value={topP}
								class="w-full"
							/>
							<div class="text-muted-foreground flex justify-between text-xs">
								<span>0.0</span>
								<span>1.0</span>
							</div>
						</div>
					</div>
				</Tooltip.Provider>
			</div>
		{/if}
	</ContentSection>
{/if}
