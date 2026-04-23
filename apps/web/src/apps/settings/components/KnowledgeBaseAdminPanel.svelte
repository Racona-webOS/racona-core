<!--
  KnowledgeBaseAdminPanel — Knowledge Base admin kezelő panel

  Az adminisztrátor itt kezelheti a Knowledge Base-t:
  - Nyelvi választó (Magyar/Angol)
  - Re-index gombok (külön minden nyelvhez + összes)
  - Státusz megjelenítés (indexelt dokumentumok száma nyelvenkénti bontásban)
  - Utolsó indexelés timestamp
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { useI18n } from '$lib/i18n/hooks';
	import { reindexKnowledgeBase, getKnowledgeBaseStatus } from '../knowledge-base.remote.js';
	import type { KnowledgeBaseStatus, KnowledgeBaseLocale } from '$lib/server/ai-assistant/types.js';
	import { RefreshCw, Database, Clock, FileText, Languages } from 'lucide-svelte';

	const { t } = useI18n('settings');

	// -------------------------------------------------------------------------
	// Állapot
	// -------------------------------------------------------------------------

	let loading = $state(true);
	let reindexing = $state<KnowledgeBaseLocale | 'all' | null>(null);
	let status = $state<KnowledgeBaseStatus | null>(null);

	// -------------------------------------------------------------------------
	// Derived
	// -------------------------------------------------------------------------

	const isReindexing = $derived(reindexing !== null);

	// -------------------------------------------------------------------------
	// Betöltés
	// -------------------------------------------------------------------------

	onMount(async () => {
		await loadStatus();
	});

	async function loadStatus() {
		loading = true;
		try {
			const result = await getKnowledgeBaseStatus({});

			if (result.success && result.status) {
				status = result.status;
			} else {
				toast.error(result.error ?? t('settings.admin.knowledgeBase.statusLoadError'));
			}
		} catch (err) {
			console.error('[KnowledgeBaseAdminPanel] Státusz betöltési hiba:', err);
			toast.error(t('settings.admin.knowledgeBase.statusLoadError'));
		} finally {
			loading = false;
		}
	}

	// -------------------------------------------------------------------------
	// Újraindexelés
	// -------------------------------------------------------------------------

	async function handleReindex(locale?: KnowledgeBaseLocale) {
		const reindexType = locale || 'all';
		reindexing = reindexType;

		try {
			const result = await reindexKnowledgeBase({ locale });

			if (result.success) {
				toast.success(result.message ?? t('settings.admin.knowledgeBase.reindexSuccess'));

				// Státusz frissítése
				await loadStatus();
			} else {
				toast.error(result.error ?? t('settings.admin.knowledgeBase.reindexError'));
			}
		} catch (err) {
			console.error('[KnowledgeBaseAdminPanel] Újraindexelési hiba:', err);
			toast.error(t('settings.admin.knowledgeBase.reindexError'));
		} finally {
			reindexing = null;
		}
	}

	// -------------------------------------------------------------------------
	// Formázó függvények
	// -------------------------------------------------------------------------

	function formatUptime(uptime: number): string {
		const seconds = Math.floor(uptime / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days}d ${hours % 24}h ${minutes % 60}m`;
		} else if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}

	function formatDate(date: Date | null): string {
		if (!date) return t('settings.admin.knowledgeBase.neverIndexed');

		return new Intl.DateTimeFormat('hu-HU', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		}).format(new Date(date));
	}

	function getLocaleDisplayName(locale: KnowledgeBaseLocale): string {
		return locale === 'hu' ? 'Magyar' : 'English';
	}

	function getLocaleFlag(locale: KnowledgeBaseLocale): string {
		return locale === 'hu' ? '🇭🇺' : '🇬🇧';
	}
</script>

<div class="kb-admin-panel">
	{#if loading}
		<div class="kb-admin-panel__loading">
			<span class="kb-admin-panel__spinner"></span>
			<span>{t('settings.admin.knowledgeBase.loading')}</span>
		</div>
	{:else if status}
		<div class="kb-admin-panel__content">
			<!-- Összesítő információk -->
			<div class="kb-admin-panel__summary">
				<div class="kb-admin-panel__summary-item">
					<Database class="h-5 w-5 text-blue-500" />
					<div>
						<div class="kb-admin-panel__summary-value">{status.totalDocuments}</div>
						<div class="kb-admin-panel__summary-label">
							{t('settings.admin.knowledgeBase.totalDocuments')}
						</div>
					</div>
				</div>
				<div class="kb-admin-panel__summary-item">
					<FileText class="h-5 w-5 text-green-500" />
					<div>
						<div class="kb-admin-panel__summary-value">{status.totalChunks}</div>
						<div class="kb-admin-panel__summary-label">
							{t('settings.admin.knowledgeBase.totalChunks')}
						</div>
					</div>
				</div>
				<div class="kb-admin-panel__summary-item">
					<Clock class="h-5 w-5 text-purple-500" />
					<div>
						<div class="kb-admin-panel__summary-value">{formatUptime(status.uptime)}</div>
						<div class="kb-admin-panel__summary-label">
							{t('settings.admin.knowledgeBase.uptime')}
						</div>
					</div>
				</div>
			</div>

			<!-- Nyelvenkénti részletek -->
			<div class="kb-admin-panel__locales">
				<h3 class="kb-admin-panel__section-title">
					<Languages class="h-5 w-5" />
					{t('settings.admin.knowledgeBase.languageDetails')}
				</h3>

				{#each Object.entries(status.locales) as [locale, localeStatus] (locale)}
					<div class="kb-admin-panel__locale-card">
						<div class="kb-admin-panel__locale-header">
							<div class="kb-admin-panel__locale-title">
								<span class="kb-admin-panel__locale-flag"
									>{getLocaleFlag(locale as KnowledgeBaseLocale)}</span
								>
								<span class="kb-admin-panel__locale-name"
									>{getLocaleDisplayName(locale as KnowledgeBaseLocale)}</span
								>
								<span
									class="kb-admin-panel__locale-status {localeStatus.isLoaded
										? 'loaded'
										: 'not-loaded'}"
								>
									{localeStatus.isLoaded
										? t('settings.admin.knowledgeBase.loaded')
										: t('settings.admin.knowledgeBase.notLoaded')}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={() => handleReindex(locale as KnowledgeBaseLocale)}
								disabled={isReindexing}
							>
								<RefreshCw class="mr-2 h-4 w-4 {reindexing === locale ? 'animate-spin' : ''}" />
								{reindexing === locale
									? t('settings.admin.knowledgeBase.reindexing')
									: t('settings.admin.knowledgeBase.reindexLanguage')}
							</Button>
						</div>

						<div class="kb-admin-panel__locale-stats">
							<div class="kb-admin-panel__stat">
								<Label>{t('settings.admin.knowledgeBase.documents')}</Label>
								<span class="kb-admin-panel__stat-value">{localeStatus.documentCount}</span>
							</div>
							<div class="kb-admin-panel__stat">
								<Label>{t('settings.admin.knowledgeBase.chunks')}</Label>
								<span class="kb-admin-panel__stat-value">{localeStatus.chunkCount}</span>
							</div>
							<div class="kb-admin-panel__stat">
								<Label>{t('settings.admin.knowledgeBase.lastIndexed')}</Label>
								<span class="kb-admin-panel__stat-value"
									>{formatDate(localeStatus.lastIndexed)}</span
								>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Globális műveletek -->
			<div class="kb-admin-panel__actions">
				<Button variant="default" onclick={() => handleReindex()} disabled={isReindexing}>
					<RefreshCw class="mr-2 h-4 w-4 {reindexing === 'all' ? 'animate-spin' : ''}" />
					{reindexing === 'all'
						? t('settings.admin.knowledgeBase.reindexingAll')
						: t('settings.admin.knowledgeBase.reindexAll')}
				</Button>
				<Button variant="outline" onclick={loadStatus} disabled={loading}>
					<RefreshCw class="mr-2 h-4 w-4 {loading ? 'animate-spin' : ''}" />
					{t('settings.admin.knowledgeBase.refreshStatus')}
				</Button>
			</div>
		</div>
	{:else}
		<div class="kb-admin-panel__error">
			<p>{t('settings.admin.knowledgeBase.statusUnavailable')}</p>
			<Button variant="outline" onclick={loadStatus}>
				{t('settings.admin.knowledgeBase.retry')}
			</Button>
		</div>
	{/if}
</div>

<style>
	.kb-admin-panel {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		height: 100%;
		overflow-y: auto;
	}

	.kb-admin-panel__loading,
	.kb-admin-panel__error {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		height: 100%;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.kb-admin-panel__spinner {
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

	.kb-admin-panel__content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 800px;
	}

	.kb-admin-panel__summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.kb-admin-panel__summary-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		background: var(--color-neutral-50);
		padding: 1rem;
	}

	:global(.dark) .kb-admin-panel__summary-item {
		border-color: var(--color-neutral-700);
		background: var(--color-neutral-800);
	}

	.kb-admin-panel__summary-value {
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 1.5rem;
		line-height: 1;
	}

	:global(.dark) .kb-admin-panel__summary-value {
		color: var(--color-neutral-100);
	}

	.kb-admin-panel__summary-label {
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.kb-admin-panel__section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 1.125rem;
	}

	:global(.dark) .kb-admin-panel__section-title {
		color: var(--color-neutral-100);
	}

	.kb-admin-panel__locales {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.kb-admin-panel__locale-card {
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		background: var(--color-neutral-50);
		padding: 1.5rem;
	}

	:global(.dark) .kb-admin-panel__locale-card {
		border-color: var(--color-neutral-700);
		background: var(--color-neutral-800);
	}

	.kb-admin-panel__locale-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.kb-admin-panel__locale-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.kb-admin-panel__locale-flag {
		font-size: 1.25rem;
	}

	.kb-admin-panel__locale-name {
		color: var(--color-neutral-900);
		font-weight: 600;
		font-size: 1rem;
	}

	:global(.dark) .kb-admin-panel__locale-name {
		color: var(--color-neutral-100);
	}

	.kb-admin-panel__locale-status {
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-weight: 500;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.kb-admin-panel__locale-status.loaded {
		background: var(--color-green-100);
		color: var(--color-green-800);
	}

	.kb-admin-panel__locale-status.not-loaded {
		background: var(--color-red-100);
		color: var(--color-red-800);
	}

	:global(.dark) .kb-admin-panel__locale-status.loaded {
		background: var(--color-green-900);
		color: var(--color-green-200);
	}

	:global(.dark) .kb-admin-panel__locale-status.not-loaded {
		background: var(--color-red-900);
		color: var(--color-red-200);
	}

	.kb-admin-panel__locale-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.kb-admin-panel__stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.kb-admin-panel__stat-value {
		color: var(--color-neutral-900);
		font-weight: 500;
		font-size: 0.875rem;
	}

	:global(.dark) .kb-admin-panel__stat-value {
		color: var(--color-neutral-100);
	}

	.kb-admin-panel__actions {
		display: flex;
		gap: 0.75rem;
		border-top: 1px solid var(--color-neutral-200);
		padding-top: 1.5rem;
	}

	:global(.dark) .kb-admin-panel__actions {
		border-top-color: var(--color-neutral-700);
	}
</style>
