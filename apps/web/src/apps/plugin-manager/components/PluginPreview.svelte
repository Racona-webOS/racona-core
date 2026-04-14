<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { UniversalIcon } from '$lib/components/shared';
	import { Shield, Download, X, AlertTriangle } from 'lucide-svelte/icons';
	import { IconButton } from '$lib/components/shared/buttons';
	import { useI18n } from '$lib/i18n/hooks';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import type { PluginManifest } from '@racona/database';
	import { toast } from 'svelte-sonner';
	import { getClientAppRegistry } from '$lib/services/client/appRegistry';
	import { onDestroy } from 'svelte';

	interface Props {
		tempFile?: string;
		manifest?: PluginManifest & { iconData?: string };
		warnings?: Array<{ code: string; message: string }>;
	}

	let { tempFile, manifest, warnings = [] }: Props = $props();

	const { t } = useI18n();
	const shell = getAppShell();
	const actionBar = getActionBar();

	let installing = $state(false);

	// If manifest is not provided, navigate back to upload
	$effect(() => {
		if (!manifest || !tempFile) {
			shell.navigateTo('PluginUpload');
		} else {
			// Set action bar when component loads
			actionBar.set(previewActions);
		}
	});

	// Cleanup when component is destroyed
	onDestroy(() => {
		cleanupTempFile();
		actionBar.clear();
	});

	async function cleanupTempFile() {
		if (!tempFile) return;

		try {
			await fetch('/api/plugins/cleanup-temp', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tempFile })
			});
		} catch (error) {
			console.error('Failed to cleanup temp file:', error);
			// Don't show error to user, it's not critical
		}
	}

	function handleBack() {
		// Cleanup temp file before navigating back
		cleanupTempFile();
		actionBar.clear();
		shell.navigateTo('PluginUpload');
	}

	async function handleInstall() {
		installing = true;
		try {
			const response = await fetch('/api/plugins/install', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tempFile,
					manifest
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				toast.success(t('plugin-manager.preview.installSuccess'));

				// Refresh app registry
				const appRegistry = getClientAppRegistry();
				await appRegistry.refresh();

				// Clear action bar and navigate to plugin list
				actionBar.clear();
				shell.navigateTo('PluginList');
			} else {
				toast.error(result.error || t('plugin-manager.preview.installError'));
			}
		} catch (error) {
			console.error('Failed to install plugin:', error);
			toast.error(t('plugin-manager.preview.installError'));
		} finally {
			installing = false;
		}
	}
</script>

{#snippet previewActions()}
	{#if !installing}
		<IconButton
			variant="default"
			text={t('plugin-manager.preview.install')}
			onclick={handleInstall}
		>
			{#snippet icon()}<Download />{/snippet}
		</IconButton>
		<IconButton variant="outline" text={t('common.buttons.cancel')} onclick={handleBack}>
			{#snippet icon()}<X />{/snippet}
		</IconButton>
	{:else}
		<IconButton variant="default" text={t('plugin-manager.preview.installing')} onclick={() => {}}>
			{#snippet icon()}<Download />{/snippet}
		</IconButton>
	{/if}
{/snippet}

<div class="title-block">
	<h2>{t('plugin-manager.preview.title')}</h2>
</div>

<div class="preview-container">
	{#if manifest}
		{@const displayName =
			typeof manifest.name === 'string' ? manifest.name : manifest.name.hu || manifest.name.en}
		{@const displayDescription =
			typeof manifest.description === 'string'
				? manifest.description
				: manifest.description.hu || manifest.description.en}

		<!-- Alapvető információk -->
		<ContentSection
			title={displayName}
			description="{t('plugin-manager.preview.version')}: {manifest.version}"
			contentPosition="bottom"
		>
			<div class="plugin-header">
				<div class="plugin-icon" class:cover={manifest.iconStyle === 'cover'}>
					<UniversalIcon
						icon={manifest.iconData || manifest.icon}
						appName={manifest.iconData ? undefined : manifest.id}
						size={manifest.iconStyle === 'cover' ? 80 : 64}
					/>
				</div>
				<div class="plugin-basic-info">
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.preview.description')}</span>
						<span class="info-value">{displayDescription}</span>
					</div>
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.preview.author')}</span>
						<span class="info-value">{manifest.author}</span>
					</div>
					<div class="info-row">
						<span class="info-label">{t('plugin-manager.preview.pluginId')}</span>
						<span class="info-value font-mono">{manifest.id}</span>
					</div>
				</div>
			</div>
		</ContentSection>

		<!-- Jogosultságok -->
		{#if manifest.permissions && manifest.permissions.length > 0}
			<ContentSection
				title={t('plugin-manager.preview.permissions')}
				description={t('plugin-manager.preview.permissionsDescription')}
				contentPosition="bottom"
			>
				{#snippet info()}
					{t('plugin-manager.preview.permissionsInfo')}
				{/snippet}
				<div class="badges-container">
					{#each manifest.permissions as permission}
						<Badge variant="secondary" class="gap-1">
							<Shield class="size-3" />
							{permission}
						</Badge>
					{/each}
				</div>
			</ContentSection>
		{/if}

		<!-- Függőségek -->
		{#if manifest.dependencies && Object.keys(manifest.dependencies).length > 0}
			<ContentSection
				title={t('plugin-manager.preview.dependencies')}
				description={t('plugin-manager.preview.dependenciesDescription')}
				contentPosition="bottom"
			>
				<div class="dependencies-list">
					{#each Object.entries(manifest.dependencies) as [name, version]}
						<div class="dependency-item">
							<span class="font-mono">{name}</span>
							<Badge variant="outline" class="text-xs">{version}</Badge>
						</div>
					{/each}
				</div>
			</ContentSection>
		{/if}

		<!-- További információk -->
		{#if manifest.minWebOSVersion || (manifest.locales && manifest.locales.length > 0)}
			<ContentSection title={t('plugin-manager.preview.additionalInfo')} contentPosition="bottom">
				<div class="additional-info">
					{#if manifest.minWebOSVersion}
						<div class="info-row">
							<span class="info-label">{t('plugin-manager.preview.minVersion')}</span>
							<span class="info-value">{manifest.minWebOSVersion}</span>
						</div>
					{/if}

					{#if manifest.locales && manifest.locales.length > 0}
						<div class="info-row">
							<span class="info-label">{t('plugin-manager.preview.locales')}</span>
							<div class="badges-container">
								{#each manifest.locales as loc}
									<Badge variant="outline" class="text-xs">{loc}</Badge>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</ContentSection>
		{/if}

		<!-- Figyelmeztetések -->
		{#if warnings.length > 0}
			<ContentSection title={t('plugin-manager.preview.warnings')} contentPosition="bottom">
				<div class="warnings-list">
					{#each warnings as warning}
						<div class="warning-item">
							<AlertTriangle class="size-4 shrink-0" />
							<span>{warning.message}</span>
						</div>
					{/each}
				</div>
			</ContentSection>
		{/if}
	{/if}
</div>

<style>
	.preview-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 48rem;
	}

	.plugin-header {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
	}

	.plugin-icon {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		border-radius: 0.75rem;
		background: oklch(from var(--primary) l c h / 0.1);
		width: 5rem;
		height: 5rem;
		overflow: hidden;
		color: hsl(var(--primary));
	}

	.plugin-icon.cover {
		background: none;
		padding: 0;
	}

	.plugin-icon.cover :global(.universal-icon) {
		width: 100%;
		height: 100%;
	}

	.plugin-icon.cover :global(img) {
		border-radius: 0.75rem;
		width: 100% !important;
		height: 100% !important;
		object-fit: cover !important;
	}

	.plugin-icon.cover :global(.svg-container) {
		display: flex;
		justify-content: stretch;
		align-items: stretch;
		width: 100% !important;
		height: 100% !important;
	}

	.plugin-icon.cover :global(.svg-container svg) {
		width: 100% !important;
		height: 100% !important;
	}

	.plugin-basic-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		color: var(--color-neutral-500);
		font-weight: 500;
		font-size: 0.8125rem;
	}

	.info-value {
		color: var(--color-neutral-900);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	:global(.dark) .info-value {
		color: var(--color-neutral-300);
	}

	.badges-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.dependencies-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dependency-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid var(--color-neutral-200);
		border-radius: var(--radius-md, 0.375rem);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
	}

	:global(.dark) .dependency-item {
		border-color: var(--color-neutral-800);
	}

	.additional-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.warnings-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.warning-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		border: 1px solid var(--color-yellow-300);
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-yellow-50);
		padding: 0.75rem;
		color: var(--color-yellow-800);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	:global(.dark) .warning-item {
		border-color: var(--color-yellow-700);
		background-color: var(--color-yellow-950);
		color: var(--color-yellow-200);
	}
</style>
