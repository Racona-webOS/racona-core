<!--
  AgentSettings — AI ügynök beállítások

  Az adminisztrátor itt konfigurálhatja az AI agent API kapcsolatot.
  Támogatott provider-ek: Gemini, Groq, OpenAI, Anthropic, Hugging Face, Custom
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAgentConfig, saveAgentConfig, testAgentConnection } from '../agent-config.remote.js';
	import type { AgentConfigWithMaskedKey } from '$lib/server/database/repositories';
	import { Eye, EyeOff, TestTube } from 'lucide-svelte';

	const { t } = useI18n();

	// -------------------------------------------------------------------------
	// Állapot
	// -------------------------------------------------------------------------

	let loading = $state(true);
	let saving = $state(false);
	let testing = $state(false);

	// Provider opciók
	const providers = [
		{ value: 'gemini', label: 'Google Gemini', recommended: true },
		{ value: 'groq', label: 'Groq' },
		{ value: 'openai', label: 'OpenAI' },
		{ value: 'anthropic', label: 'Anthropic (Claude)' },
		{ value: 'huggingface', label: 'Hugging Face' },
		{ value: 'custom', label: 'Custom Endpoint' }
	];

	// Eredeti konfiguráció (a visszavonáshoz)
	let originalConfig = $state<AgentConfigWithMaskedKey | null>(null);

	// Aktuális szerkesztett állapot
	let provider = $state<string>('gemini');
	let apiKey = $state('');
	let modelName = $state('');
	let baseUrl = $state('');
	let maxTokens = $state(1000);
	let temperature = $state(0.7);

	// UI állapotok
	let showApiKey = $state(false);
	let showAdvanced = $state(false);
	let apiKeyChanged = $state(false); // Jelzi, hogy az API key megváltozott-e

	// -------------------------------------------------------------------------
	// Derived
	// -------------------------------------------------------------------------

	const hasChanges = $derived(
		!originalConfig ||
			provider !== originalConfig.provider ||
			apiKeyChanged ||
			modelName !== (originalConfig.modelName ?? '') ||
			baseUrl !== (originalConfig.baseUrl ?? '') ||
			maxTokens !== (originalConfig.maxTokens ?? 1000) ||
			temperature !== parseFloat(originalConfig.temperature ?? '0.70')
	);

	// -------------------------------------------------------------------------
	// Betöltés
	// -------------------------------------------------------------------------

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const result = await getAgentConfig();

			if (result.success && result.config) {
				originalConfig = result.config;
				provider = result.config.provider;
				apiKey = result.config.apiKeyMasked; // Maszkolt key
				modelName = result.config.modelName ?? '';
				baseUrl = result.config.baseUrl ?? '';
				maxTokens = result.config.maxTokens ?? 1000;
				temperature = parseFloat(result.config.temperature ?? '0.70');
				apiKeyChanged = false;
			}
		} catch (err) {
			console.error('[AgentSettings] Betöltési hiba:', err);
			toast.error(t('ai-assistant.agent.loadError'));
		} finally {
			loading = false;
		}
	}

	// -------------------------------------------------------------------------
	// Mentés
	// -------------------------------------------------------------------------

	async function handleSave() {
		if (!apiKey || apiKey.trim() === '') {
			toast.error(t('ai-assistant.agent.apiKeyRequired'));
			return;
		}

		saving = true;
		try {
			const result = await saveAgentConfig({
				provider,
				apiKey,
				modelName: modelName.trim() || null,
				baseUrl: baseUrl.trim() || null,
				maxTokens,
				temperature: temperature.toFixed(2)
			});

			if (result.success) {
				toast.success(t('ai-assistant.agent.saveSuccess'));

				// Frissítjük a state-et a mentett konfigurációból
				if (result.config) {
					originalConfig = result.config;
					provider = result.config.provider;
					apiKey = result.config.apiKeyMasked;
					modelName = result.config.modelName ?? '';
					baseUrl = result.config.baseUrl ?? '';
					maxTokens = result.config.maxTokens ?? 1000;
					temperature = parseFloat(result.config.temperature ?? '0.70');
					apiKeyChanged = false;
				}
			} else {
				toast.error(result.error ?? t('ai-assistant.agent.saveError'));
			}
		} catch (err) {
			console.error('[AgentSettings] Mentési hiba:', err);
			toast.error(t('ai-assistant.agent.saveError'));
		} finally {
			saving = false;
		}
	}

	// -------------------------------------------------------------------------
	// Kapcsolat tesztelése
	// -------------------------------------------------------------------------

	async function handleTest() {
		if (!apiKey || apiKey.trim() === '') {
			toast.error(t('ai-assistant.agent.apiKeyRequired'));
			return;
		}

		testing = true;
		try {
			const result = await testAgentConnection({
				provider,
				apiKey,
				modelName: modelName.trim() || null,
				baseUrl: baseUrl.trim() || null
			});

			if (result.success) {
				toast.success(result.message ?? t('ai-assistant.agent.testSuccess'));
			} else {
				toast.error(result.error ?? t('ai-assistant.agent.testError'));
			}
		} catch (err) {
			console.error('[AgentSettings] Tesztelési hiba:', err);
			toast.error(t('ai-assistant.agent.testError'));
		} finally {
			testing = false;
		}
	}

	// -------------------------------------------------------------------------
	// Visszavonás
	// -------------------------------------------------------------------------

	function handleCancel() {
		if (originalConfig) {
			provider = originalConfig.provider;
			apiKey = originalConfig.apiKeyMasked;
			modelName = originalConfig.modelName ?? '';
			baseUrl = originalConfig.baseUrl ?? '';
			maxTokens = originalConfig.maxTokens ?? 1000;
			temperature = parseFloat(originalConfig.temperature ?? '0.70');
			apiKeyChanged = false;
		}
	}

	// -------------------------------------------------------------------------
	// API Key változás kezelése
	// -------------------------------------------------------------------------

	function handleApiKeyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		apiKey = target.value;
		apiKeyChanged = true;
	}
</script>

<div class="agent-settings">
	{#if loading}
		<div class="agent-settings__loading">
			<span class="agent-settings__spinner"></span>
			<span>{t('ai-assistant.agent.loading')}</span>
		</div>
	{:else}
		<div class="agent-settings__content">
			<!-- Provider választó -->
			<div class="agent-settings__field">
				<Label for="provider">{t('ai-assistant.agent.provider')}</Label>
				<select id="provider" bind:value={provider} class="agent-settings__select">
					{#each providers as prov (prov.value)}
						<option value={prov.value}>
							{prov.label}
							{#if prov.recommended}
								({t('ai-assistant.agent.recommended')})
							{/if}
						</option>
					{/each}
				</select>
			</div>

			<!-- API Key -->
			<div class="agent-settings__field">
				<Label for="api-key">{t('ai-assistant.agent.apiKey')}</Label>
				<div class="agent-settings__input-group">
					<Input
						id="api-key"
						type={showApiKey ? 'text' : 'password'}
						value={apiKey}
						oninput={handleApiKeyChange}
						placeholder={t('ai-assistant.agent.apiKeyPlaceholder')}
					/>
					<button
						type="button"
						class="agent-settings__toggle-btn"
						onclick={() => (showApiKey = !showApiKey)}
						aria-label={showApiKey
							? t('ai-assistant.agent.hideApiKey')
							: t('ai-assistant.agent.showApiKey')}
					>
						{#if showApiKey}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
				<p class="agent-settings__hint">{t('ai-assistant.agent.apiKeyHint')}</p>
			</div>

			<!-- Model név -->
			<div class="agent-settings__field">
				<Label for="model-name">{t('ai-assistant.agent.modelName')}</Label>
				<Input
					id="model-name"
					type="text"
					bind:value={modelName}
					placeholder={t('ai-assistant.agent.modelNamePlaceholder')}
				/>
				<p class="agent-settings__hint">{t('ai-assistant.agent.modelNameHint')}</p>
			</div>

			<!-- Advanced beállítások -->
			<div class="agent-settings__advanced">
				<button
					type="button"
					class="agent-settings__advanced-toggle"
					onclick={() => (showAdvanced = !showAdvanced)}
				>
					{showAdvanced
						? t('ai-assistant.agent.hideAdvanced')
						: t('ai-assistant.agent.showAdvanced')}
				</button>

				{#if showAdvanced}
					<div class="agent-settings__advanced-content">
						<!-- Base URL -->
						<div class="agent-settings__field">
							<Label for="base-url">{t('ai-assistant.agent.baseUrl')}</Label>
							<Input
								id="base-url"
								type="text"
								bind:value={baseUrl}
								placeholder={t('ai-assistant.agent.baseUrlPlaceholder')}
							/>
							<p class="agent-settings__hint">{t('ai-assistant.agent.baseUrlHint')}</p>
						</div>

						<!-- Max Tokens -->
						<div class="agent-settings__field">
							<Label for="max-tokens">
								{t('ai-assistant.agent.maxTokens')}: {maxTokens}
							</Label>
							<Slider
								id="max-tokens"
								type="single"
								min={100}
								max={4000}
								step={100}
								bind:value={maxTokens}
							/>
						</div>

						<!-- Temperature -->
						<div class="agent-settings__field">
							<Label for="temperature">
								{t('ai-assistant.agent.temperature')}: {temperature.toFixed(2)}
							</Label>
							<Slider
								id="temperature"
								type="single"
								min={0}
								max={1}
								step={0.01}
								bind:value={temperature}
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Gombok -->
			<div class="agent-settings__actions">
				<Button variant="outline" onclick={handleTest} disabled={testing || saving}>
					<TestTube class="mr-2 h-4 w-4" />
					{testing ? t('ai-assistant.agent.testing') : t('ai-assistant.agent.testConnection')}
				</Button>
				<div class="agent-settings__actions-right">
					<Button variant="outline" onclick={handleCancel} disabled={saving || !hasChanges}>
						{t('ai-assistant.agent.cancel')}
					</Button>
					<Button onclick={handleSave} disabled={saving || !hasChanges}>
						{saving ? t('ai-assistant.agent.saving') : t('ai-assistant.agent.save')}
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.agent-settings {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		height: 100%;
		overflow-y: auto;
	}

	.agent-settings__loading {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		height: 100%;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.agent-settings__spinner {
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

	.agent-settings__content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 600px;
	}

	.agent-settings__field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.agent-settings__select {
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

	.agent-settings__select:focus {
		box-shadow: 0 0 0 3px rgba(var(--color-primary-500-rgb), 0.1);
		border-color: var(--color-primary-500);
	}

	:global(.dark) .agent-settings__select {
		border-color: var(--color-neutral-700);
		background: rgba(var(--color-neutral-800-rgb), 0.3);
		color: var(--color-neutral-100);
	}

	:global(.dark) .agent-settings__select:hover {
		background: rgba(var(--color-neutral-800-rgb), 0.5);
	}

	:global(.dark) .agent-settings__select:focus {
		border-color: var(--color-primary-500);
	}

	.agent-settings__input-group {
		display: flex;
		position: relative;
		align-items: center;
	}

	.agent-settings__toggle-btn {
		display: flex;
		position: absolute;
		right: 0.75rem;
		justify-content: center;
		align-items: center;
		transition: color 0.2s;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0.25rem;
		color: var(--color-neutral-500);
	}

	.agent-settings__toggle-btn:hover {
		color: var(--color-neutral-700);
	}

	:global(.dark) .agent-settings__toggle-btn:hover {
		color: var(--color-neutral-300);
	}

	.agent-settings__hint {
		margin: 0;
		color: var(--color-neutral-500);
		font-size: 0.8125rem;
	}

	.agent-settings__advanced {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-top: 1px solid var(--color-neutral-200);
		padding-top: 1rem;
	}

	:global(.dark) .agent-settings__advanced {
		border-top-color: var(--color-neutral-700);
	}

	.agent-settings__advanced-toggle {
		transition: color 0.2s;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
		color: var(--color-primary-500);
		font-size: 0.875rem;
		text-align: left;
	}

	.agent-settings__advanced-toggle:hover {
		color: var(--color-primary-600);
	}

	.agent-settings__advanced-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.agent-settings__actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.agent-settings__actions-right {
		display: flex;
		gap: 0.75rem;
	}
</style>
