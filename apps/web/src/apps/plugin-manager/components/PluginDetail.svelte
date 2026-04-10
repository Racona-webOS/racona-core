<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import ContentSection from '$lib/components/shared/ContentSection.svelte';
	import { IconButton } from '$lib/components/shared/buttons';
	import { ArrowLeft, Package, Trash2, Shield } from 'lucide-svelte/icons';
	import { getAppShell } from '$lib/apps/appShell.svelte';
	import { getActionBar } from '$lib/apps/actionBar.svelte';
	import { useI18n } from '$lib/i18n/hooks';
	import { fetchPluginDetail } from '../plugins.remote';
	import type { PluginDetail } from '../plugins.remote';
	import { ConfirmDialog } from '$lib/components/ui';
	import { toast } from 'svelte-sonner';
	import { getClientAppRegistry } from '$lib/services/client/appRegistry';
	import { hasPermission } from '$lib/stores/permissionStore.svelte';
	import { getWindowManager } from '$lib/stores/windowStore.svelte';
	import { getDesktopStore } from '$lib/stores/desktopStore.svelte';

	interface Props {
		pluginId: string;
		returnTo?: string;
	}

	let { pluginId, returnTo = 'PluginList' }: Props = $props();

	const shell = getAppShell();
	const actionBar = getActionBar();
	const { t, locale } = useI18n();

	let plugin = $state<PluginDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Check if user has permission to uninstall plugins
	const canUninstall = $derived(hasPermission('plugin.manual.install'));

	// Uninstall confirmation dialog state
	let uninstallDialogOpen = $state(false);
	let uninstalling = $state(false);

	function handleBack() {
		actionBar.clear();
		shell.navigateTo(returnTo);
	}

	function handleUninstallClick() {
		uninstallDialogOpen = true;
	}

	function cancelUninstall() {
		uninstallDialogOpen = false;
	}

	async function confirmUninstall() {
		if (!plugin) return;

		uninstalling = true;
		try {
			// Sima fetch hívás a command helyett, hogy ne invalidálja a layout load-ot
			const response = await fetch(`/api/plugins/${plugin.appId}`, { method: 'DELETE' });
			const result = await response.json();

			if (result.success) {
				toast.success(t('plugin-manager.detail.uninstallSuccess'));
				uninstallDialogOpen = false;
				actionBar.clear();

				// Nyitott ablakok bezárása az eltávolított pluginhoz
				const windowManager = getWindowManager();
				const pluginWindows = windowManager.windows.filter((w) => w.appName === plugin!.appId);
				for (const win of pluginWindows) {
					windowManager.closeWindow(win.id);
				}

				// Desktop parancsikonok eltávolítása a store-ból (az adatbázisból a szerver már törölte)
				const desktopStore = getDesktopStore();
				const pluginShortcuts = desktopStore.shortcuts.filter((s) => s.appId === plugin!.appId);
				for (const shortcut of pluginShortcuts) {
					desktopStore.shortcuts = desktopStore.shortcuts.filter((s) => s.id !== shortcut.id);
				}

				// App registry frissítése, hogy a plugin eltűnjön a start menüből
				const appRegistry = getClientAppRegistry();
				await appRegistry.refresh();

				// Visszanavigálás a listára
				shell.navigateTo(returnTo);
			} else {
				toast.error(result.error || t('plugin-manager.detail.uninstallError'));
			}
		} catch (err) {
			console.error('Failed to uninstall plugin:', err);
			toast.error(t('plugin-manager.detail.uninstallError'));
		} finally {
			uninstalling = false;
		}
	}

	async function loadPlugin() {
		loading = true;
		error = null;
		try {
			const result = await fetchPluginDetail({ pluginId });
			if (result.success && result.data) {
				plugin = result.data;
				// Set action bar after loading (only if user has permission)
				if (canUninstall) {
					actionBar.set(pluginActions);
				}
			} else {
				error = result.error || t('plugin-manager.detail.error');
			}
		} catch (err) {
			console.error('Failed to load plugin:', err);
			error = t('plugin-manager.detail.error');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const id = pluginId;
		if (id) {
			untrack(() => loadPlugin());
		}
	});
</script>

{#snippet pluginActions()}
	<IconButton
		variant="destructive"
		text={t('plugin-manager.detail.uninstall')}
		onclick={handleUninstallClick}
	>
		{#snippet icon()}<Trash2 />{/snippet}
	</IconButton>
{/snippet}

<div class="title-block">
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" class="size-8" onclick={handleBack}>
			<ArrowLeft class="size-4" />
			<span class="sr-only">{t('common.buttons.back')}</span>
		</Button>
		<h2>
			{plugin
				? typeof plugin.name === 'object'
					? plugin.name[locale] || plugin.name['hu']
					: plugin.appId
				: t('plugin-manager.detail.title')}
		</h2>
	</div>
</div>

{#if loading}
	<div class="flex items-center justify-center py-8">
		<p class="text-muted-foreground">{t('common.status.loading')}</p>
	</div>
{:else if error}
	<div class="error-block">
		<p>{error}</p>
	</div>
{:else if plugin}
	<div class="detail-container">
		<!-- Alapvető információk -->
		<ContentSection title={t('plugin-manager.detail.basicInfo')} contentPosition="bottom">
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">{t('plugin-manager.detail.status')}</span>
					<span class="info-value">
						{#if plugin.pluginStatus === 'active'}
							<Badge variant="default" class="bg-green-600"
								>{t('plugin-manager.list.status.active')}</Badge
							>
						{:else}
							<Badge variant="destructive">{t('plugin-manager.list.status.inactive')}</Badge>
						{/if}
					</span>
				</div>

				<div class="info-item">
					<span class="info-label">{t('plugin-manager.detail.appId')}</span>
					<span class="info-value font-mono">{plugin.appId}</span>
				</div>

				<div class="info-item">
					<span class="info-label">{t('plugin-manager.detail.version')}</span>
					<span class="info-value">{plugin.version}</span>
				</div>

				<div class="info-item">
					<span class="info-label">{t('plugin-manager.detail.category')}</span>
					<span class="info-value">{plugin.category}</span>
				</div>
			</div>
		</ContentSection>

		<!-- Szerző és leírás -->
		{#if plugin.pluginAuthor || plugin.pluginDescription}
			<ContentSection title={t('plugin-manager.detail.details')} contentPosition="bottom">
				<div class="info-grid">
					{#if plugin.pluginAuthor}
						<div class="info-item">
							<span class="info-label">{t('plugin-manager.detail.author')}</span>
							<span class="info-value">{plugin.pluginAuthor}</span>
						</div>
					{/if}

					{#if plugin.pluginDescription}
						<div class="info-item">
							<span class="info-label">{t('plugin-manager.detail.description')}</span>
							<span class="info-value">{plugin.pluginDescription}</span>
						</div>
					{/if}
				</div>
			</ContentSection>
		{/if}

		<!-- Jogosultságok -->
		{#if plugin.pluginPermissions && plugin.pluginPermissions.length > 0}
			<ContentSection
				title={t('plugin-manager.detail.permissions')}
				description={t('plugin-manager.detail.permissionsDescription')}
				contentPosition="bottom"
			>
				<div class="badges-container">
					{#each plugin.pluginPermissions as permission}
						<Badge variant="secondary" class="gap-1">
							<Shield class="size-3" />
							{permission}
						</Badge>
					{/each}
				</div>
			</ContentSection>
		{/if}

		<!-- Függőségek -->
		{#if plugin.pluginDependencies && Object.keys(plugin.pluginDependencies).length > 0}
			<ContentSection title={t('plugin-manager.detail.dependencies')} contentPosition="bottom">
				<div class="dependencies-list">
					{#each Object.entries(plugin.pluginDependencies) as [name, version]}
						<div class="dependency-item">
							<span class="font-mono">{name}</span>
							<Badge variant="outline" class="text-xs">{version}</Badge>
						</div>
					{/each}
				</div>
			</ContentSection>
		{/if}

		<!-- Rendszer információk -->
		<ContentSection title={t('plugin-manager.detail.systemInfo')} contentPosition="bottom">
			<div class="info-grid">
				{#if plugin.pluginMinWebosVersion}
					<div class="info-item">
						<span class="info-label">{t('plugin-manager.detail.minVersion')}</span>
						<span class="info-value">{plugin.pluginMinWebosVersion}</span>
					</div>
				{/if}

				{#if plugin.pluginInstalledAt}
					<div class="info-item">
						<span class="info-label">{t('plugin-manager.detail.installedAt')}</span>
						<span class="info-value text-muted-foreground">
							{new Date(plugin.pluginInstalledAt).toLocaleString()}
						</span>
					</div>
				{/if}

				{#if plugin.pluginUpdatedAt}
					<div class="info-item">
						<span class="info-label">{t('plugin-manager.detail.updatedAt')}</span>
						<span class="info-value text-muted-foreground">
							{new Date(plugin.pluginUpdatedAt).toLocaleString()}
						</span>
					</div>
				{/if}
			</div>
		</ContentSection>
	</div>
{/if}

<!-- Uninstall confirmation dialog -->
<ConfirmDialog
	bind:open={uninstallDialogOpen}
	title={t('plugin-manager.detail.uninstallTitle')}
	description={plugin
		? t('plugin-manager.detail.uninstallDescription', {
				name:
					typeof plugin.name === 'object' ? plugin.name[locale] || plugin.name['hu'] : plugin.appId
			})
		: ''}
	confirmText={t('plugin-manager.detail.uninstallConfirm')}
	cancelText={t('common.buttons.cancel')}
	confirmVariant="destructive"
	onConfirm={confirmUninstall}
	onCancel={cancelUninstall}
/>

<style>
	.detail-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 48rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.info-item {
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

	.error-block {
		margin: 1rem 0;
		border: 1px solid var(--color-red-200);
		border-radius: var(--radius-md, 0.375rem);
		background-color: var(--color-red-50);
		padding: 1rem;
		color: var(--color-red-700);
	}

	:global(.dark) .error-block {
		border-color: var(--color-red-700);
		background-color: var(--color-red-900);
		color: var(--color-red-200);
	}
</style>
