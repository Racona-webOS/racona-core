<!--
 Mobil kezdőképernyő: a mobilon támogatott appok gyors műveletei (mobil bejegyzései)
 és a teljes egészében mobilon használható appok.
 -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Smartphone } from 'lucide-svelte';
	import { getApps } from '$lib/services/client/appRegistry';
	import { getWindowManager } from '$lib/stores';
	import { UniversalIcon } from '$lib/components/shared';
	import { useI18n } from '$lib/i18n/hooks';
	import type { AppMetadata, AppMobileEntry } from '$lib/types/window';
	import { openMobileApp, openMobileEntry } from './mobileNavigation';

	const { t } = useI18n();
	const windowManager = getWindowManager();

	let apps = $state<AppMetadata[]>([]);
	let loaded = $state(false);

	onMount(() => {
		getApps()
			.then((result) => (apps = result))
			.catch((err) => console.error('[MobileHome] Failed to load apps:', err))
			.finally(() => (loaded = true));
	});

	const mobileApps = $derived(apps.filter((app) => app.mobile));
	const quickActions = $derived(
		mobileApps.flatMap((app) =>
			(app.mobile?.entries ?? []).map((entry) => ({ app, entry }) as const)
		)
	);
	const wholeApps = $derived(mobileApps.filter((app) => (app.mobile?.entries ?? []).length === 0));

	function handleEntry(app: AppMetadata, entry: AppMobileEntry) {
		openMobileEntry(windowManager, app, entry);
	}
</script>

{#if loaded && quickActions.length === 0 && wholeApps.length === 0}
	<div class="mobile-empty">
		<Smartphone class="size-10 opacity-40" />
		<p>{t('desktop.mobile.home.empty')}</p>
	</div>
{/if}

{#if quickActions.length > 0}
	<section class="mobile-section">
		<h2 class="mobile-section-title">{t('desktop.mobile.home.quickActions')}</h2>
		<div class="quick-actions">
			{#each quickActions as { app, entry } (`${app.appName}:${entry.id}`)}
				<button class="quick-action" onclick={() => handleEntry(app, entry)}>
					<span class="quick-action-icon">
						<UniversalIcon icon={entry.icon ?? app.icon ?? ''} size={24} appName={app.appName} />
					</span>
					<span class="quick-action-label">{entry.label}</span>
					<span class="quick-action-app">{app.title}</span>
				</button>
			{/each}
		</div>
	</section>
{/if}

{#if wholeApps.length > 0}
	<section class="mobile-section">
		<h2 class="mobile-section-title">{t('desktop.mobile.home.apps')}</h2>
		<div class="app-grid">
			{#each wholeApps as app (app.appName)}
				<button class="app-tile" onclick={() => openMobileApp(windowManager, app)}>
					<span class="app-tile-icon">
						<UniversalIcon icon={app.icon ?? ''} size={28} appName={app.appName} />
					</span>
					<span class="app-tile-title">{app.title}</span>
				</button>
			{/each}
		</div>
	</section>
{/if}

<style>
	.mobile-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 1.5rem;
		color: var(--muted-foreground);
		text-align: center;
	}

	.mobile-section + .mobile-section {
		margin-top: 1.75rem;
	}

	.mobile-section-title {
		margin-bottom: 0.75rem;
		color: var(--muted-foreground);
		font-weight: 600;
		font-size: 0.8125rem;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.quick-action {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.375rem;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--card);
		padding: 1rem;
		min-height: 7.5rem;
		text-align: left;

		&:active {
			background: var(--muted);
		}
	}

	.quick-action-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 0.25rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--primary) 12%, transparent);
		width: 2.75rem;
		height: 2.75rem;
		color: var(--primary);
	}

	.quick-action-label {
		font-weight: 600;
		line-height: 1.25;
	}

	.quick-action-app {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}

	.app-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem 0.5rem;
	}

	.app-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
	}

	.app-tile-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--card);
		width: 3.5rem;
		height: 3.5rem;
	}

	.app-tile-title {
		width: 100%;
		overflow: hidden;
		font-size: 0.75rem;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
