<script lang="ts">
	import { getAppParameters, getParameter, getWindowId } from '$lib/services/client/appContext';
	import { getWindowManager } from '$lib/stores';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();
	const helpId = getParameter<number | undefined>('helpId', undefined);
	const parameters = getAppParameters();
	const helps = [
		{
			id: 1,
			title: 'Beállítások',
			content: 'Beállítások súgó tartalom lesz ez.'
		},
		{
			id: 2,
			title: 'Felhasználók',
			content: 'Felhasználók súgó tartalom lesz ez.'
		},
		{
			id: 3,
			title: 'Súgó',
			content: 'Súgó súgó tartalom lesz ez.'
		},
		{
			id: 1000,
			title: 'Alkalmazás megnyitás guid alapján',
			content: 'Súgó tartalom lesz ez.'
		}
	];

	const help = helps.find((h) => h.id === helpId);
	if (help) {
		const windowManager = getWindowManager();
		const windowId = getWindowId();
		const windowData = windowManager.windows.find((w) => w.id === windowId);
		if (windowData) {
			windowManager.updateWindowTitle(windowId, windowData.title + ' - ' + help.title);
		}
	}
</script>

<div>
	{#if helpId}
		{#if help}
			<p>{help.content}</p>
		{:else}
			<p>{t('help.notFound')}</p>
		{/if}
	{:else}
		<p>{t('help.generalContent')}</p>
	{/if}
</div>
