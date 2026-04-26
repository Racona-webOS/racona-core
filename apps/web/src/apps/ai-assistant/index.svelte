<!--
  AI Asszisztens — Főkomponens (alkalmazás ablak).

  Egyszerű elrendezés: Avatar és TTS beállítások egy oldalon.
  Az AI asszisztens chat funkció a taskbar ikonon keresztül érhető el (AiFixedPanel).

  Requirements: 3.1, 3.2
-->
<script lang="ts">
	import { setContext } from 'svelte';
	import { createAppShell, APP_SHELL_CONTEXT_KEY } from '$lib/apps/appShell.svelte';
	import { createActionBar } from '$lib/apps/actionBar.svelte';
	import { I18nProvider } from '$lib/i18n/components';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Play } from 'lucide-svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { toast } from 'svelte-sonner';
	import AvatarSettings from './components/AvatarSettings.svelte';
	import TTSSettings from './components/TTSSettings.svelte';

	// Create a minimal app shell without menu
	const shell = createAppShell({
		appName: 'ai-assistant',
		menuData: []
	});

	// Set shell context for child components
	setContext(APP_SHELL_CONTEXT_KEY, shell);

	// Create action bar context
	const actionBar = createActionBar();

	const { t } = useI18n();

	// Referenciák a gyerek komponensekhez
	let avatarSettingsRef = $state<typeof AvatarSettings.prototype>();
	let ttsSettingsRef = $state<typeof TTSSettings.prototype>();

	// Action bar beállítása
	$effect(() => {
		actionBar.set(actionBarContent);
		return () => actionBar.clear();
	});

	// Gombok kezelői
	async function handleSave() {
		const avatarResult = await avatarSettingsRef?.api.handleSave();
		const ttsResult = await ttsSettingsRef?.api.handleSave();

		// Ellenőrizzük mindkét eredményt
		const avatarSuccess = avatarResult?.success ?? true; // Ha nincs avatar változás, akkor sikeres
		const ttsSuccess = ttsResult?.success ?? true; // Ha nincs TTS változás, akkor sikeres

		if (avatarSuccess && ttsSuccess) {
			toast.success(t('ai-assistant.settings.saveSuccess'));
		} else {
			// Ha valamelyik sikertelen, akkor hibát mutatunk
			const errorMsg =
				avatarResult?.error || ttsResult?.error || t('ai-assistant.settings.saveError');
			toast.error(errorMsg);
		}
	}

	function handleCancel() {
		avatarSettingsRef?.api.handleCancel();
		ttsSettingsRef?.api.handleCancel();
	}

	function handleTTSTest() {
		ttsSettingsRef?.api.handleTest();
	}

	// Változások figyelése - kombináljuk mindkét komponens változásait
	const hasAnyChanges = $derived(
		(avatarSettingsRef?.api.hasChanges ?? false) || (ttsSettingsRef?.api.hasChanges ?? false)
	);
	const isSaving = $derived(
		(avatarSettingsRef?.api.saving ?? false) || (ttsSettingsRef?.api.saving ?? false)
	);
</script>

<I18nProvider namespaces={['ai-assistant', 'common']}>
	<div class="ai-assistant-app">
		<div class="ai-assistant-app__content custom-scrollbar">
			<!-- Avatar beállítások -->
			<div class="ai-assistant-app__section">
				<ContentSection title={t('ai-assistant.avatar.title')} contentPosition="bottom">
					<AvatarSettings bind:this={avatarSettingsRef} />
				</ContentSection>
			</div>

			<!-- TTS beállítások -->
			<div class="ai-assistant-app__section">
				<ContentSection title={t('ai-assistant.tts.title')} contentPosition="bottom">
					<TTSSettings bind:this={ttsSettingsRef} />
				</ContentSection>
			</div>
		</div>

		{#if actionBar.content}
			<div class="app-action-bar">
				{@render actionBar.content()}
			</div>
		{/if}
	</div>
</I18nProvider>

{#snippet actionBarContent()}
	<div class="action-bar-buttons">
		<!-- Mentés és Mégse gombok (csak ha van változás) -->
		<div class="action-bar-group">
			{#if hasAnyChanges}
				<Button variant="outline" onclick={handleCancel} disabled={isSaving}>
					{t('ai-assistant.settings.cancel')}
				</Button>
			{/if}
			<Button onclick={handleSave} disabled={isSaving || !hasAnyChanges}>
				{isSaving ? t('ai-assistant.settings.saving') : t('ai-assistant.settings.save')}
			</Button>
		</div>

		<!-- TTS teszt gomb -->
		<div class="action-bar-group">
			<Button variant="outline" onclick={handleTTSTest} disabled={isSaving}>
				<Play class="mr-2 h-4 w-4" />
				{t('ai-assistant.tts.testButton')}
			</Button>
		</div>
	</div>
{/snippet}

<style>
	.ai-assistant-app {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		overflow: hidden;
	}

	.ai-assistant-app__content {
		flex: 1;
		padding: 0 1.5rem 1rem 0.5rem;
		overflow-y: auto;
	}

	.ai-assistant-app__section {
		flex-shrink: 0;
		margin-bottom: 1.5rem;
	}

	.ai-assistant-app__section:last-child {
		margin-bottom: 0;
	}

	.app-action-bar {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
		border-radius: var(--radius-md);
		background: var(--color-neutral-100);
		padding: 0.625rem 1rem;
	}

	:global(.dark) .app-action-bar {
		background: var(--color-neutral-800);
	}

	.action-bar-buttons {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.action-bar-group {
		display: flex;
		gap: 0.5rem;
	}

	.action-bar-group:last-child {
		margin-left: auto;
	}
</style>
