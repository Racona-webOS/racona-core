<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Play, ScrollText, LoaderCircle } from 'lucide-svelte/icons';
	import { useI18n } from '$lib/i18n/hooks';
	import type { ScheduledJobView } from '../scheduler.remote';
	import {
		formatDateTime,
		formatDuration,
		jobDescription,
		statusVariant
	} from './scheduledJobFormat';

	interface Props {
		jobs: ScheduledJobView[];
		/** Mutassa-e a plugin azonosítóját (az összesítő listában) */
		showPlugin?: boolean;
		/** Éppen műveletben lévő feladatok (kapcsolás, indítás) */
		busy: ReadonlySet<number>;
		onToggle: (job: ScheduledJobView, enabled: boolean) => void;
		onRun: (job: ScheduledJobView) => void;
		onShowRuns: (job: ScheduledJobView) => void;
	}

	let { jobs, showPlugin = false, busy, onToggle, onRun, onShowRuns }: Props = $props();

	const { t, locale } = useI18n();
</script>

<!--
	Konténer-lekérdezéssel reszponzív lista: széles helyen soronként egy feladat
	oszlopokkal, keskeny ablakban (pl. a plugin részletező oldalán) kártyák.
-->
<div class="jobs">
	<div class="list">
		<div class="job job-header" aria-hidden="true">
			<span>{t('plugin-manager.scheduler.columns.job')}</span>
			<span>{t('plugin-manager.scheduler.columns.nextRun')}</span>
			<span>{t('plugin-manager.scheduler.columns.lastRun')}</span>
			<span class="text-right">{t('plugin-manager.scheduler.columns.actions')}</span>
		</div>

		{#each jobs as job (job.id)}
			<div class="job">
				<div class="cell">
					<div class="job-name">{jobDescription(job, locale) ?? job.jobId}</div>
					<div class="job-id">
						{showPlugin
							? (job.pluginId ?? t('plugin-manager.scheduler.core')) + ' / '
							: ''}{job.jobId}
					</div>
					<div class="muted">
						<span class="font-mono">{job.schedule}</span> · {job.timezone}
					</div>
				</div>

				<div class="cell">
					<span class="cell-label">{t('plugin-manager.scheduler.columns.nextRun')}</span>
					{#if job.enabled && job.nextRunAt}
						<span class="text-sm">{formatDateTime(job.nextRunAt, locale)}</span>
					{:else}
						<span class="muted">—</span>
					{/if}
				</div>

				<div class="cell">
					<span class="cell-label">{t('plugin-manager.scheduler.columns.lastRun')}</span>
					{#if job.running}
						<div>
							<Badge variant="outline" class="gap-1">
								<LoaderCircle class="size-3 animate-spin" />
								{t('plugin-manager.scheduler.status.running')}
							</Badge>
						</div>
					{:else if job.lastRunAt && job.lastStatus}
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant={statusVariant(job.lastStatus)}>
								{t(`plugin-manager.scheduler.status.${job.lastStatus}`)}
							</Badge>
							<span class="muted">{formatDateTime(job.lastRunAt, locale)}</span>
							<span class="muted">{formatDuration(job.lastDurationMs)}</span>
						</div>
						{#if job.lastError && job.lastStatus !== 'success'}
							<div class="error-text" title={job.lastError}>{job.lastError}</div>
						{/if}
					{:else}
						<span class="muted">{t('plugin-manager.scheduler.neverRun')}</span>
					{/if}
				</div>

				<div class="cell actions">
					<label class="toggle">
						<Switch
							checked={job.enabled}
							disabled={busy.has(job.id)}
							onclick={() => onToggle(job, !job.enabled)}
						/>
						<span class="muted">{t('plugin-manager.scheduler.columns.enabled')}</span>
					</label>
					<div class="buttons">
						<Button
							variant="outline"
							size="sm"
							disabled={job.running || busy.has(job.id)}
							onclick={() => onRun(job)}
						>
							<Play class="size-3.5" />
							{t('plugin-manager.scheduler.runNow')}
						</Button>
						<Button variant="ghost" size="sm" onclick={() => onShowRuns(job)}>
							<ScrollText class="size-3.5" />
							{t('plugin-manager.scheduler.history')}
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.jobs {
		container-type: inline-size;
		width: 100%;
	}

	.list {
		display: flex;
		flex-direction: column;
	}

	/* Keskeny: kártyák, a cellák egymás alatt, címkével */
	.job {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.625rem;
		border-bottom: 1px solid var(--color-neutral-200);
		padding: 0.875rem 0.25rem;
	}

	:global(.dark) .job {
		border-color: var(--color-neutral-800);
	}

	.job-header {
		display: none;
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.cell-label {
		color: var(--color-neutral-500);
		font-weight: 500;
		font-size: 0.75rem;
	}

	.actions {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	/* Közepes: a következő és az utolsó futás egymás mellett */
	@container (min-width: 380px) {
		.job {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.job > .cell:first-child,
		.job > .actions {
			grid-column: 1 / -1;
		}
	}

	/* Széles: közös rács (subgrid), hogy a fejléc és a sorok oszlopai egyezzenek */
	@container (min-width: 720px) {
		.list {
			display: grid;
			grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr) minmax(0, 1.4fr) auto;
			column-gap: 1rem;
		}

		.job {
			grid-template-columns: subgrid;
			grid-column: 1 / -1;
			align-items: center;
		}

		.job > .cell:first-child,
		.job > .actions {
			grid-column: auto;
		}

		.job-header {
			display: grid;
			padding-top: 0.25rem;
			padding-bottom: 0.5rem;
			color: var(--color-neutral-500);
			font-weight: 500;
			font-size: 0.8125rem;
		}

		.cell-label {
			display: none;
		}

		.actions {
			flex-wrap: nowrap;
			justify-content: flex-end;
		}

		.toggle .muted {
			display: none;
		}
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.buttons {
		display: flex;
		gap: 0.25rem;
	}

	.job-name {
		font-weight: 500;
	}

	.job-id {
		color: var(--color-neutral-500);
		font-size: 0.75rem;
		font-family: var(--font-mono, monospace);
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--color-neutral-500);
		font-size: 0.8125rem;
	}

	.error-text {
		overflow: hidden;
		color: var(--color-red-600);
		font-size: 0.75rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.dark) .error-text {
		color: var(--color-red-400);
	}
</style>
