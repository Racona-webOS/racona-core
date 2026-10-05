<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-svelte/icons';
	import { useI18n } from '$lib/i18n/hooks';
	import { fetchScheduledJobRuns } from '../scheduler.remote';
	import type { ScheduledJobRunView, ScheduledJobView } from '../scheduler.remote';
	import { formatDateTime, formatDuration, statusVariant } from './scheduledJobFormat';

	interface Props {
		job: ScheduledJobView;
		/** Növelése újratölti a listát (pl. kézi futtatás után) */
		refreshKey?: number;
	}

	let { job, refreshKey = 0 }: Props = $props();

	const { t, locale } = useI18n();

	let runs = $state<ScheduledJobRunView[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	const expanded = new SvelteSet<number>();

	async function load() {
		loading = true;
		error = null;
		const result = await fetchScheduledJobRuns({ jobRef: job.id, limit: 50 });
		if (result.success) {
			runs = result.data;
		} else {
			error = result.error;
		}
		loading = false;
	}

	function toggle(id: number) {
		if (expanded.has(id)) expanded.delete(id);
		else expanded.add(id);
	}

	// Újratöltés más feladatnál vagy kívülről kért frissítésnél (mindkettőt olvassuk)
	$effect(() => {
		if (job.id > 0 && refreshKey >= 0) untrack(() => load());
	});
</script>

<div class="runs">
	<div class="flex justify-end">
		<Button variant="ghost" size="sm" onclick={load} disabled={loading}>
			<RefreshCw class={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
			{t('plugin-manager.scheduler.refresh')}
		</Button>
	</div>

	{#if error}
		<p class="error-text">{error}</p>
	{:else if !loading && runs.length === 0}
		<p class="muted">{t('plugin-manager.scheduler.noRuns')}</p>
	{:else}
		<ul class="run-list">
			{#each runs as run (run.id)}
				<li class="run">
					<button type="button" class="run-header" onclick={() => toggle(run.id)}>
						{#if expanded.has(run.id)}
							<ChevronDown class="size-4 shrink-0" />
						{:else}
							<ChevronRight class="size-4 shrink-0" />
						{/if}
						<Badge variant={statusVariant(run.status)}>
							{t(`plugin-manager.scheduler.status.${run.status}`)}
						</Badge>
						<span class="run-time">{formatDateTime(run.startedAt, locale)}</span>
						<span class="muted">{formatDuration(run.durationMs)}</span>
						<span class="muted run-trigger">
							{run.trigger === 'manual'
								? t('plugin-manager.scheduler.trigger.manual', { name: run.triggeredByName ?? '—' })
								: t('plugin-manager.scheduler.trigger.schedule')}
						</span>
					</button>
					{#if run.summary}
						<div class="run-summary">{run.summary}</div>
					{/if}
					{#if run.error}
						<div class="error-text">{run.error}</div>
					{/if}
					{#if expanded.has(run.id)}
						<div class="run-details">
							{#if run.scheduledFor}
								<div class="muted">
									{t('plugin-manager.scheduler.scheduledFor')}: {formatDateTime(
										run.scheduledFor,
										locale
									)}
								</div>
							{/if}
							{#if run.logs.length > 0}
								<pre class="logs">{run.logs
										.map(
											(l) => `${l.at.slice(11, 19)} ${l.level.toUpperCase().padEnd(5)} ${l.message}`
										)
										.join('\n')}</pre>
							{:else}
								<div class="muted">{t('plugin-manager.scheduler.noLogs')}</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.runs {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.run-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.run {
		border: 1px solid var(--color-neutral-200);
		border-radius: var(--radius-md, 0.375rem);
		padding: 0.5rem 0.75rem;
	}

	:global(.dark) .run {
		border-color: var(--color-neutral-800);
	}

	.run-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
		width: 100%;
		color: inherit;
		text-align: left;
	}

	.run-time {
		font-size: 0.875rem;
	}

	.run-trigger {
		margin-left: auto;
	}

	.run-summary {
		margin-top: 0.25rem;
		font-size: 0.875rem;
	}

	.run-details {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.logs {
		margin: 0;
		border-radius: var(--radius-sm, 0.25rem);
		background-color: var(--color-neutral-100);
		padding: 0.5rem;
		overflow-x: auto;
		font-size: 0.75rem;
		line-height: 1.4;
		white-space: pre-wrap;
	}

	:global(.dark) .logs {
		background-color: var(--color-neutral-900);
	}

	.muted {
		color: var(--color-neutral-500);
		font-size: 0.8125rem;
	}

	.error-text {
		margin-top: 0.25rem;
		color: var(--color-red-600);
		font-size: 0.8125rem;
	}

	:global(.dark) .error-text {
		color: var(--color-red-400);
	}
</style>
