<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { useI18n } from '$lib/i18n/hooks';
	import {
		fetchScheduledJobRun,
		fetchScheduledJobs,
		runScheduledJob,
		updateScheduledJobEnabled
	} from '../scheduler.remote';
	import type { ScheduledJobView } from '../scheduler.remote';
	import ScheduledJobsTable from './ScheduledJobsTable.svelte';
	import ScheduledJobRuns from './ScheduledJobRuns.svelte';
	import { jobDescription } from './scheduledJobFormat';

	interface Props {
		/** Csak ennek a pluginnak a feladatai; elhagyva az összes (core is) */
		pluginId?: string;
		/** Feladatok száma a betöltés után (pl. a szakasz elrejtéséhez) */
		onLoaded?: (count: number) => void;
	}

	let { pluginId, onLoaded }: Props = $props();

	const { t, locale } = useI18n();

	/** Kézi futás állapotának lekérdezési gyakorisága (ms) */
	const POLL_INTERVAL_MS = 2000;

	let jobs = $state<ScheduledJobView[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	const busy = new SvelteSet<number>();
	let runsJob = $state<ScheduledJobView | null>(null);
	let runsOpen = $state(false);
	let runsRefreshKey = $state(0);
	const pollers: ReturnType<typeof setTimeout>[] = [];

	async function load(forPlugin: string | undefined = pluginId) {
		const result = await fetchScheduledJobs(forPlugin ? { pluginId: forPlugin } : {});
		if (result.success) {
			jobs = result.data;
			error = null;
		} else {
			error = result.error;
		}
		loading = false;
		onLoaded?.(jobs.length);
	}

	function setBusy(id: number, value: boolean) {
		if (value) busy.add(id);
		else busy.delete(id);
	}

	function label(job: ScheduledJobView): string {
		return jobDescription(job, locale) ?? job.jobId;
	}

	function errorMessage(raw: string): string {
		if (raw.startsWith('JOB_ALREADY_RUNNING'))
			return t('plugin-manager.scheduler.errors.alreadyRunning');
		if (raw.startsWith('JOB_NOT_FOUND')) return t('plugin-manager.scheduler.errors.notFound');
		return raw;
	}

	async function handleToggle(job: ScheduledJobView, enabled: boolean) {
		setBusy(job.id, true);
		const result = await updateScheduledJobEnabled({ jobRef: job.id, enabled });
		setBusy(job.id, false);
		if (result.success) {
			jobs = jobs.map((j) => (j.id === job.id ? result.data : j));
			toast.success(
				t(
					enabled
						? 'plugin-manager.scheduler.enabledToast'
						: 'plugin-manager.scheduler.disabledToast',
					{
						name: label(job)
					}
				)
			);
		} else {
			toast.error(errorMessage(result.error));
		}
	}

	async function handleRun(job: ScheduledJobView) {
		setBusy(job.id, true);
		const result = await runScheduledJob({ jobRef: job.id });
		if (!result.success) {
			setBusy(job.id, false);
			toast.error(errorMessage(result.error));
			return;
		}
		toast.info(t('plugin-manager.scheduler.runStarted', { name: label(job) }));
		jobs = jobs.map((j) => (j.id === job.id ? { ...j, running: true } : j));
		pollRun(job, result.data.runId);
	}

	/** A kézi futás követése a befejezésig, utána a lista frissítése. */
	function pollRun(job: ScheduledJobView, runId: number) {
		const handle = setTimeout(async () => {
			pollers.splice(pollers.indexOf(handle), 1);
			const result = await fetchScheduledJobRun({ runId });
			const run = result.success ? result.data : null;
			if (run && run.status === 'running') {
				pollRun(job, runId);
				return;
			}
			setBusy(job.id, false);
			await load();
			runsRefreshKey++;
			if (run?.status === 'success') {
				toast.success(
					t('plugin-manager.scheduler.runFinished', { name: label(job) }) +
						(run.summary ? ` — ${run.summary}` : '')
				);
			} else if (run) {
				toast.error(
					t('plugin-manager.scheduler.runFailed', { name: label(job) }) +
						(run.error ? ` — ${run.error}` : '')
				);
			}
		}, POLL_INTERVAL_MS);
		pollers.push(handle);
	}

	function handleShowRuns(job: ScheduledJobView) {
		runsJob = job;
		runsOpen = true;
	}

	$effect(() => {
		const id = pluginId;
		untrack(() => load(id));
	});

	onDestroy(() => {
		for (const handle of pollers) clearTimeout(handle);
	});
</script>

{#if loading}
	<p class="muted">{t('common.status.loading')}</p>
{:else if error}
	<p class="error-text">{error}</p>
{:else if jobs.length === 0}
	<p class="muted">{t('plugin-manager.scheduler.empty')}</p>
{:else}
	<ScheduledJobsTable
		{jobs}
		{busy}
		showPlugin={!pluginId}
		onToggle={handleToggle}
		onRun={handleRun}
		onShowRuns={handleShowRuns}
	/>
{/if}

<Dialog.Root bind:open={runsOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>
				{t('plugin-manager.scheduler.historyTitle', { name: runsJob ? label(runsJob) : '' })}
			</Dialog.Title>
		</Dialog.Header>
		{#if runsJob}
			<ScheduledJobRuns job={runsJob} refreshKey={runsRefreshKey} />
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	.muted {
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.error-text {
		color: var(--color-red-600);
		font-size: 0.875rem;
	}
</style>
