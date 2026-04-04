<script lang="ts">
	import { getClientAppRegistry, AppRegistryError } from '$lib/services/client/appRegistry';
	import { getWindowManager } from '$lib/stores';
	import AppIcon from './AppIcon.svelte';
	import AppListItem from './AppListItem.svelte';
	import { UniversalIcon } from '$lib/components/shared';
	import Input from '$lib/components/ui/input/input.svelte';
	import StartMenuFooter from './StartMenuFooter.svelte';
	import type { AppMetadata } from '$lib/types/window';
	import { useI18n } from '$lib/i18n/hooks';
	import { getContext, untrack } from 'svelte';
	import type { StartMenuSettings } from '$lib/types/settings';
	import { getTranslationStore } from '$lib/i18n/store.svelte.js';

	const { t } = useI18n();
	const windowManager = getWindowManager();
	const appRegistry = getClientAppRegistry();
	const translationStore = getTranslationStore();

	// Settings kontextus
	const settings = getContext<{ startMenu: StartMenuSettings }>('settings');
	const viewMode = $derived(settings.startMenu.viewMode);

	let { open = $bindable() } = $props();

	// State management for apps loading
	let apps = $state<AppMetadata[]>([]);
	let loading = $state(false);
	let error = $state<AppRegistryError | null>(null);
	let searchQuery = $state('');
	let lastLoadedLocale = $state('');

	const filteredApps = $derived(
		searchQuery.trim()
			? apps.filter((app) => app.title.toLowerCase().includes(searchQuery.toLowerCase()))
			: apps
	);

	// Track previous open state to detect open transition (false → true)
	let prevOpen = false;

	// Load apps on mount, when locale changes, or when menu opens
	$effect(() => {
		const locale = translationStore.currentLocale;
		const isOpen = open;

		const localeChanged = locale !== lastLoadedLocale;
		const justOpened = isOpen && !prevOpen;

		// Update previous open state outside reactive tracking
		prevOpen = isOpen;

		// Reload only if locale actually changed or menu just opened (false → true)
		if (localeChanged || justOpened) {
			untrack(() => {
				lastLoadedLocale = locale;
				loadApps();
			});
		}
	});

	async function loadApps() {
		loading = true;
		error = null;

		try {
			apps = await appRegistry.getApps();
		} catch (err) {
			if (err instanceof AppRegistryError) {
				error = err;
			} else {
				error = new AppRegistryError(
					'unknown_error' as any,
					'Failed to load applications',
					err instanceof Error ? err : undefined
				);
			}
			apps = [];
		} finally {
			loading = false;
		}
	}

	async function retryLoading() {
		try {
			await appRegistry.retry();
			await loadApps();
		} catch (err) {
			// Error will be handled by loadApps
		}
	}

	async function refreshApps() {
		try {
			await appRegistry.refresh();
			await loadApps();
		} catch (err) {
			// Error will be handled by loadApps
		}
	}

	let isDraggingApp = $state(false);

	function handleAppDragStart() {
		isDraggingApp = true;
	}

	function handleAppDragEnd() {
		// Kis késleltetés, hogy a drop esemény lefuthasson a workspace-en
		setTimeout(() => {
			isDraggingApp = false;
			open = false;
		}, 150);
	}

	function handleAppClick(app: AppMetadata) {
		if (isDraggingApp) return;
		windowManager.openWindow(app.appName, app.title, app, app.parameters);
		open = false;
	}
</script>

<div class="start-menu">
	<div class="header">
		<div class="search-bar">
			<UniversalIcon icon="Search" size={18} class="search-icon" />
			<Input
				name="appSearch"
				class="rounded-full pl-8"
				placeholder={t('desktop.startMenu.search')}
				bind:value={searchQuery}
			/>
		</div>
	</div>
	<div class="content">
		{#if error}
			<div class="error-state">
				<UniversalIcon icon="AlertCircle" size={32} class="error-icon" />
				<p class="error-message">{error.getUserFriendlyMessage()}</p>
				<div class="error-actions">
					{#if error.isRecoverable()}
						<button class="retry-button" onclick={retryLoading} disabled={loading}>
							{loading ? t('desktop.startMenu.retrying') : t('desktop.startMenu.retry')}
						</button>
					{/if}
					<button class="refresh-button" onclick={refreshApps} disabled={loading}>
						{loading ? t('desktop.startMenu.refreshing') : t('desktop.startMenu.refresh')}
					</button>
				</div>
			</div>
		{:else if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>{t('desktop.startMenu.loading')}</p>
			</div>
		{:else if apps.length > 0}
			<div class="apps" class:grid-view={viewMode === 'grid'} class:list-view={viewMode === 'list'}>
				{#each filteredApps as app}
					{#if viewMode === 'grid'}
						<AppIcon onclick={() => handleAppClick(app)} {app} />
					{:else}
						<AppListItem
							onclick={() => handleAppClick(app)}
							ondragstart={handleAppDragStart}
							ondragend={handleAppDragEnd}
							{app}
						/>
					{/if}
				{/each}
			</div>
			{#if filteredApps.length === 0}
				<div class="empty-state">
					<UniversalIcon icon="SearchX" size={32} class="empty-icon" />
					<p>{t('desktop.startMenu.noResults')}</p>
				</div>
			{/if}
		{:else}
			<div class="empty-state">
				<UniversalIcon icon="Package" size={32} class="empty-icon" />
				<p>{t('desktop.startMenu.noApps')}</p>
				<button class="refresh-button" onclick={refreshApps} disabled={loading}>
					{loading ? t('desktop.startMenu.refreshing') : t('desktop.startMenu.refresh')}
				</button>
			</div>
		{/if}
	</div>
	<StartMenuFooter {windowManager} onClose={() => (open = false)} />
</div>

<style>
	.start-menu {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 2rem;
		width: 100%;

		.header {
			display: flex;
			justify-content: center;
			align-items: center;

			.search-bar {
				display: flex;
				align-items: center;
				width: 50%;
				:global(.search-icon) {
					position: absolute;
					margin-left: 10px;
					color: #7f7f7f;
				}
			}
		}

		.content {
			display: flex;
			flex-grow: 1;
			flex-direction: column;
			justify-content: flex-start;
			align-items: center;
			padding: 0.2rem 1rem;
			overflow-y: auto;

			.apps {
				width: 100%;
				max-width: 500px;

				&.grid-view {
					display: inline-grid;
					grid-template-columns: repeat(5, 1fr);
					justify-content: center;
					gap: 10px 15px;
				}

				&.list-view {
					display: flex;
					flex-direction: column;
					gap: 4px;
					padding: 4px 0;
				}
			}

			.loading-state {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 16px;
				color: #666;

				.loading-spinner {
					animation: spin 1s linear infinite;
					border: 3px solid #e0e0e0;
					border-top: 3px solid #007acc;
					border-radius: 50%;
					width: 32px;
					height: 32px;
				}

				p {
					margin: 0;
					font-weight: 500;
					font-size: 14px;
				}
			}

			.error-state {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 12px;
				text-align: center;

				:global(.error-icon) {
					color: #d32f2f;
				}

				.error-message {
					margin: 0;
					max-width: 250px;
					color: #d32f2f;
					font-size: 14px;
				}

				.error-actions {
					display: flex;
					flex-wrap: wrap;
					justify-content: center;
					gap: 8px;
				}

				.retry-button,
				.refresh-button {
					transition: background-color 0.2s;
					cursor: pointer;
					border: none;
					border-radius: 4px;
					padding: 8px 16px;
					min-width: 80px;
					color: white;
					font-size: 12px;

					&:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}
				}

				.retry-button {
					background-color: #007acc;

					&:hover:not(:disabled) {
						background-color: #005a9e;
					}

					&:active:not(:disabled) {
						background-color: #004578;
					}
				}

				.refresh-button {
					background-color: #666;

					&:hover:not(:disabled) {
						background-color: #555;
					}

					&:active:not(:disabled) {
						background-color: #444;
					}
				}
			}

			.empty-state {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 12px;
				color: #666;
				text-align: center;

				:global(.empty-icon) {
					color: #999;
				}

				p {
					margin: 0;
					font-size: 14px;
				}

				.refresh-button {
					transition: background-color 0.2s;
					cursor: pointer;
					border: none;
					border-radius: 4px;
					background-color: #666;
					padding: 8px 16px;
					min-width: 80px;
					color: white;
					font-size: 12px;

					&:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}

					&:hover:not(:disabled) {
						background-color: #555;
					}

					&:active:not(:disabled) {
						background-color: #444;
					}
				}
			}
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}
	}
</style>
