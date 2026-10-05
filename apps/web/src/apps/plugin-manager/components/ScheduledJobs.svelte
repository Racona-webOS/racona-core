<script lang="ts">
	import { useI18n } from '$lib/i18n/hooks';
	import ScheduledJobsPanel from './ScheduledJobsPanel.svelte';

	const { t } = useI18n();
</script>

<div class="title-block">
	<h2>{t('plugin-manager.scheduler.title')}</h2>
	<h3>{t('plugin-manager.scheduler.description')}</h3>
</div>

<ScheduledJobsPanel />
